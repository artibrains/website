// --- Variables Globales y Referencias a Elementos del DOM ---
let currentMode = '1d'; // '1d' o '2d'
let gradientDescentState = {
    isRunning: false, isPaused: false, intervalId: null,
    currentPoint: null, iteration: 0, history: [], gradientMagnitudes: [],
    funcCompiled: null, gradCompiled: null, maxIterations: 100, tolerance: 0.001,
    learningRateType: 'constant', learningRateConstant: 0.1,
    learningRateDecayRate: 0.95, // Factor gamma para decaimiento exponencial
    initialPoint: null, stopReason: null
};

// Elementos del DOM
const functionInput1D = document.getElementById('functionInput1D');
const startPointInputX = document.getElementById('startPointInputX');
const functionInput2D = document.getElementById('functionInput2D');
const startPointInputX2D = document.getElementById('startPointInputX2D');
const startPointInputY2D = document.getElementById('startPointInputY2D');
const learningRateTypeSelect = document.getElementById('learningRateType');
const lrConstantDiv = document.getElementById('lrConstantDiv');
const learningRateConstantInput = document.getElementById('learningRateConstant');
const lrExponentialDiv = document.getElementById('lrExponentialDiv'); // Input para gamma
const learningRateDecayRateInput = document.getElementById('learningRateDecayRate'); // Input para gamma
const lrExplanationDiv = document.getElementById('lrExplanationDiv'); // Div para explicar LR
const maxIterationsInput = document.getElementById('maxIterations');
const toleranceInput = document.getElementById('tolerance');
const startButton = document.getElementById('startButton');
const stepButton = document.getElementById('stepButton');
const resetButton = document.getElementById('resetButton');
const plotDiv1D = document.getElementById('plotDiv1D');
const plotDiv2D = document.getElementById('plotDiv2D');
const controls1D = document.getElementById('controls-1d');
const controls2D = document.getElementById('controls-2d');
const tabButtons = document.querySelectorAll('.tab-button');
const errorPlotDiv = document.getElementById('errorPlotDiv');
const finalResultBox = document.getElementById('finalResultBox');

// --- Modal para comparación de modos de convergencia ---
window.addEventListener('DOMContentLoaded', () => {
    const showLrModalBtn = document.getElementById('showLrModalBtn');
    const lrModal = document.getElementById('lrModal');
    const closeLrModalBtn = document.getElementById('closeLrModalBtn');
    const closeLrModalBtn2 = document.getElementById('closeLrModalBtn2');
    if (showLrModalBtn && lrModal && closeLrModalBtn) {
        const openLr = () => { lrModal.classList.add('active'); };
        const closeLr = () => { lrModal.classList.remove('active'); };
        showLrModalBtn.onclick = openLr;
        closeLrModalBtn.onclick = closeLr;
        if (closeLrModalBtn2) closeLrModalBtn2.onclick = closeLr;
        lrModal.addEventListener('click', (e) => { if (e.target === lrModal) closeLr(); });
    }
    // NUEVO: lógica para mostrar/ocultar el resumen visual
    const toggleResumenVisualBtn = document.getElementById('toggleResumenVisualBtn');
    if (toggleResumenVisualBtn && lrModal) {
        const resumenDiv = lrModal.querySelector('div[style*="margin-top:18px"]');
        toggleResumenVisualBtn.onclick = () => {
            if (resumenDiv) {
                if (resumenDiv.style.display === 'none') {
                    resumenDiv.style.display = 'block';
                } else {
                    resumenDiv.style.display = 'none';
                }
            }
        };
        // Inicialmente oculto para que el botón tenga efecto
        if (resumenDiv) resumenDiv.style.display = 'none';
    }
});

// --- Textos Explicativos ---
const lrExplanations = {
    constant: `<strong>Tasa Constante:</strong><br>Es como bajar una colina dando siempre pasos del mismo tamaño (α).<br><em>Ventaja:</em> Simple de entender.<br><em>Desventaja:</em> Difícil encontrar el tamaño ideal. Si α es muy grande, puedes pasarte del mínimo o ¡incluso empezar a subir de nuevo (diverger)! Si es muy pequeño, tardarás mucho en llegar abajo.`,
    decaySimple: `<strong>Decreciente (Simple: α₀ / √iter):</strong><br>Empezamos con pasos más grandes (α₀) y los hacemos más pequeños a medida que avanzamos (dividimos por la raíz cuadrada de la iteración + 1).<br><em>Ventaja:</em> Ayuda a no pasarse del mínimo cuando estamos cerca.<br><em>Desventaja:</em> La reducción puede ser muy rápida inicialmente, y luego muy lenta. Sensible a α₀.`,
    decayExponential: `<strong>Decreciente (Exponencial: α₀ * γ^iter):</strong><br>También empezamos con pasos de tamaño α₀, pero ahora los reducimos multiplicando por un factor γ (gamma, 0 < γ < 1) en cada paso.<br><em>Ventaja:</em> Permite un control más fino de la reducción (con γ cercano a 1 decae lento, cercano a 0 decae rápido).<br><em>Desventaja:</em> Hay que ajustar dos parámetros: α₀ y γ.`
};

// --- Definición de Presets (Actualizados) ---
const presets = {
    simple1d: {
        name: "1D Básico (x²)", mode: '1d', func: 'x^2', startX: 8,
        lrType: 'constant', lrConst: 0.1, lrDecay: 0.95, maxIter: 50, tol: 0.001
    },
    highAlpha: {
        name: "1D α Alta (Oscila)", mode: '1d', func: 'x^2', startX: 8,
        lrType: 'constant', lrConst: 0.98, lrDecay: 0.95, maxIter: 50, tol: 0.001
    },
    lowAlphaDecay: {
        name: "1D α Baja (Dec. Simple)", mode: '1d', func: 'x^2 + 5*sin(x)', startX: 8,
        lrType: 'decaySimple', lrConst: 0.8, lrDecay: 0.95, maxIter: 100, tol: 0.001
    },
    expDecay: {
        name: "1D Dec. Exponencial", mode: '1d', func: 'x^2 + 5*sin(x)', startX: 8,
        lrType: 'decayExponential', lrConst: 0.8, lrDecay: 0.96, maxIter: 100, tol: 0.001
    },
    complex2d: {
        name: "2D Mínimos Locales", mode: '2d', func: '(x^2 + y - 11)^2 + (x + y^2 - 7)^2',
        startX: -4, startY: 4, lrType: 'constant', lrConst: 0.005, lrDecay: 0.95, maxIter: 200, tol: 0.01
    }
};

// --- Inicialización ---
window.onload = () => {
    setupEventListeners();
    setupPresetButtons();
    updateLearningRateVisibility();
    loadPreset('simple1d');
};

// --- Configuración de Event Listeners ---
function setupEventListeners() {
    startButton.addEventListener('click', handleStart);
    stepButton.addEventListener('click', handleStep);
    resetButton.addEventListener('click', handleReset);
    learningRateTypeSelect.addEventListener('change', updateLearningRateVisibility);
    learningRateConstantInput.addEventListener('input', () => {
        if (!gradientDescentState.isRunning || gradientDescentState.isPaused) {
            gradientDescentState.learningRateConstant = parseFloat(learningRateConstantInput.value) || 0.1;
        }
    });
    learningRateDecayRateInput.addEventListener('input', () => {
        if (!gradientDescentState.isRunning || gradientDescentState.isPaused) {
            gradientDescentState.learningRateDecayRate = parseFloat(learningRateDecayRateInput.value) || 0.95;
        }
    });
}

function setupPresetButtons() {
    document.querySelectorAll('.preset-button').forEach(button => {
        button.addEventListener('click', () => {
            const presetName = button.getAttribute('data-preset');
            if (presets[presetName]) loadPreset(presetName);
        });
    });
}

// --- Función para Cargar Preset ---
function loadPreset(presetName) {
    const preset = presets[presetName]; if (!preset) return;
    handleReset(false);

    updateInputsFromPreset(preset);

    if (currentMode !== preset.mode) {
        switchMode(preset.mode);
    } else {
        if (initializeAlgorithm()) {
            plotInitialFunction(); plotPath(); plotErrorHistory();
        } else { clearPlotPath(true); plotErrorHistory(); }
    }

    updateLearningRateVisibility();
    gradientDescentState.learningRateType = preset.lrType;
    gradientDescentState.learningRateConstant = preset.lrConst;
    gradientDescentState.learningRateDecayRate = preset.lrDecay;
    gradientDescentState.maxIterations = preset.maxIter;
    gradientDescentState.tolerance = preset.tol;

    updateUI();
}

function updateInputsFromPreset(preset) {
    if (preset.mode === '1d') { functionInput1D.value = preset.func; startPointInputX.value = preset.startX; }
    else { functionInput2D.value = preset.func; startPointInputX2D.value = preset.startX; startPointInputY2D.value = preset.startY; }
    learningRateTypeSelect.value = preset.lrType; learningRateConstantInput.value = preset.lrConst;
    learningRateDecayRateInput.value = preset.lrDecay; maxIterationsInput.value = preset.maxIter; toleranceInput.value = preset.tol;
}

// --- Manejo de Pestañas ---
function showTab(mode) { if (currentMode === mode || (gradientDescentState.isRunning && !gradientDescentState.isPaused)) return; switchMode(mode); }
function switchMode(mode) {
    if (currentMode === mode && document.getElementById(`controls-${mode}`).classList.contains('active')) return;

    currentMode = mode;

    tabButtons.forEach(button => button.classList.toggle('active', button.textContent.includes(mode === '1d' ? '1D' : '2D')));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`controls-${mode}`).classList.add('active'); document.getElementById(`plotDiv${mode.toUpperCase()}`).classList.add('active');

    resetAlgorithmState(false); updateUI();
    if (initializeAlgorithm()) { plotInitialFunction(); plotPath(); } else { clearPlotPath(true); }
    plotErrorHistory();
}

// --- Lógica del Descenso del Gradiente ---

function initializeAlgorithm() {
    try {
        gradientDescentState.maxIterations = parseInt(maxIterationsInput.value) || 100; gradientDescentState.tolerance = parseFloat(toleranceInput.value) || 0.001;
        gradientDescentState.learningRateType = learningRateTypeSelect.value; gradientDescentState.learningRateConstant = parseFloat(learningRateConstantInput.value) || 0.1;
        gradientDescentState.learningRateDecayRate = parseFloat(learningRateDecayRateInput.value) || 0.95;

        let funcStr, startX, startY, node;
        if (currentMode === '1d') {
            funcStr = functionInput1D.value; if (!funcStr) throw new Error("Función f(x) vacía.");
            startX = parseFloat(startPointInputX.value); if (isNaN(startX)) throw new Error("Punto inicial X inválido.");
            gradientDescentState.initialPoint = { x: startX }; node = math.parse(funcStr);
            gradientDescentState.funcCompiled = node.compile(); gradientDescentState.gradCompiled = { x: math.derivative(node, 'x').compile() };
        } else { // 2d
            funcStr = functionInput2D.value; if (!funcStr) throw new Error("Función f(x, y) vacía.");
            startX = parseFloat(startPointInputX2D.value); if (isNaN(startX)) throw new Error("Punto inicial X inválido.");
            startY = parseFloat(startPointInputY2D.value); if (isNaN(startY)) throw new Error("Punto inicial Y inválido.");
            gradientDescentState.initialPoint = { x: startX, y: startY }; node = math.parse(funcStr);
            gradientDescentState.funcCompiled = node.compile(); gradientDescentState.gradCompiled = { x: math.derivative(node, 'x').compile(), y: math.derivative(node, 'y').compile() };
        }
        gradientDescentState.currentPoint = { ...gradientDescentState.initialPoint }; gradientDescentState.iteration = 0;
        gradientDescentState.history = [gradientDescentState.currentPoint]; gradientDescentState.gradientMagnitudes = [];
        gradientDescentState.isRunning = false; gradientDescentState.isPaused = false; gradientDescentState.stopReason = null;
        const initialGradResult = calculateGradient(gradientDescentState.currentPoint);
        if (initialGradResult) { gradientDescentState.gradientMagnitudes.push(initialGradResult.magnitude); } else { throw new Error("No se pudo calcular gradiente inicial."); }
        return true;
    } catch (error) {
        console.error("Error en initializeAlgorithm:", error);
        gradientDescentState.isRunning = false; gradientDescentState.isPaused = false; gradientDescentState.currentPoint = null;
        gradientDescentState.funcCompiled = null; gradientDescentState.gradCompiled = null; updateUI(); return false;
    }
}

function calculateGradient(point) {
    if (!gradientDescentState.gradCompiled || !point) return null;
    let grad = {}, gradMagnitude = 0;
    try {
        if (currentMode === '1d') {
            grad.x = gradientDescentState.gradCompiled.x.evaluate({ x: point.x }); if (isNaN(grad.x) || !isFinite(grad.x)) throw new Error(`∇f inválido (NaN/Inf) en x=${point.x.toFixed(4)}`);
            gradMagnitude = Math.abs(grad.x);
        } else {
            grad.x = gradientDescentState.gradCompiled.x.evaluate({ x: point.x, y: point.y }); grad.y = gradientDescentState.gradCompiled.y.evaluate({ x: point.x, y: point.y });
            if (isNaN(grad.x) || !isFinite(grad.x) || isNaN(grad.y) || !isFinite(grad.y)) throw new Error(`∇f inválido (NaN/Inf) en (${point.x.toFixed(4)}, ${point.y.toFixed(4)})`);
            gradMagnitude = Math.sqrt(grad.x ** 2 + grad.y ** 2);
        }
        return { vector: grad, magnitude: gradMagnitude };
    } catch (error) {
        console.error("Error en calculateGradient:", error);
        gradientDescentState.stopReason = "Error en gradiente"; stopAlgorithm(); updateUI(); return null;
    }
}

function performStep() {
    if (!gradientDescentState.currentPoint || !gradientDescentState.gradCompiled) { stopAlgorithm(); return; }
    const currentPoint = gradientDescentState.currentPoint; const currentIteration = gradientDescentState.iteration;
    const gradResult = calculateGradient(currentPoint); if (!gradResult) return;
    const grad = gradResult.vector; const gradMagnitude = gradResult.magnitude;
    if (gradientDescentState.gradientMagnitudes.length <= currentIteration) gradientDescentState.gradientMagnitudes.push(gradMagnitude); else gradientDescentState.gradientMagnitudes[currentIteration] = gradMagnitude;

    if (gradMagnitude < gradientDescentState.tolerance) { gradientDescentState.stopReason = "Convergencia"; stopAlgorithm(); updateUI(); return; }
    if (currentIteration >= gradientDescentState.maxIterations) { gradientDescentState.stopReason = "Máx. Iteraciones"; stopAlgorithm(); updateUI(); return; }

    let alpha = 0;
    switch (gradientDescentState.learningRateType) {
        case 'constant': alpha = gradientDescentState.learningRateConstant; break;
        case 'decaySimple': alpha = gradientDescentState.learningRateConstant / Math.sqrt(currentIteration + 1); break;
        case 'decayExponential': alpha = gradientDescentState.learningRateConstant * Math.pow(gradientDescentState.learningRateDecayRate, currentIteration); break;
        default: alpha = gradientDescentState.learningRateConstant;
    }
    if (isNaN(alpha) || !isFinite(alpha) || alpha < 0) { gradientDescentState.stopReason = "Error en tasa α"; stopAlgorithm(); updateUI(); return; }

    let nextPoint = {};
    try {
        if (currentMode === '1d') { nextPoint.x = currentPoint.x - alpha * grad.x; if (isNaN(nextPoint.x) || !isFinite(nextPoint.x)) throw new Error(`x_nuevo NaN/Inf`); }
        else { nextPoint.x = currentPoint.x - alpha * grad.x; nextPoint.y = currentPoint.y - alpha * grad.y; if (isNaN(nextPoint.x) || !isFinite(nextPoint.x) || isNaN(nextPoint.y) || !isFinite(nextPoint.y)) throw new Error(`(x,y)_nuevo NaN/Inf`); }
    } catch (error) { gradientDescentState.stopReason = "Error calculando punto"; stopAlgorithm(); updateUI(); return; }

    gradientDescentState.iteration++; gradientDescentState.currentPoint = nextPoint; gradientDescentState.history.push(nextPoint);
    updatePlot(); plotErrorHistory();
}

function stopAlgorithm() {
    if (gradientDescentState.intervalId) { clearInterval(gradientDescentState.intervalId); gradientDescentState.intervalId = null; }
    if (gradientDescentState.isRunning && gradientDescentState.stopReason && gradientDescentState.stopReason !== "Reseteado Silencioso") {
        const finalPoint = gradientDescentState.currentPoint || gradientDescentState.initialPoint;
        const lastMag = gradientDescentState.gradientMagnitudes.slice(-1)[0];
        showFinalResultBox(finalPoint, gradientDescentState.funcCompiled, gradientDescentState.stopReason, gradientDescentState.iteration, lastMag);
    } else {
        hideFinalResultBox();
    }
    gradientDescentState.isRunning = false; gradientDescentState.isPaused = false;
    plotErrorHistory(); updateUI();
}

function showFinalResultBox(point, funcCompiled, stopReason, iterations, gradMag) {
    if (!finalResultBox) return;
    let html = `<strong>Resultado final del método:</strong><br>`;
    html += `<ul style="margin:0 0 0 18px;padding:0;">`;
    html += `<li><strong>Punto final:</strong> ${formatPoint(point)}</li>`;
    if (funcCompiled && point) {
        try {
            const val = funcCompiled.evaluate(point);
            html += `<li><strong>Valor de la función:</strong> ${typeof val === 'number' ? val.toFixed(6) : val}</li>`;
        } catch (e) { }
    }
    if (typeof gradMag === 'number') {
        html += `<li><strong>|∇f| final:</strong> ${gradMag.toFixed(6)}</li>`;
    }
    html += `<li><strong>Iteraciones:</strong> ${iterations}</li>`;
    html += `<li><strong>Motivo de parada:</strong> ${stopReason || 'Desconocido'}</li>`;
    html += `</ul>`;
    finalResultBox.innerHTML = html;
    finalResultBox.style.display = '';
}

function hideFinalResultBox() {
    if (finalResultBox) {
        finalResultBox.style.display = 'none';
        finalResultBox.innerHTML = '';
    }
}

function resetAlgorithmState(log = true) {
    gradientDescentState.stopReason = log ? "Reseteado" : "Reseteado Silencioso";
    stopAlgorithm();
    const savedConfig = { maxIterations: gradientDescentState.maxIterations, tolerance: gradientDescentState.tolerance, learningRateType: gradientDescentState.learningRateType, learningRateConstant: gradientDescentState.learningRateConstant, learningRateDecayRate: gradientDescentState.learningRateDecayRate };
    gradientDescentState = { ...savedConfig, isRunning: false, isPaused: false, intervalId: null, currentPoint: null, iteration: 0, history: [], gradientMagnitudes: [], funcCompiled: null, gradCompiled: null, initialPoint: null, stopReason: null };
    clearPlotPath(true); plotErrorHistory();
    hideFinalResultBox();
}

// --- Manejadores de Eventos de Botones ---

function handleStart() {
    // Reset state if starting fresh
    if (!gradientDescentState.isRunning && !gradientDescentState.isPaused) {
        if (!gradientDescentState.currentPoint || gradientDescentState.iteration === 0) {
            resetAlgorithmState(true);
        }
    }
    if (gradientDescentState.isRunning && !gradientDescentState.isPaused) {
        gradientDescentState.isPaused = true; if (gradientDescentState.intervalId) clearInterval(gradientDescentState.intervalId); gradientDescentState.intervalId = null;
    } else {
        if (!gradientDescentState.currentPoint) {
            if (!initializeAlgorithm()) { updateUI(); return; }
            plotInitialFunction(); plotPath(); plotErrorHistory();
        }
        gradientDescentState.isRunning = true; gradientDescentState.isPaused = false; gradientDescentState.stopReason = null;
        if (gradientDescentState.iteration === 0 && gradientDescentState.isRunning) { performStep(); if (!gradientDescentState.isRunning) { updateUI(); return; } }
        if (!gradientDescentState.intervalId) { gradientDescentState.intervalId = setInterval(() => { if (gradientDescentState.isRunning && !gradientDescentState.isPaused) performStep(); else { clearInterval(gradientDescentState.intervalId); gradientDescentState.intervalId = null; } }, 300); }
    }
    updateUI();
}

function handleStep() {
    if (gradientDescentState.isRunning && !gradientDescentState.isPaused) { return; }
    if (!gradientDescentState.currentPoint) {
        resetAlgorithmState(true); if (!initializeAlgorithm()) { updateUI(); return; }
        plotInitialFunction(); plotPath(); plotErrorHistory();
    }
    gradientDescentState.isRunning = true; gradientDescentState.isPaused = true; gradientDescentState.stopReason = null;
    performStep();
    if (!gradientDescentState.isRunning) gradientDescentState.isPaused = false;
    updateUI();
}

function handleReset(log = true) {
    resetAlgorithmState(log); if (initializeAlgorithm()) { plotInitialFunction(); plotPath(); } else { clearPlotPath(true); }
    plotErrorHistory(); updateUI();
}

// --- Actualización de la Interfaz de Usuario (UI) ---
function updateUI() {

    if (gradientDescentState.isRunning && !gradientDescentState.isPaused) { startButton.textContent = 'Pausar'; startButton.disabled = false; stepButton.disabled = true; }
    else if (gradientDescentState.isRunning && gradientDescentState.isPaused) {
        startButton.textContent = 'Continuar';
        window.CustomTerminal.write(`<strong>Descenso del Gradiente Pausado</strong>`, true);

        startButton.disabled = false; stepButton.disabled = false;
    }
    else { startButton.textContent = 'Iniciar'; const canStart = !!(currentMode === '1d' ? functionInput1D.value : functionInput2D.value); startButton.disabled = !canStart; stepButton.disabled = !canStart; }
    resetButton.disabled = gradientDescentState.history.length === 0 && !gradientDescentState.currentPoint;
    const controlsDisabled = gradientDescentState.isRunning && !gradientDescentState.isPaused;
    [functionInput1D, startPointInputX, functionInput2D, startPointInputX2D, startPointInputY2D, learningRateTypeSelect, learningRateConstantInput, learningRateDecayRateInput, maxIterationsInput, toleranceInput].forEach(el => el.disabled = controlsDisabled);
    if (!controlsDisabled) { updateLearningRateVisibility(); }
}

function updateLearningRateVisibility() {
    const type = learningRateTypeSelect.value;
    const isRunningAuto = gradientDescentState.isRunning && !gradientDescentState.isPaused;

    const explanationTextElem = document.getElementById('lrExplanationText');
    if (explanationTextElem) {
        explanationTextElem.innerHTML = lrExplanations[type] || "Selecciona un tipo para ver descripción.";
    }

    lrExponentialDiv.style.display = (type === 'decayExponential') ? 'block' : 'none';

    const constantLabel = lrConstantDiv.querySelector('label');
    constantLabel.textContent = (type === 'constant') ? 'Tasa de Aprendizaje (α):' : 'Tasa Inicial (α₀):';

    if (!isRunningAuto) {
        learningRateConstantInput.disabled = false;
        learningRateDecayRateInput.disabled = (type !== 'decayExponential');
    } else {
        learningRateConstantInput.disabled = true;
        learningRateDecayRateInput.disabled = true;
    }

    if (!gradientDescentState.isRunning || gradientDescentState.isPaused) {
        gradientDescentState.learningRateType = type;
        gradientDescentState.learningRateConstant = parseFloat(learningRateConstantInput.value) || 0.1;
        gradientDescentState.learningRateDecayRate = parseFloat(learningRateDecayRateInput.value) || 0.95;
    }
}

// --- Funciones de Graficación (Plotly.js) ---

function plotInitialFunction() {
    try {
        const plotDivId = currentMode === '1d' ? 'plotDiv1D' : 'plotDiv2D'; const plotDiv = document.getElementById(plotDivId); Plotly.purge(plotDiv);
        if (!gradientDescentState.funcCompiled) return;
        let funcStr = ''; let compiledFunc = gradientDescentState.funcCompiled;
        if (currentMode === '1d') {
            funcStr = functionInput1D.value; const xValues = math.range(-10, 10, 0.1).toArray(); const yValues = xValues.map(x => { try { return compiledFunc.evaluate({ x: x }); } catch { return NaN; } });
            const traceFunc = { x: xValues, y: yValues, mode: 'lines', type: 'scatter', name: `f(x)`, line: { color: '#3498db', width: 2 } };
            const layout = { title: `f(x) = ${funcStr}`, xaxis: { title: 'x', autorange: true }, yaxis: { title: 'f(x)', autorange: true }, margin: { l: 50, r: 30, b: 50, t: 50 }, hovermode: 'closest' };
            Plotly.newPlot(plotDiv, [traceFunc], layout);
        } else {
            funcStr = functionInput2D.value; const xRange = math.range(-5, 5, 0.25).toArray(); const yRange = math.range(-5, 5, 0.25).toArray(); const zValues = [];
            for (let i = 0; i < yRange.length; i++) { const row = []; for (let j = 0; j < xRange.length; j++) { try { row.push(compiledFunc.evaluate({ x: xRange[j], y: yRange[i] })); } catch { row.push(NaN); } } zValues.push(row); }
            const traceSurface = { x: xRange, y: yRange, z: zValues, type: 'surface', colorscale: 'Viridis', name: `f(x, y)`, showscale: false, contours: { z: { show: true, usecolormap: true, highlightcolor: "#f1c40f", project: { z: true } } } };
            const layout = { title: `f(x, y) = ${funcStr}`, scene: { xaxis: { title: 'X', autorange: true }, yaxis: { title: 'Y', autorange: true }, zaxis: { title: 'Z=f(X,Y)', autorange: true }, camera: { eye: { x: 1.8, y: -1.8, z: 1.0 } } }, margin: { l: 5, r: 5, b: 5, t: 40 }, autosize: true };
            Plotly.newPlot(plotDiv, [traceSurface], layout);
        }
    } catch (error) { console.error("Error plotting initial function:", error); }
}

function updatePlot() { plotPath(); }

function plotPath() {
    const plotDivId = currentMode === '1d' ? 'plotDiv1D' : 'plotDiv2D'; const plotDiv = document.getElementById(plotDivId);
    if (!plotDiv || !plotDiv.data || plotDiv.data.length === 0 || !gradientDescentState.history || gradientDescentState.history.length === 0 || !gradientDescentState.funcCompiled) return;
    const history = gradientDescentState.history; clearPlotPath(false);
    const pathX = history.map(p => p.x); let pathY, pathZ;
    try { if (currentMode === '1d') { pathY = history.map(p => gradientDescentState.funcCompiled.evaluate({ x: p.x })); pathZ = undefined; } else { pathY = history.map(p => p.y); pathZ = history.map(p => gradientDescentState.funcCompiled.evaluate({ x: p.x, y: p.y })); } } catch (e) { return; }
    const zCoords = (currentMode === '1d' ? pathY : pathZ); const validIndices = zCoords.map((val, idx) => !isNaN(val) && isFinite(val) ? idx : -1).filter(idx => idx !== -1); if (validIndices.length === 0) return;
    const validPathX = validIndices.map(i => pathX[i]); const validPathY = validIndices.map(i => pathY[i]); const validPathZ = pathZ ? validIndices.map(i => pathZ[i]) : undefined;
    const traceType = currentMode === '1d' ? 'scatter' : 'scatter3d';
    const pathTrace = { x: validPathX, y: validPathY, z: validPathZ, mode: 'lines', type: traceType, name: 'Trayectoria', line: { color: '#e74c3c', width: 2, dash: 'dot' } };
    const pointsTrace = { x: validPathX.slice(0, -1), y: validPathY.slice(0, -1), z: validPathZ ? validPathZ.slice(0, -1) : undefined, mode: 'markers', type: traceType, name: 'Pasos', marker: { color: '#f39c12', size: currentMode === '1d' ? 6 : 4, opacity: 0.8 } };
    const currentPointTrace = { x: [validPathX.slice(-1)[0]], y: [validPathY.slice(-1)[0]], z: validPathZ ? [validPathZ.slice(-1)[0]] : undefined, mode: 'markers', type: traceType, name: 'Actual', marker: { color: '#e74c3c', size: currentMode === '1d' ? 10 : 8, symbol: 'diamond' } };
    const tracesToAdd = []; if (validIndices.length > 1) { tracesToAdd.push(pathTrace); tracesToAdd.push(pointsTrace); } if (validIndices.length > 0) tracesToAdd.push(currentPointTrace); if (tracesToAdd.length > 0) Plotly.addTraces(plotDiv, tracesToAdd);
}

function clearPlotPath(purgeBase = false) {
    const plotDivId = currentMode === '1d' ? 'plotDiv1D' : 'plotDiv2D'; const plotDiv = document.getElementById(plotDivId); if (!plotDiv) return;
    if (purgeBase) { Plotly.purge(plotDiv); }
    else if (plotDiv.data && plotDiv.data.length > 1) { const tracesToDelete = Array.from({ length: plotDiv.data.length - 1 }, (_, i) => i + 1); Plotly.deleteTraces(plotDiv, tracesToDelete); }
}

function plotErrorHistory() {
    const magnitudes = gradientDescentState.gradientMagnitudes; const iterations = Array.from({ length: magnitudes.length }, (_, i) => i);
    const cleanedMagnitudes = magnitudes.map(m => (isNaN(m) || !isFinite(m)) ? null : m); const toleranceValue = gradientDescentState.tolerance;
    const traceError = { x: iterations, y: cleanedMagnitudes, mode: 'lines+markers', type: 'scatter', name: '|∇f|', line: { color: '#c0392b', width: 2 }, marker: { size: 5 }, connectgaps: false };
    const traceTolerance = { x: [0, Math.max(10, iterations.length - 1)], y: [toleranceValue, toleranceValue], mode: 'lines', type: 'scatter', name: 'Tolerancia', line: { color: '#2ecc71', width: 2, dash: 'dash' } };
    const layout = { title: '|∇f| vs Iteración', xaxis: { title: 'Iteración', range: [0, Math.max(10, iterations.length - 1)], autorange: false }, yaxis: { title: 'Magnitud Gradiente |∇f|', type: 'linear', autorange: true }, margin: { l: 60, r: 30, b: 50, t: 50 }, hovermode: 'x unified' };
    Plotly.react(errorPlotDiv, [traceError, traceTolerance], layout);
}

// --- Utilidades ---
function formatPoint(point) {
    if (!point) return 'N/A'; const xStr = (point.x !== undefined && point.x !== null) ? point.x.toFixed(4) : 'N/A';
    if (currentMode === '2d') { const yStr = (point.y !== undefined && point.y !== null) ? point.y.toFixed(4) : 'N/A'; return `(x: ${xStr}, y: ${yStr})`; }
    else { return `(x: ${xStr})`; }
}

// --- Global Error Handler ---
window.onerror = function (message, source, lineno, colno, errorObject) {
    let fullErrorMessage = `ERROR INESPERADO:\n  Mensaje: ${message}`;
    if (source) {
        const sourceFile = source.substring(source.lastIndexOf('/') + 1);
        fullErrorMessage += `\n  Archivo: ${sourceFile}`;
    }
    if (lineno !== undefined && colno !== undefined) {
        fullErrorMessage += `\n  Línea: ${lineno}, Col: ${colno}`;
    }

    console.error("Error global capturado:", fullErrorMessage);

    if (errorObject && errorObject.stack) {
        console.error("Error global capturado (objeto):", errorObject);
        console.error("Stack:", errorObject.stack);
    } else {
        console.error("Error global capturado (detalles):", message, source, lineno, colno, errorObject);
    }

    return true;
};