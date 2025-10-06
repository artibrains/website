document.addEventListener('DOMContentLoaded', () => {
    // ... [Referencias a DOM Elements idénticas] ...
    const canvas = document.getElementById('perceptronCanvas'); const ctx = canvas.getContext('2d');
    const species1Select = document.getElementById('species1'); const species2Select = document.getElementById('species2'); const trainEpochBtn = document.getElementById('trainEpochBtn'); const trainAutoBtn = document.getElementById('trainAutoBtn'); const resetBtn = document.getElementById('resetBtn'); const lrSlider = document.getElementById('lrSlider'); const speedSlider = document.getElementById('speedSlider'); const lrValueSpan = document.getElementById('lrValue'); const speedValueSpan = document.getElementById('speedValue'); const epochDisplay = document.getElementById('epochDisplay'); const errorDisplay = document.getElementById('errorDisplay'); const w1Display = document.getElementById('w1Display'); const w2Display = document.getElementById('w2Display'); const bDisplay = document.getElementById('bDisplay'); const minErrorDisplay = document.getElementById('minErrorDisplay');

    // --- CONSTANTES DE ESTILO ---
    const computedStyles = getComputedStyle(document.documentElement);
    const ACCENT_COLOR = computedStyles.getPropertyValue('--accent-color').trim();
    const SECONDARY_COLOR = computedStyles.getPropertyValue('--secondary-color').trim();
    const MAIN_TEXT_COLOR = computedStyles.getPropertyValue('--main-text-color').trim();
    const FONT_FAMILY = computedStyles.getPropertyValue('--font-family').trim();
    /** MEJORA: Obtenemos el color para la mejor línea */
    const BEST_LINE_COLOR = computedStyles.getPropertyValue('--best-line-color').trim();

    // ... [Estado Global y otras funciones idénticas hasta drawAll] ...
    let weights = [0, 0], bias = 0, learningRate = 0.1, animationSpeed = 100;
    let irisData = [], currentDataset = [], featureScalers = {};
    let epoch = 0, isTrainingAuto = false, autoTrainIntervalId = null;
    let bestWeights = [0, 0], bestBias = 0, minError = Infinity;
    const MAX_EPOCHS = 500;
    const initializeModel = () => { weights = [Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05]; bias = Math.random() * 0.1 - 0.05; epoch = 0; minError = Infinity; bestWeights = [...weights]; bestBias = bias; updateInfoPanel(); };
    const loadAndParseData = async () => { const url = 'https://gist.githubusercontent.com/rodriguezda/f005f670fe85cd77c72cd929cf897acf/raw/iris.csv'; try { const response = await fetch(url); if (!response.ok) throw new Error(`Error de red: ${response.statusText}`); const csvText = await response.text(); const lines = csvText.trim().split('\n'); irisData = lines.slice(1).map(line => { const values = line.split(','); return { petal_length: parseFloat(values[2]), petal_width: parseFloat(values[3]), species: values[4] }; }); const species = [...new Set(irisData.map(d => d.species))]; species1Select.innerHTML = species.map(s => `<option value="${s}">${s}</option>`).join(''); species2Select.innerHTML = species.map(s => `<option value="${s}">${s}</option>`).join(''); species1Select.value = species[0]; species2Select.value = species[1]; enableControls(); prepareDataset(); } catch (error) { console.error('Fallo al cargar los datos:', error); alert('No se pudieron cargar los datos del Iris.'); } };
    const prepareDataset = () => { const species1 = species1Select.value, species2 = species2Select.value; if (species1 === species2) { alert("Por favor, selecciona dos especies diferentes."); species2Select.value = [...new Set(irisData.map(d => d.species))].find(s => s !== species1); return; } const filteredData = irisData.filter(d => d.species === species1 || d.species === species2); const xMin = Math.min(...filteredData.map(d => d.petal_length)), xMax = Math.max(...filteredData.map(d => d.petal_length)); const yMin = Math.min(...filteredData.map(d => d.petal_width)), yMax = Math.max(...filteredData.map(d => d.petal_width)); featureScalers.x = val => (val - xMin) / (xMax - xMin) * (canvas.width * 0.9) + (canvas.width * 0.05); featureScalers.y = val => (val - yMin) / (yMax - yMin) * (canvas.height * 0.9) + (canvas.height * 0.05); currentDataset = filteredData.map(d => ({ features: [featureScalers.x(d.petal_length), featureScalers.y(d.petal_width)], label: d.species === species1 ? 1 : -1, })); resetModel(); };
    const activate = sum => (sum >= 0 ? 1 : -1);
    const predict = (inputs, w, b) => activate(inputs.reduce((acc, input, i) => acc + input * w[i], 0) + b);
    const trainEpoch = () => { if (currentDataset.length === 0) return; currentDataset.sort(() => Math.random() - 0.5); for (const dataPoint of currentDataset) { const prediction = predict(dataPoint.features, weights, bias); const error = dataPoint.label - prediction; if (error !== 0) { weights[0] += learningRate * error * dataPoint.features[0]; weights[1] += learningRate * error * dataPoint.features[1]; bias += learningRate * error; } } const totalError = currentDataset.reduce((acc, dp) => acc + (predict(dp.features, weights, bias) !== dp.label ? 1 : 0), 0); if (totalError < minError) { minError = totalError; bestWeights = [...weights]; bestBias = bias; } epoch++; updateInfoPanel(totalError, minError); drawAll(); if (totalError === 0 && isTrainingAuto) { toggleAutoTrain(); minErrorDisplay.textContent = "0 (¡Perfecto!)"; } };
    const toggleAutoTrain = () => { isTrainingAuto = !isTrainingAuto; if (isTrainingAuto) { trainAutoBtn.textContent = 'Detener Entrenamiento'; trainEpochBtn.disabled = true; resetBtn.disabled = true; const trainingLoop = () => { if (epoch >= MAX_EPOCHS) { alert(`Límite de ${MAX_EPOCHS} épocas alcanzado. Mostrando la mejor solución encontrada.`); weights = [...bestWeights]; bias = bestBias; drawAll(); updateInfoPanel(minError, minError); toggleAutoTrain(); return; } trainEpoch(); }; autoTrainIntervalId = setInterval(trainingLoop, animationSpeed); } else { clearInterval(autoTrainIntervalId); trainAutoBtn.textContent = 'Entrenar Automático'; trainEpochBtn.disabled = false; resetBtn.disabled = false; } };
    const resetModel = () => { if (isTrainingAuto) toggleAutoTrain(); initializeModel(); drawAll(); };

    // --- FUNCIONES DE DIBUJO (ACTUALIZADAS) ---

    const drawAxisLabels = () => { ctx.fillStyle = MAIN_TEXT_COLOR; ctx.font = `14px ${FONT_FAMILY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('Largo del Pétalo (Eje X)', canvas.width / 2, canvas.height - 5); ctx.save(); ctx.translate(20, canvas.height / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('Ancho del Pétalo (Eje Y)', 0, 0); ctx.restore(); };

    /** MEJORA: Función genérica para dibujar una línea de decisión */
    const drawLine = (w, b, color, isDashed = false) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (isDashed) { ctx.setLineDash([5, 8]); }
        let x1 = 0, y1 = (-w[0] * x1 - b) / w[1];
        let x2 = canvas.width, y2 = (-w[0] * x2 - b) / w[1];
        if (Math.abs(w[1]) < 1e-6) { x1 = x2 = -b / w[0]; y1 = 0; y2 = canvas.height; }
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        if (isDashed) { ctx.setLineDash([]); } // Resetear el guion
    };

    const drawDataPoints = () => { currentDataset.forEach(dp => { ctx.beginPath(); ctx.arc(dp.features[0], dp.features[1], 5, 0, 2 * Math.PI); ctx.fillStyle = dp.label === 1 ? ACCENT_COLOR : SECONDARY_COLOR; ctx.fill(); }); };

    const drawAll = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawAxisLabels();
        drawDataPoints();

        // Dibujar la mejor línea encontrada (si es diferente de la inicial)
        if (minError !== Infinity) {
            drawLine(bestWeights, bestBias, BEST_LINE_COLOR, true);
        }
        // Dibujar la línea actual
        if (weights.some(w => w !== 0)) {
            drawLine(weights, bias, 'rgba(0, 0, 0, 0.8)');
        }
    };

    // ... [Resto de funciones (updateInfoPanel, enableControls, Listeners) sin cambios] ...
    const updateInfoPanel = (error = 'N/A', bestError = 'N/A') => { epochDisplay.textContent = epoch; errorDisplay.textContent = error; minErrorDisplay.textContent = bestError === Infinity ? 'N/A' : bestError; w1Display.textContent = weights[0].toFixed(4); w2Display.textContent = weights[1].toFixed(4); bDisplay.textContent = bias.toFixed(4); };
    const enableControls = () => { [species1Select, species2Select, trainEpochBtn, trainAutoBtn, resetBtn, lrSlider, speedSlider].forEach(c => c.disabled = false); };
    species1Select.addEventListener('change', prepareDataset);
    species2Select.addEventListener('change', prepareDataset);
    trainEpochBtn.addEventListener('click', trainEpoch);
    trainAutoBtn.addEventListener('click', toggleAutoTrain);
    resetBtn.addEventListener('click', resetModel);
    lrSlider.addEventListener('input', e => { learningRate = parseFloat(e.target.value); lrValueSpan.textContent = learningRate; });
    speedSlider.addEventListener('input', e => { animationSpeed = parseInt(e.target.value); speedValueSpan.textContent = animationSpeed; if (isTrainingAuto) { toggleAutoTrain(); toggleAutoTrain(); } });

    initializeModel();
    // Carga los datos automáticamente al iniciar
    loadAndParseData();
    drawAll();
});