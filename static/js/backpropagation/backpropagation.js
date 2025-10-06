document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN Y ESTADO INICIAL ---
    const networkStructure = [2, 3, 2, 3]; // [Input, Hidden1, Hidden2, Output]
    const learningRate = 0.3;
    const MAX_EPOCHS = 200;
    const classColors = ['#dc3545', '#198754', '#0d6efd']; // Colores para las 3 clases de salida

    let network = null;
    let dataset = [];
    let lastPredictionPoint = null;

    const trainingState = {
        epoch: 0,
        sampleIndex: 0,
        step: 0,
        running: false,
        animationFrameId: null,
    };

    const stepDescriptions = [
        "Seleccionar Muestra de Entrenamiento",
        "Paso 1: Propagación Hacia Adelante (Forward Pass)",
        "Paso 2: Cálculo del Error (Loss)",
        "Paso 3: Retropropagación (Capa de Salida)",
        "Paso 4: Retropropagación (Capa Oculta 2)",
        "Paso 5: Retropropagación (Capa Oculta 1)",
        "Paso 6: Actualización de Pesos"
    ];

    // --- ELEMENTOS DEL DOM ---
    const svg = document.getElementById('network-visualization');
    const dataPlot = document.getElementById('data-plot');
    const plotInfoBox = document.getElementById('data-plot-info'); // Nuevo elemento
    const epochCounter = document.getElementById('epoch-counter');
    const sampleCounter = document.getElementById('sample-counter');
    const lossValue = document.getElementById('loss-value');
    const explanationContent = document.getElementById('explanation-content');
    const datasetBody = document.getElementById('dataset-body');
    const stepBtn = document.getElementById('step-btn');
    const runBtn = document.getElementById('run-btn');
    const resetBtn = document.getElementById('reset-btn');
    const turboModeCheckbox = document.getElementById('turbo-mode-checkbox');
    const defaultPlotInfoText = "Pasa el ratón sobre un punto para ver sus detalles.";


    // --- FUNCIONES MATEMÁTICAS ---
    const sigmoid = (x) => 1 / (1 + Math.exp(-x));
    const sigmoidDerivative = (x) => x * (1 - x);

    // --- FUNCIÓN DE UTILIDAD PARA OPTIMIZAR EL REDIMENSIONADO ---
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // --- DATASET ---
    function generateDataset() {
        const data = [];
        const samplesPerClass = 15;
        const spread = 0.15;
        const TARGET_HIGH = 0.9;
        const TARGET_LOW = 0.1;
        // Clase 0 (Rojo)
        for (let i = 0; i < samplesPerClass; i++) data.push({ inputs: [0.85 + Math.random() * spread, Math.random() * spread], output: [TARGET_HIGH, TARGET_LOW, TARGET_LOW] });
        // Clase 1 (Verde)
        for (let i = 0; i < samplesPerClass; i++) data.push({ inputs: [0.85 + Math.random() * spread, 0.85 + Math.random() * spread], output: [TARGET_LOW, TARGET_HIGH, TARGET_LOW] });
        // Clase 2 (Azul)
        for (let i = 0; i < samplesPerClass; i++) data.push({ inputs: [Math.random() * spread, Math.random() * spread], output: [TARGET_LOW, TARGET_LOW, TARGET_HIGH] });
        if (window.CustomTerminal) window.CustomTerminal.write("Backpropagation: Generado nuevo dataset.\n");
        return data.sort(() => Math.random() - 0.5);
    }

    function populateDatasetTable() {
        datasetBody.innerHTML = '';
        dataset.forEach((sample, index) => {
            const row = document.createElement('tr');
            row.id = `sample-row-${index}`;
            const outputStr = `[${sample.output.map(o => o.toFixed(1)).join(', ')}]`;
            row.innerHTML = `<td>${index + 1}</td><td>${sample.inputs[0].toFixed(2)}</td><td>${sample.inputs[1].toFixed(2)}</td><td>${outputStr}</td>`;
            datasetBody.appendChild(row);
        });
    }

    // --- LÓGICA DE LA RED NEURONAL ---
    function initializeNetwork() {
        network = { layers: [], positions: [] };
        for (let i = 0; i < networkStructure.length; i++) {
            const layer = { neurons: [] };
            for (let j = 0; j < networkStructure[i]; j++) {
                const neuron = {
                    id: `n-${i}-${j}`, activation: 0, z: 0, delta: 0, weights: [],
                    bias: (i > 0) ? (Math.random() * 2 - 1) : 0
                };
                if (i > 0) {
                    for (let k = 0; k < networkStructure[i - 1]; k++) {
                        neuron.weights.push(Math.random() * 2 - 1);
                    }
                }
                layer.neurons.push(neuron);
            }
            network.layers.push(layer);
        }
    }

    function forwardPass(inputs) {
        network.layers[0].neurons.forEach((neuron, i) => neuron.activation = inputs[i]);
        for (let i = 1; i < network.layers.length; i++) {
            const prevLayerActivations = network.layers[i - 1].neurons.map(n => n.activation);
            network.layers[i].neurons.forEach(neuron => {
                let sum = neuron.bias;
                for (let k = 0; k < neuron.weights.length; k++) {
                    sum += neuron.weights[k] * prevLayerActivations[k];
                }
                neuron.z = sum;
                neuron.activation = sigmoid(sum);
            });
        }
        return network.layers[network.layers.length - 1].neurons.map(n => n.activation);
    }

    function calculateLoss(predicted, expected) {
        return predicted.reduce((sum, p, i) => sum + Math.pow(expected[i] - p, 2), 0) / predicted.length;
    }

    function calculateOutputDeltas(expected) {
        const outputLayer = network.layers[network.layers.length - 1];
        outputLayer.neurons.forEach((neuron, j) => {
            neuron.delta = (neuron.activation - expected[j]) * sigmoidDerivative(neuron.activation);
        });
    }

    function calculateHiddenDeltas(layerIndex) {
        const currentLayer = network.layers[layerIndex];
        const nextLayer = network.layers[layerIndex + 1];
        currentLayer.neurons.forEach((neuron, j) => {
            let error = nextLayer.neurons.reduce((sum, nextNeuron) => sum + (nextNeuron.weights[j] * nextNeuron.delta), 0);
            neuron.delta = error * sigmoidDerivative(neuron.activation);
        });
    }

    function updateWeights() {
        for (let i = 1; i < network.layers.length; i++) {
            const prevLayerActivations = network.layers[i - 1].neurons.map(n => n.activation);
            network.layers[i].neurons.forEach(neuron => {
                for (let k = 0; k < neuron.weights.length; k++) {
                    neuron.weights[k] -= learningRate * neuron.delta * prevLayerActivations[k];
                }
                neuron.bias -= learningRate * neuron.delta;
            });
        }
    }

    // --- VISUALIZACIÓN ---
    function drawNetwork() {
        svg.innerHTML = '';
        const width = 1000, height = 500;
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        network.positions = [];
        const layerGap = width / (network.layers.length);

        network.layers.forEach((layer, i) => {
            const layerPositions = [];
            const layerX = layerGap * (i + 0.5);
            const neuronGap = height / (layer.neurons.length + 1);

            if (i > 0) {
                const prevLayerPositions = network.positions[i - 1];
                layer.neurons.forEach((neuron, j) => {
                    const neuronY = neuronGap * (j + 1);
                    prevLayerPositions.forEach((prevPos, k) => {
                        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        line.setAttribute('id', `c-${i - 1}-${k}-to-${i}-${j}`);
                        line.setAttribute('class', 'connection');
                        line.setAttribute('x1', prevPos.x);
                        line.setAttribute('y1', prevPos.y);
                        line.setAttribute('x2', layerX);
                        line.setAttribute('y2', neuronY);
                        svg.appendChild(line);
                        const weightText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                        weightText.setAttribute('id', `w-${i - 1}-${k}-to-${i}-${j}`);
                        weightText.setAttribute('class', 'weight-value');
                        weightText.setAttribute('x', (prevPos.x + layerX) / 2);
                        weightText.setAttribute('y', (prevPos.y + neuronY) / 2 - 5);
                        svg.appendChild(weightText);
                    });
                });
            }

            const labels = ["Capa Entrada", "Capa Oculta 1", "Capa Oculta 2", "Capa Salida"];
            const layerLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            layerLabel.setAttribute('class', 'layer-label');
            layerLabel.setAttribute('x', layerX);
            layerLabel.setAttribute('y', 30);
            layerLabel.textContent = labels[i];
            svg.appendChild(layerLabel);

            layer.neurons.forEach((neuron, j) => {
                const neuronY = neuronGap * (j + 1);
                layerPositions.push({ x: layerX, y: neuronY });
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute('id', neuron.id);
                circle.setAttribute('class', 'neuron');
                circle.setAttribute('cx', layerX);
                circle.setAttribute('cy', neuronY);
                circle.setAttribute('r', 25);
                svg.appendChild(circle);
                const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                labelText.setAttribute('class', 'neuron-label');
                labelText.setAttribute('x', layerX);
                labelText.setAttribute('y', neuronY + 5);
                labelText.textContent = `N ${i},${j}`;
                svg.appendChild(labelText);
                const activationText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                activationText.setAttribute('id', `${neuron.id}-act`);
                activationText.setAttribute('class', 'neuron-value');
                activationText.setAttribute('x', layerX);
                activationText.setAttribute('y', neuronY + 45);
                svg.appendChild(activationText);
                if (i > 0) {
                    const deltaText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    deltaText.setAttribute('id', `${neuron.id}-delta`);
                    deltaText.setAttribute('class', 'delta-value');
                    deltaText.setAttribute('x', layerX);
                    deltaText.setAttribute('y', neuronY - 35);
                    svg.appendChild(deltaText);
                }
            });
            network.positions.push(layerPositions);
        });
        addEventListenersToSVG();
    }

    function updateVisualization() {
        if (!network) return;
        network.layers.forEach((layer, i) => {
            layer.neurons.forEach((neuron, j) => {
                const circle = document.getElementById(neuron.id);
                const activationText = document.getElementById(`${neuron.id}-act`);
                const deltaText = document.getElementById(`${neuron.id}-delta`);
                const isOutputLayer = (i === network.layers.length - 1);

                if (circle) {
                    if (isOutputLayer) {
                        circle.style.fill = classColors[j];
                        circle.style.fillOpacity = neuron.activation;
                    } else if (i === 0) {
                        circle.style.fill = `hsla(211, 100%, 50%, ${neuron.activation})`;
                        circle.style.fillOpacity = 1;
                    } else {
                        circle.style.fill = `hsla(39, 96%, 65%, ${neuron.activation})`;
                        circle.style.fillOpacity = 1;
                    }
                }

                if (activationText) activationText.textContent = `a: ${neuron.activation.toFixed(3)}`;
                if (deltaText) deltaText.textContent = neuron.delta !== 0 ? `δ: ${neuron.delta.toFixed(4)}` : '';
                if (i > 0) {
                    neuron.weights.forEach((weight, k) => {
                        const line = document.getElementById(`c-${i - 1}-${k}-to-${i}-${j}`);
                        const weightText = document.getElementById(`w-${i - 1}-${k}-to-${i}-${j}`);
                        if (line) {
                            line.style.stroke = weight > 0 ? 'var(--positive-weight)' : 'var(--negative-weight)';
                            line.style.opacity = Math.min(1, Math.abs(weight) * 1.5);
                        }
                        if (weightText) weightText.textContent = weight.toFixed(3);
                    });
                }
            });
        });
    }

    function drawDataPlot() {
        if (!dataPlot) return;
        dataPlot.innerHTML = '';
        const size = dataPlot.getBoundingClientRect().width;
        const padding = 20;

        dataPlot.innerHTML += `<line class="axis-line" x1="${padding}" y1="${size - padding}" x2="${size - padding}" y2="${size - padding}"></line>`;
        dataPlot.innerHTML += `<line class="axis-line" x1="${padding}" y1="${padding}" x2="${padding}" y2="${size - padding}"></line>`;
        dataPlot.innerHTML += `<text class="axis-label" x="${size / 2}" y="${size - 5}">Entrada 1</text>`;
        dataPlot.innerHTML += `<text class="axis-label" x="5" y="${size / 2}" transform="rotate(-90 10,${size / 2})">Entrada 2</text>`;

        dataset.forEach((sample, index) => {
            const x = padding + sample.inputs[0] * (size - 2 * padding);
            const y = padding + (1 - sample.inputs[1]) * (size - 2 * padding);
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute('id', `data-point-${index}`);
            circle.setAttribute('class', 'data-point');
            circle.setAttribute('data-index', index);
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 5);
            circle.setAttribute('fill', '#888');
            circle.setAttribute('fill-opacity', 0.5);
            dataPlot.appendChild(circle);
        });

        dataPlot.querySelectorAll('.data-point').forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                const idx = el.getAttribute('data-index');
                if (idx === null) return;
                const sample = dataset[idx];
                const trueClass = sample.output.indexOf(0.9);
                const content = `
                <b>Muestra #${parseInt(idx) + 1}</b><br>
                Entrada 1: <code>${sample.inputs[0].toFixed(2)}</code><br>
                Entrada 2: <code>${sample.inputs[1].toFixed(2)}</code><br>
                Clase Verdadera: <code>${trueClass}</code>
            `;
                if (plotInfoBox) plotInfoBox.innerHTML = content;
            });
            el.addEventListener('mouseleave', () => {
                if (plotInfoBox) plotInfoBox.innerHTML = defaultPlotInfoText;
            });
        });
    }

    function updateDataPlot() {
        if (!network) return;
        const tempNetwork = JSON.parse(JSON.stringify(network));

        dataset.forEach((sample, index) => {
            const predicted = forwardPass(sample.inputs);
            const maxVal = Math.max(...predicted);
            const maxIndex = predicted.indexOf(maxVal);

            const point = document.getElementById(`data-point-${index}`);
            if (point) {
                point.style.fill = classColors[maxIndex];
                point.style.fillOpacity = Math.max(0.1, maxVal);
            }
        });
        network = JSON.parse(JSON.stringify(tempNetwork));
        updateVisualization();
    }

    function handlePlotClick(e) {
        hidePredictionPopup();
        const rect = dataPlot.getBoundingClientRect();
        const size = rect.width;
        const padding = 20;

        const svgX = e.clientX - rect.left;
        const svgY = e.clientY - rect.top;

        if (svgX < padding || svgX > size - padding || svgY < padding || svgY > size - padding) return;

        const inputX = (svgX - padding) / (size - 2 * padding);
        const inputY = 1 - ((svgY - padding) / (size - 2 * padding));

        const newInputs = [inputX, inputY];
        const predicted = forwardPass(newInputs);
        updateVisualization();

        if (window.CustomTerminal) window.CustomTerminal.write(`Backpropagation: Predicción en [${inputX.toFixed(2)}, ${inputY.toFixed(2)}].\n`);

        document.getElementById('prediction-point')?.remove();

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute('id', 'prediction-point');
        circle.setAttribute('class', 'prediction-point');
        circle.setAttribute('cx', svgX);
        circle.setAttribute('cy', svgY);
        circle.setAttribute('r', 8);

        const maxVal = Math.max(...predicted);
        const maxIndex = predicted.indexOf(maxVal);
        circle.setAttribute('fill', classColors[maxIndex]);
        circle.setAttribute('fill-opacity', Math.max(0.2, maxVal));
        dataPlot.appendChild(circle);

        lastPredictionPoint = { inputs: newInputs };
        showPredictionPopup(newInputs, predicted, e);
    }

    function showPredictionPopup(inputs, outputs, event) {
        hidePredictionPopup(); // Remove any existing one
        const popup = document.createElement('div');
        popup.id = 'prediction-popup';
        popup.className = 'tooltip';

        let html = `<h4>Predicción del Punto</h4>`;
        html += `<div class="popup-detail"><b>Entrada:</b> <code>[${inputs[0].toFixed(2)}, ${inputs[1].toFixed(2)}]</code></div><hr>`;
        outputs.forEach((out, i) => {
            html += `<div class="popup-detail" style="color:${classColors[i]};"><b>Clase ${i}:</b> <code>${out.toFixed(3)}</code></div>`;
        });
        const maxVal = Math.max(...outputs);
        const maxIndex = outputs.indexOf(maxVal);
        html += `<hr><div class="popup-detail"><b>Ganador: Clase ${maxIndex}</b></div>`;

        popup.innerHTML = html;
        document.body.appendChild(popup);

        popup.style.left = `${event.pageX + 15}px`;
        popup.style.top = `${event.pageY + 15}px`;

        void popup.offsetWidth;
        popup.style.opacity = '1';
    }

    function hidePredictionPopup() {
        const popup = document.getElementById('prediction-popup');
        if (popup) {
            popup.remove();
        }
    }

    function showTooltip(e, content) {
        hideTooltip(); // Remove any existing one
        const tooltip = document.createElement('div');
        tooltip.id = 'dynamic-tooltip';
        tooltip.className = 'tooltip';

        tooltip.innerHTML = content;
        document.body.appendChild(tooltip);

        tooltip.style.left = `${e.pageX + 15}px`;
        tooltip.style.top = `${e.pageY + 15}px`;

        void tooltip.offsetWidth;
        tooltip.style.opacity = '1';
    }

    function hideTooltip() {
        const tooltip = document.getElementById('dynamic-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }


    function updateUIState() {
        epochCounter.textContent = trainingState.epoch;
        sampleCounter.textContent = `${trainingState.sampleIndex + 1} / ${dataset.length}`;
        document.querySelector('#dataset-table tr.active-sample')?.classList.remove('active-sample');
        document.getElementById(`sample-row-${trainingState.sampleIndex}`)?.classList.add('active-sample');
    }

    function updateLossDisplay() {
        if (!network) return;
        const tempNetwork = JSON.parse(JSON.stringify(network));
        let totalLoss = 0;
        dataset.forEach(sample => {
            const predicted = forwardPass(sample.inputs);
            totalLoss += calculateLoss(predicted, sample.output);
        });
        network = JSON.parse(JSON.stringify(tempNetwork));
        lossValue.textContent = (totalLoss / dataset.length).toFixed(5);
    }

    function updateExplanation(step, running = false) {
        if (running) {
            explanationContent.innerHTML = "<h3>Entrenamiento Rápido en Curso...</h3>" +
                "Procesando muestras y épocas automáticamente.<br>" +
                "Observa cómo cambian los pesos (líneas) y el Error Medio (arriba).";
            return;
        }
        let html = `<h3>${stepDescriptions[step]}</h3>`;
        const currentSample = dataset[trainingState.sampleIndex];
        const f = (n) => n.toFixed(4);

        switch (step) {
            case 0:
                html += `Se selecciona la muestra #${trainingState.sampleIndex + 1} de la tabla.<br>Entrada: <span class="value">[${currentSample.inputs.map(x => x.toFixed(2)).join(', ')}]</span><br>Salida Esperada (y): <span class="value">[${currentSample.output.map(o => o.toFixed(1)).join(', ')}]</span>`;
                break;
            case 1:
                html += `Se calculan las activaciones capa por capa, de izquierda a derecha. Para cada neurona:<br><span class="formula">z = Σ(peso * activación_anterior) + bias</span><br><span class="formula">a = σ(z)</span><br>`;
                network.layers.forEach((layer, i) => {
                    if (i === 0) return;
                    html += `<br><b>Cálculos para la Capa ${i}:</b>`;
                    const prevLayer = network.layers[i - 1];
                    layer.neurons.forEach((n, j) => {
                        let z_calc = `z = (`;
                        n.weights.forEach((w, k) => { z_calc += `${f(w)} * ${f(prevLayer.neurons[k].activation)} + `; });
                        z_calc = z_calc.slice(0, -3) + `) + ${f(n.bias)}`;
                        html += `<div class="math-detail"><b>N<sub>${i},${j}</sub>:</b><br>${z_calc} = <span class="value">${f(n.z)}</span><br>a = σ(${f(n.z)}) = <span class="value">${f(n.activation)}</span></div>`;
                    });
                });
                break;
            case 2:
                const predicted = network.layers[network.layers.length - 1].neurons.map(n => n.activation);
                const loss = calculateLoss(predicted, currentSample.output);
                let loss_calc = ``;
                predicted.forEach((p, i) => { loss_calc += `(${f(currentSample.output[i])} - ${f(p)})² + `; });
                loss_calc = loss_calc.slice(0, -3);
                html += `Se calcula el Error Cuadrático Medio (MSE) para esta muestra.<br><span class="formula">Loss = (1/n) * Σ(y - ŷ)²</span><br><br><b>Cálculo:</b><div class="math-detail">Loss = (1/${predicted.length}) * (${loss_calc})<br>Loss = <span class="value">${f(loss)}</span></div>`;
                break;
            case 3:
                html += `Se calcula el delta (δ) para la capa de salida. Este valor representa el error de cada neurona de salida.<br><span class="formula">δₒ = (ŷ - y) * σ'(z) = (aₒ - y) * (aₒ * (1 - aₒ))</span><br>`;
                network.layers[network.layers.length - 1].neurons.forEach((n, j) => {
                    let delta_calc = `δ = (${f(n.activation)} - ${f(currentSample.output[j])}) * (${f(n.activation)} * (1 - ${f(n.activation)}))`;
                    html += `<div class="math-detail"><b>N<sub>3,${j}</sub> δ:</b><br>${delta_calc} = <span class="highlight value">${f(n.delta)}</span></div>`;
                });
                break;
            case 4:
            case 5:
                const layerIndex = (step === 4) ? 2 : 1;
                html += `Se retropropaga el error a la Capa Oculta ${layerIndex}. El error de una neurona oculta es la suma ponderada de los errores (deltas) de la capa siguiente.<br><span class="formula">δₕ = (Σ δₖ * wₖₕ) * σ'(zₕ)</span><br>`;
                const currentLayer = network.layers[layerIndex];
                const nextLayer = network.layers[layerIndex + 1];
                currentLayer.neurons.forEach((n, j) => {
                    let error_sum_calc = `Error Sum = (`;
                    let error_sum = 0;
                    nextLayer.neurons.forEach((next_n, k) => {
                        error_sum += next_n.delta * next_n.weights[j];
                        error_sum_calc += `${f(next_n.delta)} * ${f(next_n.weights[j])} + `;
                    });
                    error_sum_calc = error_sum_calc.slice(0, -3) + `) = ${f(error_sum)}`;
                    let delta_calc = `δ = ${f(error_sum)} * (${f(n.activation)} * (1 - ${f(n.activation)}))`;
                    html += `<div class="math-detail"><b>N<sub>${layerIndex},${j}</sub> δ:</b><br>${error_sum_calc}<br>${delta_calc} = <span class="highlight value">${f(n.delta)}</span></div>`;
                });
                break;
            case 6:
                html += `Se actualizan todos los pesos y biases usando el delta de la neurona de destino y la activación de la neurona de origen.<br><span class="formula">w_nuevo = w_viejo - η * δ_destino * a_origen</span><br><span class="formula">b_nuevo = b_viejo - η * δ_destino</span><br><br><b>Ejemplo de cálculo para la conexión N<sub>2,0</sub> → N<sub>3,0</sub>:</b>`;
                const w_n_target = network.layers[3].neurons[0];
                const w_n_source = network.layers[2].neurons[0];
                const old_w = w_n_target.weights[0] + (learningRate * w_n_target.delta * w_n_source.activation);
                let w_change = learningRate * w_n_target.delta * w_n_source.activation;
                let w_update_calc = `Δw = ${learningRate} * ${f(w_n_target.delta)} * ${f(w_n_source.activation)} = ${f(w_change)}`;
                let new_w_calc = `w_nuevo = ${f(old_w)} - (${f(w_change)}) = ${f(w_n_target.weights[0])}`;
                html += `<div class="math-detail">${w_update_calc}<br>${new_w_calc}</div>`;

                html += `<br><b>Ejemplo de cálculo para el bias de N<sub>3,0</sub>:</b>`;
                const b_n_target = network.layers[3].neurons[0];
                const old_b = b_n_target.bias + (learningRate * b_n_target.delta);
                let b_change = learningRate * b_n_target.delta;
                let b_update_calc = `Δb = ${learningRate} * ${f(b_n_target.delta)} = ${f(b_change)}`;
                let new_b_calc = `b_nuevo = ${f(old_b)} - (${f(b_change)}) = ${f(b_n_target.bias)}`;
                html += `<div class="math-detail">${b_update_calc}<br>${new_b_calc}</div>`;
                break;
        }
        explanationContent.innerHTML = html;
    }

    // --- CONTROL DE FLUJO DEL ENTRENAMIENTO ---
    function nextStep() {
        hidePredictionPopup();
        if (trainingState.running && trainingState.step > 0) { } else { updateUIState(); }
        const currentSample = dataset[trainingState.sampleIndex];
        if (trainingState.step === 0) {
            network.layers.forEach(l => l.neurons.forEach(n => n.delta = 0));
            if (window.CustomTerminal && !trainingState.running) window.CustomTerminal.write(`Backpropagation: Epoch ${trainingState.epoch}, Muestra ${trainingState.sampleIndex + 1}, Paso 0: Selección.\n`);
        }
        switch (trainingState.step) {
            case 1:
                forwardPass(currentSample.inputs);
                if (window.CustomTerminal && !trainingState.running) window.CustomTerminal.write(`Backpropagation: Paso 1: Forward Pass.\n`);
                break;
            case 2:
                if (window.CustomTerminal && !trainingState.running) window.CustomTerminal.write(`Backpropagation: Paso 2: Cálculo de Error.\n`);
                break;
            case 3:
                calculateOutputDeltas(currentSample.output);
                if (window.CustomTerminal && !trainingState.running) window.CustomTerminal.write(`Backpropagation: Paso 3: Retropropagación (Salida).\n`);
                break;
            case 4:
                calculateHiddenDeltas(2);
                if (window.CustomTerminal && !trainingState.running) window.CustomTerminal.write(`Backpropagation: Paso 4: Retropropagación (Oculta 2).\n`);
                break;
            case 5:
                calculateHiddenDeltas(1);
                if (window.CustomTerminal && !trainingState.running) window.CustomTerminal.write(`Backpropagation: Paso 5: Retropropagación (Oculta 1).\n`);
                break;
            case 6:
                updateWeights();
                if (window.CustomTerminal && !trainingState.running) window.CustomTerminal.write(`Backpropagation: Paso 6: Actualización de Pesos.\n`);
                break;
        }
        if (!trainingState.running) {
            updateExplanation(trainingState.step);
            updateVisualization();
            if (trainingState.step === 6) updateDataPlot();
        }
        trainingState.step++;
        if (trainingState.step > 6) {
            trainingState.step = 0;
            trainingState.sampleIndex = (trainingState.sampleIndex + 1) % dataset.length;
            if (trainingState.sampleIndex === 0) {
                trainingState.epoch++;
                if (!trainingState.running) updateLossDisplay();
            }
        }
    }

    function runFullTraining() {
        hidePredictionPopup();
        trainingState.running = true;
        stepBtn.disabled = true;
        runBtn.textContent = "Pausar";
        updateExplanation(null, true);
        if (window.CustomTerminal) window.CustomTerminal.write("Backpropagation: Iniciando entrenamiento completo.\n");

        function trainingLoop() {
            if (!trainingState.running || trainingState.epoch >= MAX_EPOCHS) {
                stopFullTraining();
                return;
            }

            const samplesPerFrame = turboModeCheckbox.checked ? dataset.length : 1;

            for (let i = 0; i < samplesPerFrame; i++) {
                if (trainingState.epoch >= MAX_EPOCHS) break;
                for (let j = 0; j < 7; j++) {
                    nextStep();
                }
            }

            updateUIState();
            updateVisualization();
            updateDataPlot();
            updateLossDisplay();

            trainingState.animationFrameId = requestAnimationFrame(trainingLoop);
        }
        trainingLoop();
    }

    function stopFullTraining() {
        trainingState.running = false;
        cancelAnimationFrame(trainingState.animationFrameId);
        stepBtn.disabled = false;
        runBtn.textContent = "Ejecutar Completo";
        updateExplanation(trainingState.step);
        updateLossDisplay();
        updateDataPlot();
        if (window.CustomTerminal) window.CustomTerminal.write("Backpropagation: Entrenamiento pausado.\n");
    }

    function reset() {
        hidePredictionPopup();
        stopFullTraining();
        trainingState.epoch = 0;
        trainingState.sampleIndex = 0;
        trainingState.step = 0;
        lastPredictionPoint = null;
        initializeNetwork();
        drawNetwork();
        updateVisualization();
        drawDataPlot();
        updateUIState();
        lossValue.textContent = 'N/A';
        explanationContent.innerHTML = 'Presiona "Avanzar un Paso" para iniciar el entrenamiento.';
        document.querySelector('#dataset-table tr.active-sample')?.classList.remove('active-sample');
        if (window.CustomTerminal) window.CustomTerminal.write("Backpropagation: Visualización reseteada.\n");
    }

    function handleResize() {
        drawDataPlot();
        updateDataPlot();

        if (lastPredictionPoint && lastPredictionPoint.inputs) {
            const rect = dataPlot.getBoundingClientRect();
            const size = rect.width;
            const padding = 20;

            document.getElementById('prediction-point')?.remove();

            const x = padding + lastPredictionPoint.inputs[0] * (size - 2 * padding);
            const y = padding + (1 - lastPredictionPoint.inputs[1]) * (size - 2 * padding);

            const tempNetwork = JSON.parse(JSON.stringify(network));
            const predicted = forwardPass(lastPredictionPoint.inputs);
            network = JSON.parse(JSON.stringify(tempNetwork));

            const maxVal = Math.max(...predicted);
            const maxIndex = predicted.indexOf(maxVal);

            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute('id', 'prediction-point');
            circle.setAttribute('class', 'prediction-point');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 8);
            circle.setAttribute('fill', classColors[maxIndex]);
            circle.setAttribute('fill-opacity', Math.max(0.2, maxVal));
            dataPlot.appendChild(circle);
        }
    }

    // --- MANEJADORES DE EVENTOS ---
    stepBtn.addEventListener('click', nextStep);
    resetBtn.addEventListener('click', reset);
    runBtn.addEventListener('click', () => trainingState.running ? stopFullTraining() : runFullTraining());
    dataPlot.addEventListener('click', handlePlotClick);
    window.addEventListener('resize', debounce(handleResize, 250));
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#data-plot')) {
            hidePredictionPopup();
        }
    });

    function addEventListenersToSVG() {
        network.layers.forEach((layer, i) => {
            layer.neurons.forEach((neuron) => {
                document.getElementById(neuron.id)?.addEventListener('mouseover', (e) => {
                    let content = `<b>Neurona ${neuron.id.substring(2)}</b><br>Activación (a): <code>${neuron.activation.toFixed(4)}</code><br>`;
                    if (i > 0) content += `Suma (z): <code>${neuron.z.toFixed(4)}</code><br>Bias: <code>${neuron.bias.toFixed(4)}</code><br>Delta (δ): <code>${neuron.delta.toFixed(5)}</code>`;
                    showTooltip(e, content);
                });
                document.getElementById(neuron.id)?.addEventListener('mouseout', hideTooltip);
            });
        });
        for (let i = 1; i < network.layers.length; i++) {
            network.layers[i].neurons.forEach((neuron, j) => {
                neuron.weights.forEach((weight, k) => {
                    document.getElementById(`c-${i - 1}-${k}-to-${i}-${j}`)?.addEventListener('mouseover', (e) => {
                        let content = `<b>Conexión N<sub>${i - 1},${k}</sub> → N<sub>${i},${j}</sub></b><br>Peso: <code>${weight.toFixed(4)}</code>`;
                        showTooltip(e, content);
                    });
                    document.getElementById(`c-${i - 1}-${k}-to-${i}-${j}`)?.addEventListener('mouseout', hideTooltip);
                });
            });
        }
    }

    // --- INICIALIZACIÓN ---
    function init() {
        if (!document.getElementById('network-visualization')) {
            console.log("Visualizer element not found. Aborting initialization.");
            return;
        }
        if (window.CustomTerminal) window.CustomTerminal.write("Backpropagation: Inicializando visualizador.\n");
        dataset = generateDataset();
        populateDatasetTable();
        reset();
    }

    init();
});