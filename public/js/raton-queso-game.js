// --- Configuration and global variables ---
let rows = 3, cols = 3;  // Default grid size
const acciones = ['U', 'D', 'L', 'R']; // Possible actions
const dir = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] }; // Directions mapping
const emojis = { U: '⬆️', D: '⬇️', L: '⬅️', R: '➡️' }; // Emojis for actions
const REFORZAMIENTO_BASE = 5; // Base reward points
const VALOR_INICIAL_PAPELETA = 3; // Starting tickets per action
const MAX_PASOS_POR_PARTIDA = () => rows * cols * 2; // Dynamic limit based on grid size
let vasos = {}; // Global state of the urns (Q-table approximation)
let trail = []; // Stores the path keys (S_r,c) for animation in simularPartida
let trailSteps = []; // Stores the steps {estado, accion} for reinforcement in simularPartida
let shortestTrailLength = Infinity; // Tracks the best path length found so far globally
let simulationRunning = false; // Flag to prevent concurrent simulations/training

// --- Grid and UI Functions ---

function getGridSize() {
    let inputRows = parseInt(document.getElementById("gridRows").value);
    let inputCols = parseInt(document.getElementById("gridCols").value);
    rows = (!isNaN(inputRows) && inputRows >= 2 && inputRows <= 10) ? inputRows : 3;
    cols = (!isNaN(inputCols) && inputCols >= 2 && inputCols <= 10) ? inputCols : 3;
    document.getElementById("gridRows").value = rows;
    document.getElementById("gridCols").value = cols;
}

function updateGridLayout() {
    const gridElem = document.getElementById("tablero");
    if (!gridElem) return;
    gridElem.style.gridTemplateColumns = `repeat(${cols}, 4.5rem)`; // Match cell width
    gridElem.style.gridTemplateRows = `repeat(${rows}, 4.5rem)`; // Match cell height
}

function crearVasos() {
    let v = {};
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let key = `S${i},${j}`;
            v[key] = {};
            for (let a of acciones) {
                let ni = i + dir[a][0];
                let nj = j + dir[a][1];
                if (ni >= 0 && ni < rows && nj >= 0 && nj < cols) {
                    v[key][a] = VALOR_INICIAL_PAPELETA;
                }
            }
        }
    }
    return v;
}

function renderTablero(ratonPos = [0, 0]) {
    const tablero = document.getElementById('tablero');
    if (!tablero) return; // Safety check
    tablero.innerHTML = '';
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let key = `S${i},${j}`;
            let cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell${i}_${j}`;
            if (i === rows - 1 && j === cols - 1) cell.classList.add('cheese');
            // Highlight path only if trail has elements and cell is in trail
            if (trail.length > 0 && trail.includes(key) && !(i === ratonPos[0] && j === ratonPos[1])) {
                cell.classList.add('path');
            }
            if (i === ratonPos[0] && j === ratonPos[1]) {
                let raton = document.createElement('div');
                raton.className = 'raton';
                raton.textContent = '🐭';
                cell.appendChild(raton);
                cell.classList.add('highlightMouse');
            }
            tablero.appendChild(cell);
        }
    }
}

function renderVasos(animPasos = [], tipoAnim = '') {
    const container = document.getElementById('estadoVasos');
    if (!container) return; // Safety check

    let html = `<table class="vasos-table"><thead><tr><th class="sticky top-0 z-10 bg-gray-200">Estado</th>`;
    acciones.forEach(a => html += `<th class="sticky top-0 z-10 bg-gray-200">${emojis[a]}<br>${a}</th>`);
    html += `</tr></thead><tbody>`;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let key = `S${i},${j}`;
            if (!vasos[key]) continue; // Ensure state exists
            html += `<tr><td class="font-semibold bg-gray-100"><b>${key}</b></td>`;
            acciones.forEach(a => {
                let val = vasos[key]?.[a];
                let animClass = '';
                if (animPasos.some(p => p.estado === key && p.accion === a)) {
                    if (tipoAnim === 'refuerzo') animClass = 'vaso-anim-refuerzo';
                    else if (tipoAnim === 'penaliza') animClass = 'vaso-anim-penaliza';
                }
                html += `<td class="${animClass}">${val !== undefined ? Math.round(val) : '-'}</td>`;
            });
            html += `</tr>`;
        }
    }
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// --- Utility Functions ---

function elegirAccion(vasoEstado) {
    if (!vasoEstado) return null;
    const accionesDisponibles = Object.keys(vasoEstado);
    if (accionesDisponibles.length === 0) return null;
    const totalPapeletas = accionesDisponibles.reduce((sum, a) => sum + Math.max(0, vasoEstado[a]), 0);
    if (totalPapeletas <= 0) {
        // Fallback if all actions have 0 or negative tickets: pick one at random
        return accionesDisponibles[Math.floor(Math.random() * accionesDisponibles.length)];
    }
    let rand = Math.random() * totalPapeletas;
    let sumaAcumulada = 0;
    for (let a of accionesDisponibles) {
        sumaAcumulada += Math.max(0, vasoEstado[a]);
        if (rand < sumaAcumulada) return a;
    }
    // Fallback, should ideally not be reached if totalPapeletas > 0
    return accionesDisponibles[accionesDisponibles.length - 1];
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function animarVasos(pasosAfectados, tipoAnim) {
    renderVasos(pasosAfectados, tipoAnim);
    await sleep(600); // Duration of the animation
    renderVasos(); // Render normally after animation
}

function setUIEnabled(enabled) {
    simulationRunning = !enabled;
    const elementsToToggle = [
        'btnSimular', 'btnSimularMulti', 'btnSimularBloques', 'btnReiniciar',
        'gridRows', 'gridCols', 'numSim'
    ];
    elementsToToggle.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.disabled = !enabled;
    });
}

// --- Simulation Logic ---

async function simularPartida(speedFactor = 1, isBatch = false) {
    if (simulationRunning && !isBatch) return;
    if (!isBatch) setUIEnabled(false);
    getGridSize(); // Ensure grid size is current

    // Reset state for this specific visual simulation run
    let estado = [0, 0];
    let pasosTomados = []; // All steps taken in this run
    trail = []; // Reset visual trail for this run
    trailSteps = []; // Reset effective steps for reinforcement for this run
    let visited = new Set(); // Visited states in the current path being built

    let startKey = `S${estado[0]},${estado[1]}`;
    trail.push(startKey); // Initialize visual trail
    visited.add(startKey);
    renderTablero(estado); // Initial render, clears previous path highlight

    let maxPasos = MAX_PASOS_POR_PARTIDA();
    let llegóAlQueso = false;
    let stepsInThisPartida = 0;

    for (let i = 0; i < maxPasos; i++) {
        stepsInThisPartida++;
        let keyActual = `S${estado[0]},${estado[1]}`;

        if (!vasos[keyActual]) {
            if (window.CustomTerminal) window.CustomTerminal.write(`ERROR: Estado ${keyActual} no existe en 'vasos'. Partida terminada.`);
            break;
        }
        let accion = elegirAccion(vasos[keyActual]);

        if (!accion) {
            if (window.CustomTerminal) window.CustomTerminal.write(`WARNING: No hay acciones válidas desde ${keyActual}. Partida terminada.`);
            break;
        }

        await sleep(Math.max(75, 400 / speedFactor)); // Animation delay

        pasosTomados.push({ estado: keyActual, accion }); // Record step taken from keyActual

        let nuevoEstado = [estado[0] + dir[accion][0], estado[1] + dir[accion][1]];
        let nuevoKey = `S${nuevoEstado[0]},${nuevoEstado[1]}`;
        let currentStep = { estado: keyActual, accion: accion }; // Define step before checking cheese

        // --- Check for Cheese FIRST ---
        if (nuevoEstado[0] === rows - 1 && nuevoEstado[1] === cols - 1) {
            llegóAlQueso = true;
            estado = nuevoEstado; // Move mouse state TO the cheese
            trailSteps.push(currentStep); // Add final step to reinforcement path
            if (!trail.includes(nuevoKey)) trail.push(nuevoKey); // Add final step to visual path
            renderTablero(estado); // Render mouse ON the cheese
            await sleep(Math.max(75, 400 / speedFactor)); // Pause on cheese
            break; // Exit loop immediately after reaching cheese
        }
        // --- End Cheese Check ---

        // --- If not cheese, proceed with Loop Detection & Normal Move ---
        let loopDetected = visited.has(nuevoKey);

        if (loopDetected) {
            let loopStartIndex = -1;
            // Find the first step *in trailSteps* whose destination was 'nuevoKey'
            for (let k = 0; k < trailSteps.length; k++) {
                const stepK_state = trailSteps[k].estado;
                const stepK_action = trailSteps[k].accion;
                const state_entered_after_k_coords = [
                    parseInt(stepK_state.split(',')[0].substring(1)) + dir[stepK_action][0],
                    parseInt(stepK_state.split(',')[1]) + dir[stepK_action][1]
                ];
                const state_entered_after_k = `S${state_entered_after_k_coords[0]},${state_entered_after_k_coords[1]}`;
                if (state_entered_after_k === nuevoKey) {
                    loopStartIndex = k + 1; // Loop involves steps from index k+1 onwards
                    break;
                }
            }

            if (loopStartIndex !== -1) {
                // Remove steps forming the loop from trailSteps (for reinforcement)
                const removedSteps = trailSteps.splice(loopStartIndex);

                // Backtrack visited set (for future loop detection)
                removedSteps.forEach(step => {
                    const r_state = step.estado; const r_action = step.accion;
                    const r_entered_coords = [
                        parseInt(r_state.split(',')[0].substring(1)) + dir[r_action][0],
                        parseInt(r_state.split(',')[1]) + dir[r_action][1]
                    ];
                    const r_entered_key = `S${r_entered_coords[0]},${r_entered_coords[1]}`;
                    // Only remove from visited if no remaining step leads to it
                    if (!trailSteps.some(s => `S${parseInt(s.estado.split(',')[0].substring(1)) + dir[s.accion][0]},${parseInt(s.estado.split(',')[1]) + dir[s.accion][1]}` === r_entered_key)) {
                        visited.delete(r_entered_key);
                    }
                });

                // --- CORRECT VISUAL TRAIL ---
                // Reconstruct 'trail' based on the pruned 'trailSteps'
                trail = [`S0,0`]; // Start with the initial state
                trailSteps.forEach(step => {
                    const state_coords = [
                        parseInt(step.estado.split(',')[0].substring(1)) + dir[step.accion][0],
                        parseInt(step.estado.split(',')[1]) + dir[step.accion][1]
                    ];
                    trail.push(`S${state_coords[0]},${state_coords[1]}`);
                });
                // The 'nuevoKey' is where the loop was detected, it's part of the visual path up to this point
                if (!trail.includes(nuevoKey)) {
                    trail.push(nuevoKey);
                }
                if (window.CustomTerminal) window.CustomTerminal.write(`INFO: 🌀 Bucle detectado volviendo a ${nuevoKey}. Corrigiendo camino visual.`);
                // --- END CORRECTION ---
            }
            // Add the current step that completed the loop to trailSteps for reinforcement path
            trailSteps.push(currentStep);
            // Ensure nuevoKey is marked visited
            visited.add(nuevoKey);

        } else {
            // No loop detected
            trailSteps.push(currentStep); // Add to reinforcement path
            visited.add(nuevoKey); // Mark the new state as visited
            trail.push(nuevoKey); // Add to visual path
        }
        // --- End Loop Detection ---

        estado = nuevoEstado; // Update state to the new position
        renderTablero(estado); // Render mouse in the new position

    } // End step loop

    // Apply reinforcement based on the final state and corrected trailSteps
    if (llegóAlQueso) {
        let effectivePathLen = trailSteps.length;
        let reward = REFORZAMIENTO_BASE + Math.max(0, (rows * cols) - effectivePathLen);

        if (effectivePathLen < shortestTrailLength && effectivePathLen > 0) {
            reward *= 1.5; // Bonus for new shortest path
            shortestTrailLength = effectivePathLen;
            if (window.CustomTerminal) window.CustomTerminal.write(`SUCCESS: 🎉 ¡Nuevo camino global más corto encontrado (${effectivePathLen} pasos)! Recompensa aumentada.`);
        }

        if (window.CustomTerminal) window.CustomTerminal.write(`SUCCESS: ✅ Llegó al queso en ${stepsInThisPartida} pasos (${effectivePathLen} efectivos). Reforzando camino con recompensa ≈ ${Math.round(reward)}.`);

        for (const paso of trailSteps) {
            if (vasos[paso.estado]?.[paso.accion] !== undefined) {
                vasos[paso.estado][paso.accion] += reward;
            } else {
                console.warn(`Intento de reforzar acción inválida: ${paso.estado} -> ${paso.accion}`);
            }
        }
        await animarVasos(trailSteps, 'refuerzo');
    } else {
        if (window.CustomTerminal) window.CustomTerminal.write(`WARNING: ❌ No llegó al queso (límite de ${maxPasos} pasos). No hay refuerzo positivo.`);
        renderVasos(); // Update table without animation
    }

    if (!isBatch) setUIEnabled(true);
}


async function simularMultiplesPartidas() {
    if (simulationRunning) return;

    // Parse and validate input
    let numSim = parseInt(document.getElementById("numSim").value);
    numSim = (!isNaN(numSim) && numSim > 0) ? numSim : 1;
    let speedFactor = Math.min(20, Math.max(1, numSim / 5)); // Adjust speed based on number of simulations

    if (window.CustomTerminal) window.CustomTerminal.write(`INFO: 🚀 Iniciando ${numSim} partidas visualizadas (velocidad x${speedFactor.toFixed(1)})...`);
    setUIEnabled(false);

    for (let i = 0; i < numSim && simulationRunning !== false; i++) { // Check simulationRunning flag to allow interruption
        if (window.CustomTerminal) window.CustomTerminal.write(`INFO: --- Iniciando Partida visualizada ${i + 1} / ${numSim} ---`);
        await simularPartida(speedFactor, true); // Pass true for isBatch

        if (i < numSim - 1) {
            if (window.CustomTerminal) window.CustomTerminal.write(`INFO: --- Siguiente partida en 0.5s ---`);
            await sleep(500); // Brief pause between simulations
        }
    }

    if (window.CustomTerminal) window.CustomTerminal.write(`INFO: 🏁 Simulación de ${numSim} partidas visualizadas completada.`);
    renderVasos(); // Final render of vasos table
    setUIEnabled(true);
}


// --- Training Block Functions ---
async function entrenarBloqueLocal(numPartidas, currentBlockNum, totalBlocks) {
    if (window.CustomTerminal) window.CustomTerminal.write(`INFO:   -> Iniciando bloque ${currentBlockNum}/${totalBlocks}: ${numPartidas} partidas...`);
    let vasosJuego = crearVasos(); // Local Q-table for this block
    let partidasCompletadas = 0;
    let partidasExitosas = 0;
    const maxPasosPartida = MAX_PASOS_POR_PARTIDA();

    for (let partida = 0; partida < numPartidas; partida++) {
        if (partida % 20 === 0) { // Update progress every 20 partidas
            actualizarProgresoDetalle(`Bloque ${currentBlockNum}/${totalBlocks}, Partida ${partida + 1}/${numPartidas}`);
            await sleep(1); // Allow UI to refresh
        }

        let estado = [0, 0];
        let blockTrailSteps = []; // Path for this specific game in the block
        let blockVisited = new Set(); // Visited states for loop detection in this game
        let llegóAlQueso = false;
        let startKey = `S${estado[0]},${estado[1]}`;
        blockVisited.add(startKey);

        for (let paso = 0; paso < maxPasosPartida; paso++) {
            // Check if cheese is reached (current state, not next)
            if (estado[0] === rows - 1 && estado[1] === cols - 1) {
                llegóAlQueso = true;
                break; // Cheese found
            }
            let keyActual = `S${estado[0]},${estado[1]}`;
            if (!vasosJuego[keyActual]) {
                console.error(`Estado ${keyActual} no encontrado en vasosJuego local.`);
                break;
            }
            let accion = elegirAccion(vasosJuego[keyActual]);
            if (!accion) break; // No valid action

            let nuevoEstado = [estado[0] + dir[accion][0], estado[1] + dir[accion][1]];
            let nuevoKey = `S${nuevoEstado[0]},${nuevoEstado[1]}`;

            // Loop detection (same logic as simularPartida)
            let currentStep = { estado: keyActual, accion: accion };
            if (blockVisited.has(nuevoKey)) {
                let loopStartIndex = -1;
                for (let k = 0; k < blockTrailSteps.length; k++) {
                    const stepK_state = blockTrailSteps[k].estado; const stepK_action = blockTrailSteps[k].accion;
                    const state_entered_after_k_coords = [parseInt(stepK_state.split(',')[0].substring(1)) + dir[stepK_action][0], parseInt(stepK_state.split(',')[1]) + dir[stepK_action][1]];
                    const state_entered_after_k = `S${state_entered_after_k_coords[0]},${state_entered_after_k_coords[1]}`;
                    if (state_entered_after_k === nuevoKey) { loopStartIndex = k + 1; break; }
                }
                if (loopStartIndex !== -1) {
                    const removedSteps = blockTrailSteps.splice(loopStartIndex);
                    removedSteps.forEach(step => {
                        const r_state = step.estado; const r_action = step.accion;
                        const r_entered_coords = [parseInt(r_state.split(',')[0].substring(1)) + dir[r_action][0], parseInt(r_state.split(',')[1]) + dir[r_action][1]];
                        const r_entered_key = `S${r_entered_coords[0]},${r_entered_coords[1]}`;
                        if (!blockTrailSteps.some(s => `S${parseInt(s.estado.split(',')[0].substring(1)) + dir[s.accion][0]},${parseInt(s.estado.split(',')[1]) + dir[s.accion][1]}` === r_entered_key)) {
                            blockVisited.delete(r_entered_key);
                        }
                    });
                }
                blockTrailSteps.push(currentStep);
                blockVisited.add(nuevoKey); // Mark as visited even if it's a loop
            } else {
                blockTrailSteps.push(currentStep);
                blockVisited.add(nuevoKey);
            }
            estado = nuevoEstado; // Move to new state
        }

        if (llegóAlQueso) {
            partidasExitosas++;
            let effectivePathLen = blockTrailSteps.length;
            let reward = REFORZAMIENTO_BASE + Math.max(0, (rows * cols) - effectivePathLen);
            for (const paso of blockTrailSteps) {
                if (vasosJuego[paso.estado]?.[paso.accion] !== undefined) {
                    vasosJuego[paso.estado][paso.accion] += reward;
                }
            }
        }
        partidasCompletadas++;
    }

    if (window.CustomTerminal) window.CustomTerminal.write(`INFO:   -> Bloque ${currentBlockNum} finalizado. Éxito: ${partidasExitosas}/${partidasCompletadas} partidas.`);
    return vasosJuego; // Return the learned Q-table for this block
}

function acumularResultados(tablaAcumulada, tablaJuego) {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let key = `S${i},${j}`;
            if (!tablaAcumulada[key] || !tablaJuego[key]) continue; // Skip if state doesn't exist in one
            for (let a of acciones) {
                if (tablaAcumulada[key][a] !== undefined && tablaJuego[key][a] !== undefined) {
                    // Acumular el *cambio* aprendido en el bloque, no el valor absoluto
                    let cambioAprendido = tablaJuego[key][a] - VALOR_INICIAL_PAPELETA;
                    tablaAcumulada[key][a] += cambioAprendido;
                    // Ensure tickets don't go below a minimum (e.g., 1)
                    if (tablaAcumulada[key][a] < 1) {
                        tablaAcumulada[key][a] = 1;
                    }
                }
            }
        }
    }
}

async function simularBloquesDeEntrenamiento() {
    if (simulationRunning) return;
    setUIEnabled(false);
    abrirModal();
    getGridSize();
    updateGridLayout(); // Ensure grid layout matches current size

    let numBloques = 10;
    let numPartidasPorBloque = 100;
    // IMPORTANTE: Empezar la acumulación desde los vasos actuales, no desde cero,
    // para que el entrenamiento sea incremental sobre el estado actual.
    let acumuladorVasos = JSON.parse(JSON.stringify(vasos));

    if (window.CustomTerminal) window.CustomTerminal.write(`INFO: ⚡ Iniciando entrenamiento: ${numBloques} bloques de ${numPartidasPorBloque} partidas c/u...`);
    actualizarProgreso(`Entrenando ${numBloques} bloques...`);

    for (let j = 0; j < numBloques; j++) {
        actualizarProgreso(`Entrenando bloque ${j + 1} de ${numBloques}...`);
        await sleep(10); // Allow UI to update

        let vasosBloqueResultado = await entrenarBloqueLocal(numPartidasPorBloque, j + 1, numBloques);
        acumularResultados(acumuladorVasos, vasosBloqueResultado);

        actualizarProgreso(`Bloque ${j + 1} completado. Acumulando aprendizaje...`);
        await sleep(10); // Allow UI to update

        if (simulationRunning === false) { // Check if user interrupted (e.g., by hitting reset)
            if (window.CustomTerminal) window.CustomTerminal.write("WARNING: Entrenamiento interrumpido.");
            break;
        }
    }

    vasos = acumuladorVasos; // Actualizar los vasos globales con el aprendizaje acumulado

    renderVasos();
    actualizarProgreso("Entrenamiento completo. Aprendizaje acumulado.");
    actualizarProgresoDetalle(""); // Clear detailed progress
    if (window.CustomTerminal) window.CustomTerminal.write(`INFO: 🏁 Entrenamiento de ${numBloques} bloques completado.`);

    await sleep(1500); // Keep modal open for a bit
    cerrarModal();
    setUIEnabled(true);
}


// --- Initialization and Reset ---
function reiniciar() {
    if (simulationRunning) {
        if (window.CustomTerminal) window.CustomTerminal.write("WARNING: ⚠️ No se puede reiniciar mientras una simulación/entrenamiento está en curso.");
        return;
    }
    if (window.CustomTerminal) {
        window.CustomTerminal.clear(); // Clear terminal before new session
        window.CustomTerminal.write("INFO: 🔄 Reiniciando simulación...");
    }
    getGridSize();
    updateGridLayout();
    vasos = crearVasos();
    trail = []; // Clear visual trail on reset
    trailSteps = [];
    shortestTrailLength = Infinity;
    renderTablero([0, 0]); // Render initial board state
    renderVasos(); // Render initial vasos state
    setUIEnabled(true); // Re-enable UI elements
    if (window.CustomTerminal) window.CustomTerminal.write("INFO: Tablero y aprendizaje reiniciados.");
}


// --- Modal Control ---
function abrirModal() {
    const modal = document.getElementById("modal");
    if (modal) {
        modal.classList.add("active");
        const detalle = document.getElementById("progreso-detalle");
        if (detalle) detalle.textContent = ""; // Clear previous details
    }
}
function cerrarModal() {
    const modal = document.getElementById("modal");
    if (modal) modal.classList.remove("active");
}
function actualizarProgreso(texto) {
    const progreso = document.getElementById("progreso");
    if (progreso) progreso.textContent = texto;
}
function actualizarProgresoDetalle(texto) {
    const detalle = document.getElementById("progreso-detalle");
    if (detalle) detalle.textContent = texto;
}

// --- Event Listeners ---
// Add event listeners after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const gridRowsInput = document.getElementById("gridRows");
    const gridColsInput = document.getElementById("gridCols");

    if (gridRowsInput) gridRowsInput.addEventListener("change", reiniciar);
    if (gridColsInput) gridColsInput.addEventListener("change", reiniciar);

    // Initial Setup on Load
    reiniciar(); // Call reiniciar which includes getGridSize, updateGridLayout, etc.
    if (window.CustomTerminal) {
        window.CustomTerminal.write("INFO: Juego del Ratón y el Queso cargado y listo.");
    }
});