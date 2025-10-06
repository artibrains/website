document.addEventListener('DOMContentLoaded', () => {

    // --- VARIABLES GLOBALES Y CONSTANTES ---
    const allPeople = peopleData;
    const ATTRIBUTES = [
        "gafas", "gafas_de_sol", "sombrero", "color_pelo",
        "sexo", "barba", "color_ropa", "peinado"
    ];
    const BINARY_ATTRIBUTES = ["gafas", "gafas_de_sol", "sombrero", "barba"];
    const allBinaryQuestions = [];

    // Elementos del DOM
    const grid = document.getElementById('character-grid');
    const randomCountInput = document.getElementById('random-count');
    const randomSelectBtn = document.getElementById('random-select-btn');
    const trainBtn = document.getElementById('train-btn');
    const binaryQuestionsOnlyCheckbox = document.getElementById('binary-questions-only');
    const setupContainer = document.getElementById('setup-container');
    const trainingContainer = document.getElementById('training-container');
    const currentStepInfo = document.getElementById('current-step-info');
    const currentGroupDisplay = document.getElementById('current-group-display');
    const tooltip = document.getElementById('tooltip');
    const resetBtn = document.getElementById('reset-btn');
    const spinner = document.getElementById('spinner');
    const calculationDetails = document.getElementById('calculation-details');

    // Controles del árbol
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const fitBtn = document.getElementById('fit-btn');

    // Estado de la aplicación
    let selectedPeople = [];
    let treeElements = []; // Para Cytoscape
    let nodeIdCounter = 0;
    let cy; // Instancia de Cytoscape
    let trainingController = null; // Controlador para detener el entrenamiento

    // --- FUNCIONES DE INICIALIZACIÓN Y UI ---

    function init() {
        generateBinaryQuestions();
        renderCharacterGrid();
        setupEventListeners();
    }

    function generateBinaryQuestions() {
        // Preguntas de atributos binarios existentes
        BINARY_ATTRIBUTES.forEach(attr => {
            let questionText = `¿Tiene ${attr.replace(/_/g, ' ')}?`;
            if (attr === 'gafas_de_sol') questionText = '¿Tiene gafas de sol?';
            allBinaryQuestions.push({ attribute: attr, value: 'sí', text: questionText });
        });

        // Generar preguntas binarias a partir de atributos categóricos
        const categoricalSources = {
            'color_pelo': 'El color de pelo',
            'color_ropa': 'El color de ropa',
            'peinado': 'El peinado',
            'sexo': 'El sexo'
        };

        Object.entries(categoricalSources).forEach(([attr, prefix]) => {
            const uniqueValues = [...new Set(allPeople.map(p => p[attr]))];
            uniqueValues.forEach(value => {
                allBinaryQuestions.push({
                    attribute: attr,
                    value: value,
                    text: `¿${prefix} es ${value}?`
                });
            });
        });
    }

    function renderCharacterGrid() {
        grid.innerHTML = '';
        allPeople.forEach((person, index) => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.id = index;
            card.innerHTML = `
                <img src="${person.imagen}" alt="${person.nombre}">
                <p>${person.nombre}</p>
            `;
            grid.appendChild(card);
        });
    }

    function setupEventListeners() {
        grid.addEventListener('click', handleCharacterClick);
        grid.addEventListener('mouseover', handleMouseOver);
        grid.addEventListener('mouseout', handleMouseOut);
        grid.addEventListener('mousemove', handleMouseMove);
        randomSelectBtn.addEventListener('click', handleRandomSelection);
        trainBtn.addEventListener('click', startTraining);
        resetBtn.addEventListener('click', resetApp);
        binaryQuestionsOnlyCheckbox.addEventListener('change', () => {
            if (trainingController) {
                trainingController.shouldStop = true;
            }
            resetTrainingView();
            trainBtn.disabled = selectedPeople.length < 2;
        });

        // Event listeners para los controles del árbol
        zoomInBtn.addEventListener('click', () => {
            if (cy) cy.zoom(cy.zoom() * 1.2);
        });
        zoomOutBtn.addEventListener('click', () => {
            if (cy) cy.zoom(cy.zoom() / 1.2);
        });
        fitBtn.addEventListener('click', () => {
            if (cy) cy.fit(null, 50);
        });
    }

    function handleCharacterClick(e) {
        const card = e.target.closest('.character-card');
        if (!card) return;

        card.classList.toggle('selected');
        updateSelectionState();
    }

    function handleMouseOver(e) {
        const card = e.target.closest('.character-card');
        if (!card) return;

        const personId = parseInt(card.dataset.id, 10);
        const person = allPeople[personId];

        let tooltipContent = `<ul>`;
        ATTRIBUTES.forEach(attr => {
            tooltipContent += `<li><strong>${attr.replace(/_/g, ' ')}:</strong> ${person[attr]}</li>`;
        });
        tooltipContent += `</ul>`;

        tooltip.innerHTML = tooltipContent;
        tooltip.classList.remove('hidden');
    }

    function handleMouseOut() {
        tooltip.classList.add('hidden');
    }

    function handleMouseMove(e) {
        // Position tooltip relative to the page
        tooltip.style.left = `${e.pageX + 15}px`;
        tooltip.style.top = `${e.pageY + 15}px`;
    }

    function handleRandomSelection() {
        const count = parseInt(randomCountInput.value, 10);
        if (isNaN(count) || count < 2 || count > allPeople.length) {
            alert(`Por favor, introduce un número entre 2 y ${allPeople.length}.`);
            return;
        }

        // Deseleccionar todo primero
        document.querySelectorAll('.character-card.selected').forEach(c => c.classList.remove('selected'));

        // Seleccionar aleatoriamente
        const shuffled = [...allPeople].sort(() => 0.5 - Math.random());
        const randomSelection = shuffled.slice(0, count);

        randomSelection.forEach(person => {
            const personIndex = allPeople.findIndex(p => p.nombre === person.nombre);
            const card = document.querySelector(`.character-card[data-id='${personIndex}']`);
            if (card) card.classList.add('selected');
        });

        updateSelectionState();
    }

    function updateSelectionState() {
        if (trainingController) {
            trainingController.shouldStop = true;
        }
        resetTrainingView();
        const selectedCards = document.querySelectorAll('.character-card.selected');
        selectedPeople = Array.from(selectedCards).map(card => {
            return allPeople[parseInt(card.dataset.id, 10)];
        });

        const count = selectedPeople.length;
        trainBtn.disabled = count < 2;
        trainBtn.textContent = count > 0 ? `Entrenar Árbol (${count} pers.)` : 'Entrenar Árbol';
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // --- LÓGICA DEL ÁRBOL DE DECISIÓN ---

    function calculateBestSplit(people, attributes, useBinaryOnly) {
        if (useBinaryOnly) {
            // Lógica para la partición más equilibrada (modo Sí/No)
            let bestSplit = {
                question: null,
                balanceScore: Infinity,
                groups: {}
            };
            const allScores = [];

            attributes.forEach(q => {
                const groups = { 'sí': [], 'no': [] };
                people.forEach(person => {
                    if (person[q.attribute] === q.value) {
                        groups['sí'].push(person);
                    } else {
                        groups['no'].push(person);
                    }
                });

                const n_si = groups['sí'].length;
                const n_no = groups['no'].length;
                const isSplitPossible = n_si > 0 && n_no > 0;
                const balanceScore = isSplitPossible ? Math.abs(n_si - n_no) : Infinity;

                allScores.push({
                    questionText: q.text,
                    score: balanceScore,
                    distribution: { 'Sí': n_si, 'No': n_no }
                });

                if (isSplitPossible && balanceScore < bestSplit.balanceScore) {
                    bestSplit = { question: q, balanceScore, groups };
                }
            });

            allScores.sort((a, b) => a.score - b.score);
            if (bestSplit.question) {
                bestSplit.attribute = bestSplit.question.attribute;
            }
            return { bestSplit, allScores };

        } else {
            // Lógica original: maximizar grupos, minimizar el más grande
            let bestSplit = {
                attribute: null,
                score: -1,
                tieBreakerScore: Infinity,
                groups: {}
            };
            const allScores = [];

            attributes.forEach(attr => {
                const groups = {};
                people.forEach(person => {
                    const value = person[attr];
                    if (!groups[value]) groups[value] = [];
                    groups[value].push(person);
                });

                const numGroups = Object.keys(groups).length;
                const largestGroupSize = Math.max(...Object.values(groups).map(g => g.length));

                allScores.push({
                    attribute: attr,
                    score: numGroups,
                    tieBreaker: largestGroupSize,
                    distribution: Object.fromEntries(Object.entries(groups).map(([key, value]) => [key, value.length]))
                });

                const isSplitPossible = numGroups > 1;
                if (isSplitPossible) {
                    if (numGroups > bestSplit.score || (numGroups === bestSplit.score && largestGroupSize < bestSplit.tieBreakerScore)) {
                        bestSplit = { attribute: attr, score: numGroups, tieBreakerScore: largestGroupSize, groups };
                    }
                }
            });

            allScores.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return a.tieBreaker - b.tieBreaker;
            });

            if (bestSplit.attribute) {
                bestSplit.question = { text: `¿${bestSplit.attribute.replace(/_/g, ' ')}?` };
            }
            return { bestSplit, allScores };
        }
    }

    async function buildTreeRecursive(people, availableAttributes, nodeId, controller, useBinaryOnly) {
        if (controller.shouldStop) return;
        // Highlight current node
        if (cy) {
            cy.nodes().removeClass('active');
            cy.getElementById(nodeId).addClass('active');
        }

        // --- Visualización del paso actual ---
        currentStepInfo.innerHTML = `\Analizando un grupo de ${people.length} personajes...`;
        currentGroupDisplay.innerHTML = people.map(p => `<img src="${p.imagen}" title="${p.nombre}">`).join('');
        await sleep(1500);
        if (controller.shouldStop) return;

        const currentNode = treeElements.find(el => el.data.id === nodeId);
        if (currentNode) {
            currentNode.data.decisionState = { people, availableAttributes, useBinaryOnly };
        }

        // --- Encontrar la mejor pregunta (split) ---
        const { bestSplit, allScores } = people.length > 1 ? calculateBestSplit(people, availableAttributes, useBinaryOnly) : { bestSplit: { attribute: null, question: null }, allScores: [] };

        // Show calculation details in the panel
        if (allScores.length > 0) {
            updateCalculationPanel(people, allScores, bestSplit, useBinaryOnly);
            await sleep(2500); // Dar tiempo para ver el cálculo antes de continuar
            if (controller.shouldStop) return;
        }

        // --- Caso base: si el grupo es puro o no se puede dividir más ---
        const noMoreQuestions = !bestSplit.attribute;
        if (people.length <= 1 || noMoreQuestions) {
            if (people.length === 1) {
                const person = people[0];
                const label = person.nombre;
                currentStepInfo.innerHTML = `¡Hoja encontrada! Personaje: <strong>${label}</strong>`;
                await sleep(1000);
                if (controller.shouldStop) return;

                if (currentNode) {
                    currentNode.data.label = label;
                    currentNode.data.isLeaf = true;
                    currentNode.data.image = person.imagen;
                }
                initializeCytoscape();
            } else { // Grupo no divisible con múltiples personas
                currentStepInfo.innerHTML = `Grupo no divisible. Preguntando por cada personaje...`;

                const specialMessage = `
                    <div class="special-note">
                        <p><strong>Nota del Algoritmo:</strong> No quedan más atributos para diferenciar a este grupo. El sistema ahora preguntará por cada personaje individualmente para asegurar una clasificación completa.</p>
                    </div>
                `;
                calculationDetails.innerHTML += specialMessage;

                const personToAskAbout = people[0];
                const question = `¿Es ${personToAskAbout.nombre}?`;

                const finalQuestionMessage = `
                    <div class="final-question-note">
                        <p><strong>Pregunta Seleccionada:</strong> ${question}</p>
                    </div>
                `;
                calculationDetails.innerHTML += finalQuestionMessage;

                await sleep(1500);
                if (controller.shouldStop) return;

                const remainingPeople = people.slice(1);

                if (currentNode) {
                    currentNode.data.label = question;
                }

                // "Sí" branch -> Leaf node for the person
                const yesNodeId = `node-${++nodeIdCounter}`;
                treeElements.push({ data: { id: yesNodeId, label: personToAskAbout.nombre, isLeaf: true, image: personToAskAbout.imagen } });
                treeElements.push({ data: { id: `edge-${nodeId}-${yesNodeId}`, source: nodeId, target: yesNodeId, label: 'Sí' } });
                initializeCytoscape();
                await sleep(1000);
                if (controller.shouldStop) return;

                // "No" branch -> Recursive call for the rest of the people
                const noNodeId = `node-${++nodeIdCounter}`;
                treeElements.push({ data: { id: noNodeId, label: '...' } });
                treeElements.push({ data: { id: `edge-${nodeId}-${noNodeId}`, source: nodeId, target: noNodeId, label: 'No' } });
                initializeCytoscape();
                await sleep(1000);
                if (controller.shouldStop) return;

                // La llamada recursiva se encargará de los personajes restantes en una nueva rama.
                await buildTreeRecursive(remainingPeople, [], noNodeId, controller, useBinaryOnly);
            }
            if (cy && !controller.shouldStop) cy.getElementById(nodeId).removeClass('active');
            return;
        }

        const question = bestSplit.question.text;
        currentStepInfo.innerHTML = `Mejor pregunta: <strong>${question}</strong>`;
        await sleep(2000);
        if (controller.shouldStop) return;

        // Actualizar el nodo actual con la pregunta
        if (currentNode) {
            currentNode.data.label = question;
        }

        const attributeUsed = bestSplit.attribute;
        const remainingAttributes = availableAttributes.filter(attr => {
            return (typeof attr === 'string') ? attr !== attributeUsed : attr.attribute !== attributeUsed;
        });

        const groupsToIterate = bestSplit.groups;
        for (const value in groupsToIterate) {
            const group = groupsToIterate[value];

            currentStepInfo.innerHTML = `Creando rama para "<strong>${value}</strong>" (${group.length} pers.)`;
            await sleep(1500);
            if (controller.shouldStop) return;

            const childId = `node-${++nodeIdCounter}`;
            treeElements.push({ data: { id: childId, label: '...' } });

            const edgeLabel = `${value}\n(${group.length} pers.)`;
            treeElements.push({ data: { id: `edge-${nodeId}-${childId}`, source: nodeId, target: childId, label: edgeLabel } });

            initializeCytoscape();
            if (controller.shouldStop) return;

            await buildTreeRecursive(group, remainingAttributes, childId, controller, useBinaryOnly);
            if (controller.shouldStop) return;
        }
        if (cy && !controller.shouldStop) cy.getElementById(nodeId).removeClass('active');
    }

    async function startTraining() {
        // Detener cualquier entrenamiento anterior y limpiar la vista
        if (trainingController) {
            trainingController.shouldStop = true;
        }
        resetTrainingView();

        // Desactivar el botón para evitar múltiples clics
        trainBtn.disabled = true;

        // Crear un nuevo controlador para esta sesión de entrenamiento
        const localController = { shouldStop: false };
        trainingController = localController;

        // Mostrar el área de entrenamiento sin ocultar la configuración
        trainingContainer.classList.remove('hidden');
        spinner.classList.remove('hidden');

        // Resetear el árbol
        nodeIdCounter = 0;
        treeElements = [{
            data: { id: `node-${nodeIdCounter}`, label: 'Inicio' }
        }];
        calculationDetails.innerHTML = '<p>El árbol se está construyendo...</p>';

        const useBinaryOnly = binaryQuestionsOnlyCheckbox.checked;
        const attributesToUse = useBinaryOnly ? allBinaryQuestions : ATTRIBUTES;

        await buildTreeRecursive(selectedPeople, attributesToUse, `node-${nodeIdCounter}`, localController, useBinaryOnly);

        // Si el entrenamiento fue cancelado, no continuar.
        if (localController.shouldStop) {
            console.log("Training aborted by user.");
            return;
        }

        // Marcar el entrenamiento como finalizado
        trainingController = null;
        spinner.classList.add('hidden');
        currentStepInfo.innerHTML = '<strong>¡Árbol de Decisión Completo!</strong> Puede hacer zoom y arrastrar el árbol.';
        currentGroupDisplay.innerHTML = '';
        resetBtn.classList.remove('hidden');
    }

    function resetApp() {
        // Detener cualquier entrenamiento en curso
        if (trainingController) {
            trainingController.shouldStop = true;
            trainingController = null;
        }

        // Deseleccionar todas las cartas
        document.querySelectorAll('.character-card.selected').forEach(c => c.classList.remove('selected'));

        // Resetear estado
        selectedPeople = [];
        treeElements = [];
        nodeIdCounter = 0;

        // Ocultar y limpiar la vista de entrenamiento
        resetTrainingView();

        // Actualizar el estado de los botones
        updateSelectionState();
    }

    function resetTrainingView() {
        trainingContainer.classList.add('hidden');
        spinner.classList.add('hidden');
        if (cy) {
            cy.destroy();
            cy = null;
        }
        calculationDetails.innerHTML = '<p>Selecciona personajes y entrena un árbol para ver los detalles aquí.</p>';
        resetBtn.classList.add('hidden');
    }

    function updateCalculationPanel(people, scores, bestSplit, useBinaryOnly) {
        let panelContent;
        const groupSize = people.length;

        if (useBinaryOnly) {
            let tableRows = scores.map(s => {
                const distribution = Object.entries(s.distribution).map(([key, val]) => `${key}: ${val}`).join(', ');
                const isBest = bestSplit.question && s.questionText === bestSplit.question.text;
                return `
                    <tr class="${isBest ? 'best-split' : ''}">
                        <td>${s.questionText}</td>
                        <td>${s.score === Infinity ? 'N/A' : s.score}</td>
                        <td>${distribution}</td>
                    </tr>
                `;
            }).join('');
            panelContent = `
                <p><strong>Modo Sí/No:</strong> Se elige la pregunta que genera la partición más equilibrada (menor diferencia entre el grupo 'Sí' y 'No').</p>
                <table>
                    <thead>
                        <tr>
                            <th>Pregunta</th>
                            <th>Diferencia</th>
                            <th>Distribución</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            `;
        } else {
            let tableRows = scores.map(s => {
                const distribution = Object.entries(s.distribution).map(([key, val]) => `${key}: ${val}`).join(', ');
                const isBest = s.attribute === bestSplit.attribute;
                return `
                    <tr class="${isBest ? 'best-split' : ''}">
                        <td>${s.attribute.replace(/_/g, ' ')}</td>
                        <td>${s.score}</td>
                        <td>${s.tieBreaker}</td>
                        <td>${distribution}</td>
                    </tr>
                `;
            }).join('');
            panelContent = `
                <p>Para un grupo de <strong>${groupSize}</strong> personajes, se elige la pregunta que crea <strong>más subgrupos</strong>. Como desempate, se elige la que genera el <strong>subgrupo más pequeño</strong>.</p>
                <table>
                    <thead>
                        <tr>
                            <th>Atributo</th>
                            <th>Nº Grupos</th>
                            <th>Mayor Grupo</th>
                            <th>Distribución</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            `;
        }

        const miniaturesHTML = `
            <div class="panel-character-group">
                <h4>Grupo Actual (${groupSize} personajes)</h4>
                <div class="miniatures-container">
                    ${people.map(p => `<img src="${p.imagen}" title="${p.nombre}">`).join('')}
                </div>
            </div>
        `;

        calculationDetails.innerHTML = panelContent + miniaturesHTML;
    }

    // --- LÓGICA DE VISUALIZACIÓN CYTOSCAPE.JS ---

    function initializeCytoscape() {
        if (cy) {
            cy.destroy();
        }

        cy = cytoscape({
            container: document.getElementById('cy-container'), // Usar el nuevo contenedor
            elements: treeElements,
            style: [ // Estilos de los nodos y aristas
                {
                    selector: 'node',
                    style: {
                        'shape': 'round-rectangle',
                        'background-color': '#fff',
                        'border-color': '#000',
                        'border-width': 4,
                        'label': 'data(label)',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'width': 'label',
                        'height': 40,
                        'padding': '15px',
                        'font-size': '16px',
                        'font-weight': 'bold',
                        'color': '#000',
                        'text-wrap': 'wrap',
                        'text-max-width': '140px'
                    }
                },
                {
                    selector: 'node[?isLeaf]',
                    style: {
                        'background-image': 'data(image)',
                        'background-fit': 'cover',
                        'background-clip': 'node',
                        'border-width': 3,
                        'border-color': '#000',
                        'shape': 'rectangle',
                        'width': 80,
                        'height': 60,
                        'text-valign': 'bottom',
                        'text-margin-y': '5px',
                        'font-size': '11px',
                        'color': '#000',
                        'text-background-color': '#fff',
                        'text-background-opacity': 0.9,
                        'text-background-padding': '2px'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 3,
                        'line-color': '#aaa',
                        'target-arrow-color': '#aaa',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'label': 'data(label)',
                        'font-size': '14px',
                        'color': '#333',
                        'text-background-color': '#fff',
                        'text-background-opacity': 1,
                        'text-background-padding': '3px',
                        'text-wrap': 'wrap'
                    }
                },
                {
                    selector: 'node.active',
                    style: {
                        'border-color': '#fbc02d',
                        'shadow-blur': 20,
                        'shadow-color': '#fbc02d',
                        'shadow-opacity': 0.8
                    }
                }
            ],
            layout: {
                name: 'breadthfirst',
                directed: true,
                padding: 50, // Más espacio alrededor del árbol
                spacingFactor: 1.75, // Aumentar para evitar que las ramas se crucen
                avoidOverlap: true, // Prevenir que los nodos se solapen
                nodeDimensionsIncludeLabels: true, // El layout considera el tamaño de la etiqueta
                grid: true,
                roots: '#node-0'
            }
        });

        cy.on('click', 'node', (event) => {
            const node = event.target;
            const decisionState = node.data('decisionState');

            if (decisionState && decisionState.people.length > 1) {
                const { bestSplit, allScores } = calculateBestSplit(decisionState.people, decisionState.availableAttributes, decisionState.useBinaryOnly);
                if (allScores.length > 0) {
                    updateCalculationPanel(decisionState.people, allScores, bestSplit, decisionState.useBinaryOnly);
                    cy.nodes().removeClass('active');
                    node.addClass('active');
                }
            }
        });

        cy.center();
        cy.fit(null, 30);
    }

    // Iniciar la aplicación
    init();
});