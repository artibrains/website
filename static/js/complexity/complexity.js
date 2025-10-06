document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const complexitySlider = document.getElementById('complexity-slider');
    const lambdaSlider = document.getElementById('lambda-slider');
    const complexityValueEl = document.getElementById('complexity-value');
    const lambdaValueEl = document.getElementById('lambda-value');
    const currentComplexityDisplayEl = document.getElementById('current-complexity-display');
    const chartTitleEl = document.getElementById('chart-title');
    const generateNewDataBtn = document.getElementById('generate-new-data-btn');
    const resetRegularizationBtn = document.getElementById('reset-regularization-btn');
    const findBestBtn = document.getElementById('find-best-btn');
    const modelFitCanvas = document.getElementById('model-fit-chart');
    const errorCanvas = document.getElementById('error-chart');

    // Result display elements
    const resultsBox = document.getElementById('best-model-results');
    const bestComplexityEl = document.getElementById('best-complexity-result');
    const bestLambdaEl = document.getElementById('best-lambda-result');
    const bestErrorEl = document.getElementById('best-error-result');

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- CAMBIOS CLAVE PARA FORZAR OVERFITTING ---
    const NUM_TRAINING_POINTS = 8;  // Menos puntos
    const NUM_VALIDATION_POINTS = 15; // Mantenemos la validación robusta
    const NOISE_LEVEL = 0.7;        // Mucho más ruido

    const MAX_COMPLEXITY = 12;
    const MIN_LAMBDA_POWER = -9; // 10^-9
    const MAX_LAMBDA_POWER = -1;  // 10^-1 (Rango más enfocado)

    let currentTab = 'overfitting';
    let trainingData, validationData;
    let modelFitChart, errorChart;
    let allErrors = { train: [], valid: [] };

    const TRAIN_COLOR = 'rgba(0, 123, 255, 0.7)';
    const VALID_COLOR = 'rgba(255, 159, 64, 0.7)';
    const MODEL_LINE_COLOR = 'rgba(40, 167, 69, 1)';
    const REG_MODEL_LINE_COLOR = 'rgba(220, 53, 69, 1)';

    function polynomialRegression(data, degree, lambda = 0) { const n = data.length; const X = []; const y = []; for (let i = 0; i < n; i++) { const row = []; const x = data[i][0]; y.push(data[i][1]); for (let j = 0; j <= degree; j++) { row.push(Math.pow(x, j)); } X.push(row); } const coefficients = solveNormalEquations(X, y, lambda); return { predict: (x) => { let result = 0; for (let i = 0; i <= degree; i++) { result += coefficients[i] * Math.pow(x, i); } return [x, result]; }, coefficients: coefficients }; }
    function solveNormalEquations(X, y, lambda) { const n = X.length; const p = X[0].length; const XtX = []; for (let i = 0; i < p; i++) { XtX[i] = []; for (let j = 0; j < p; j++) { let sum = 0; for (let k = 0; k < n; k++) { sum += X[k][i] * X[k][j]; } XtX[i][j] = sum; } } if (lambda > 0) { for (let i = 0; i < p; i++) { if (i > 0) { XtX[i][i] += lambda; } } } const Xty = []; for (let i = 0; i < p; i++) { let sum = 0; for (let k = 0; k < n; k++) { sum += X[k][i] * y[k]; } Xty[i] = sum; } return gaussianElimination(XtX, Xty); }
    function gaussianElimination(A, b) { const n = A.length; const augmented = []; for (let i = 0; i < n; i++) { augmented[i] = [...A[i], b[i]]; } for (let i = 0; i < n; i++) { let maxRow = i; for (let k = i + 1; k < n; k++) { if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) { maxRow = k; } } [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]; for (let k = i + 1; k < n; k++) { if (Math.abs(augmented[i][i]) < 1e-10) continue; const c = augmented[k][i] / augmented[i][i]; for (let j = i; j <= n; j++) { if (i === j) { augmented[k][j] = 0; } else { augmented[k][j] -= c * augmented[i][j]; } } } } const x = new Array(n); for (let i = n - 1; i >= 0; i--) { x[i] = augmented[i][n]; for (let j = i + 1; j < n; j++) { x[i] -= augmented[i][j] * x[j]; } if (Math.abs(augmented[i][i]) > 1e-10) { x[i] /= augmented[i][i]; } else { x[i] = 0; } } return x; }
    function generateData(numPoints, noise, seed = Math.random()) { let rng = seed; function random() { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; } const data = []; for (let i = 0; i < numPoints; i++) { const x = i / (numPoints - 1); const trueY = Math.sin(x * 2 * Math.PI) * 0.8; const noiseComponent = (random() - 0.5) * 2 * noise; const y = trueY + noiseComponent; data.push({ x, y }); } if (window.CustomTerminal) { window.CustomTerminal.write(`Complexity: Generados ${numPoints} puntos de datos con ruido ${noise.toFixed(2)}.\n`); } return data; }
    function toRegressionFormat(data) { return data.map(p => [p.x, p.y]); }
    function calculateMSE(model, data) { let error = 0; let count = 0; for (const point of data) { try { const prediction = model.predict(point.x)[1]; if (isFinite(prediction) && Math.abs(prediction) < 100) { error += Math.pow(point.y - prediction, 2); count++; } else { return Infinity; } } catch (e) { return Infinity; } } return count > 0 ? error / count : Infinity; }

    // **ELIMINADO**: `smoothErrors()` ya no es necesario.

    function preCalculateAllErrors() {
        allErrors = { train: [], valid: [] };
        const trainRegData = toRegressionFormat(trainingData);
        for (let i = 1; i <= MAX_COMPLEXITY; i++) {
            // Se calcula el error para lambda=0 para la curva de fondo
            const model = polynomialRegression(trainRegData, i, 0);
            const trainError = calculateMSE(model, trainingData);
            const validError = calculateMSE(model, validationData);
            allErrors.train.push(trainError);
            allErrors.valid.push(validError);
        }
    }

    function getModelLine(model) { const line = []; for (let i = 0; i <= 100; i++) { const x = i / 100; try { let y = model.predict(x)[1]; y = isFinite(y) ? Math.max(-3, Math.min(3, y)) : null; line.push({ x, y }); } catch (e) { line.push({ x, y: null }); } } return line; }
    function sliderValueToLambda(value) { if (value == 0) return 0; const power = MIN_LAMBDA_POWER + (MAX_LAMBDA_POWER - MIN_LAMBDA_POWER) * value; return 10 ** power; }
    function lambdaToSliderValue(lambda) { if (lambda <= 0) return 0; const power = Math.log10(lambda); const val = (power - MIN_LAMBDA_POWER) / (MAX_LAMBDA_POWER - MIN_LAMBDA_POWER); return Math.max(0, Math.min(1, val)); }

    function updateRegularizationView() {
        updateComplexityDisplays();
        const complexity = parseInt(complexitySlider.value);
        const sliderVal = parseFloat(lambdaSlider.value);
        const lambda = sliderValueToLambda(sliderVal);
        lambdaValueEl.textContent = lambda.toExponential(2);

        modelFitChart.data.datasets[2] = { label: 'Datos de Validación', data: validationData, backgroundColor: VALID_COLOR, type: 'scatter', pointRadius: 5 };
        const model = polynomialRegression(toRegressionFormat(trainingData), complexity, lambda);
        if (window.CustomTerminal) { window.CustomTerminal.write(`Complexity: Actualizando vista de regularización. Complejidad=${complexity}, Lambda=${lambda.toExponential(2)}.\n`); }
        modelFitChart.data.datasets[1].data = getModelLine(model);
        modelFitChart.data.datasets[1].borderColor = REG_MODEL_LINE_COLOR;
        modelFitChart.update('none');

        const trainError = calculateMSE(model, trainingData);
        const validationError = calculateMSE(model, validationData);
        errorChart.data.datasets[2].data = [{ x: complexity, y: trainError }];
        errorChart.data.datasets[3].data = [{ x: complexity, y: validationError }];
        errorChart.update('none');
    }

    async function findBestModel() {
        findBestBtn.disabled = true;
        findBestBtn.textContent = 'Buscando...';
        resultsBox.style.display = 'none';
        if (window.CustomTerminal) { window.CustomTerminal.write(`Complexity: Iniciando búsqueda del mejor modelo...\n`); }

        let bestValidationError = Infinity;
        let bestComplexity = -1;
        let bestLambda = -1;
        const trainRegData = toRegressionFormat(trainingData);

        const lambdaValuesToTest = [0];
        for (let p = MIN_LAMBDA_POWER; p <= MAX_LAMBDA_POWER; p += 0.5) {
            lambdaValuesToTest.push(10 ** p);
        }

        for (let complexity = 1; complexity <= MAX_COMPLEXITY; complexity++) {
            for (const currentLambda of lambdaValuesToTest) {
                const model = polynomialRegression(trainRegData, complexity, currentLambda);
                const validError = calculateMSE(model, validationData);
                if (validError < bestValidationError) {
                    bestValidationError = validError;
                    bestComplexity = complexity;
                    bestLambda = currentLambda;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 5));
        }

        complexitySlider.value = bestComplexity;
        lambdaSlider.value = lambdaToSliderValue(bestLambda);

        bestComplexityEl.textContent = bestComplexity;
        bestLambdaEl.textContent = bestLambda.toExponential(2);
        bestErrorEl.textContent = bestValidationError.toFixed(4);
        resultsBox.style.display = 'block';

        switchTab('regularization');

        findBestBtn.disabled = false;
        findBestBtn.textContent = '🏆 Encontrar Mejor Modelo';
        if (window.CustomTerminal) { window.CustomTerminal.write(`Complexity: Mejor modelo encontrado. Complejidad=${bestComplexity}, Lambda=${bestLambda.toExponential(2)}, Error=${bestValidationError.toFixed(4)}.\n`); }
    }

    function generateNewData() {
        resultsBox.style.display = 'none';
        const seed1 = Math.random();
        const seed2 = Math.random();
        trainingData = generateData(NUM_TRAINING_POINTS, NOISE_LEVEL, seed1);
        validationData = generateData(NUM_VALIDATION_POINTS, NOISE_LEVEL, seed2);
        preCalculateAllErrors();
        modelFitChart.data.datasets[0].data = trainingData;
        const errorDataTrain = allErrors.train.map((y, i) => ({ x: i + 1, y: y })).filter(p => isFinite(p.y));
        const errorDataValid = allErrors.valid.map((y, i) => ({ x: i + 1, y: y })).filter(p => isFinite(p.y));
        errorChart.data.datasets[0].data = errorDataTrain;
        errorChart.data.datasets[1].data = errorDataValid;
        const allErrorValues = [...errorDataTrain.map(p => p.y), ...errorDataValid.map(p => p.y)];
        const minError = Math.max(0, Math.min(...allErrorValues));
        const maxError = Math.min(10, Math.max(...allErrorValues)); // Cap max error for better viz
        errorChart.options.scales.y.min = minError * 0.9;
        errorChart.options.scales.y.max = maxError * 1.1;
        currentTab === 'overfitting' ? updateOverfittingView() : updateRegularizationView();
    }

    function switchTab(tabName) { currentTab = tabName; tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName)); tabContents.forEach(content => content.classList.toggle('active', content.id === `${tabName}-tab`)); if (tabName === 'overfitting') { chartTitleEl.textContent = 'Ajuste del Modelo - Datos de Entrenamiento'; updateOverfittingView(); } else { chartTitleEl.textContent = 'Ajuste del Modelo - Entrenamiento vs Validación'; updateRegularizationView(); } if (window.CustomTerminal) { window.CustomTerminal.write(`Complexity: Cambiado a la pestaña ${tabName}.\n`); } }
    function updateComplexityDisplays() { const complexity = parseInt(complexitySlider.value); complexityValueEl.textContent = complexity; currentComplexityDisplayEl.textContent = complexity; }
    function updateOverfittingView() { updateComplexityDisplays(); const complexity = parseInt(complexitySlider.value); if (modelFitChart.data.datasets[2]) { modelFitChart.data.datasets[2].data = []; } const model = polynomialRegression(toRegressionFormat(trainingData), complexity); if (window.CustomTerminal) { window.CustomTerminal.write(`Complexity: Actualizando vista de sobreajuste. Complejidad=${complexity}.\n`); } modelFitChart.data.datasets[1].data = getModelLine(model); modelFitChart.data.datasets[1].borderColor = MODEL_LINE_COLOR; modelFitChart.update('none'); errorChart.data.datasets[2].data = [{ x: complexity, y: allErrors.train[complexity - 1] }]; errorChart.data.datasets[3].data = [{ x: complexity, y: allErrors.valid[complexity - 1] }]; errorChart.update('none'); }
    function resetRegularization() { lambdaSlider.value = 0; updateRegularizationView(); resultsBox.style.display = 'none'; }
    function initializeCharts() { modelFitChart = new Chart(modelFitCanvas.getContext('2d'), { type: 'scatter', data: { datasets: [{ label: 'Datos de Entrenamiento', data: [], backgroundColor: TRAIN_COLOR, pointRadius: 5, }, { label: 'Línea del Modelo', data: [], borderColor: MODEL_LINE_COLOR, type: 'line', fill: false, borderWidth: 3, pointRadius: 0, tension: 0.1, }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { type: 'linear', position: 'bottom', min: 0, max: 1 }, y: { min: -2, max: 2 } }, plugins: { legend: { position: 'top' } } } }); errorChart = new Chart(errorCanvas.getContext('2d'), { type: 'line', data: { datasets: [{ label: 'Error de Entrenamiento (sin reg.)', data: [], borderColor: TRAIN_COLOR, borderWidth: 3, fill: false, tension: 0.1, }, { label: 'Error de Validación (sin reg.)', data: [], borderColor: VALID_COLOR, borderWidth: 3, fill: false, tension: 0.1, }, { label: 'Error Actual (Entrenamiento)', data: [], backgroundColor: TRAIN_COLOR, type: 'scatter', pointRadius: 8, }, { label: 'Error Actual (Validación)', data: [], backgroundColor: VALID_COLOR, type: 'scatter', pointRadius: 8, }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { type: 'linear', title: { display: true, text: 'Complejidad del Modelo' }, min: 0.5, max: MAX_COMPLEXITY + 0.5, ticks: { stepSize: 1, callback: (v) => Number.isInteger(v) && v >= 1 ? v : '' } }, y: { type: 'logarithmic', title: { display: true, text: 'Error (MSE, escala log)' }, min: 0.01 } }, plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } }, interaction: { mode: 'index', intersect: false } } }); }
    function setupEventListeners() { tabButtons.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab))); complexitySlider.addEventListener('input', () => currentTab === 'overfitting' ? updateOverfittingView() : updateRegularizationView()); lambdaSlider.addEventListener('input', () => { if (currentTab === 'regularization') { updateRegularizationView(); resultsBox.style.display = 'none'; } }); generateNewDataBtn.addEventListener('click', generateNewData); resetRegularizationBtn.addEventListener('click', resetRegularization); findBestBtn.addEventListener('click', findBestModel); }
    function init() { if (window.CustomTerminal) { window.CustomTerminal.write("Complexity: Inicializando visualizador de complejidad y regularización.\n"); } initializeCharts(); generateNewData(); setupEventListeners(); switchTab('overfitting'); }

    init();
});