document.addEventListener('DOMContentLoaded', () => {
    // --- Constants ---
    const NUM_DATA_POINTS = 1000;

    // --- DOM Elements ---
    const dataContainer = document.getElementById('data-container');
    const kFoldsInput = document.getElementById('k-folds-input');
    const runSimpleSplitBtn = document.getElementById('run-simple-split-btn');
    const runKFoldBtn = document.getElementById('run-k-fold-btn');
    const regenerateDataBtn = document.getElementById('regenerate-data-btn');

    const simpleResultLatestEl = document.getElementById('simple-result-latest');
    const simpleResultHistoryEl = document.getElementById('simple-result-history');

    const kFoldProcessEl = document.getElementById('k-fold-process');
    const kFoldFinalResultLatestEl = document.getElementById('k-fold-final-result-latest');
    const kFoldHistoryEl = document.getElementById('k-fold-history');

    // --- State ---
    let dataPoints = [];
    let simpleSplitHistory = [];
    let kFoldHistory = [];
    const allButtons = [runSimpleSplitBtn, runKFoldBtn, regenerateDataBtn];

    function init() {
        generateDataPoints();
        runSimpleSplitBtn.addEventListener('click', runSimpleSplitStandalone);
        runKFoldBtn.addEventListener('click', runKFoldStandalone);
        regenerateDataBtn.addEventListener('click', regenerateData);
        if (window.CustomTerminal) {
            window.CustomTerminal.write("KFoldValidator: Inicializado.\n");
        }
    }

    function setControlsDisabled(disabled) {
        allButtons.forEach(btn => btn.disabled = disabled);
        kFoldsInput.disabled = disabled;
    }

    function generateDataPoints() {
        dataContainer.innerHTML = '';
        dataPoints = [];
        for (let i = 0; i < NUM_DATA_POINTS; i++) {
            const point = document.createElement('div');
            point.className = 'data-point';
            point.dataset.id = i;
            point.dataset.difficulty = Math.random();
            dataContainer.appendChild(point);
            dataPoints.push(point);
        }
        if (window.CustomTerminal) {
            window.CustomTerminal.write(`KFoldValidator: Generados ${NUM_DATA_POINTS} nuevos puntos de datos.\n`);
        }
    }

    function regenerateData() {
        clearAll();
        generateDataPoints();
        const originalText = regenerateDataBtn.textContent;
        regenerateDataBtn.textContent = '¡Datos Regenerados!';
        setControlsDisabled(true);
        setTimeout(() => {
            regenerateDataBtn.textContent = originalText;
            setControlsDisabled(false);
        }, 1000);
    }

    function clearAll() {
        dataPoints.forEach(point => { point.className = 'data-point'; });
        simpleResultLatestEl.textContent = '';
        kFoldProcessEl.innerHTML = '';
        kFoldProcessEl.classList.remove('visible');
        kFoldFinalResultLatestEl.textContent = '';
        simpleSplitHistory = [];
        kFoldHistory = [];
        updateHistoryDisplay('simple');
        updateHistoryDisplay('kfold');
    }

    function clearSpecificVisuals(type) {
        if (type === 'simple') {
            dataPoints.forEach(p => p.classList.remove('train', 'test'));
        } else if (type === 'kfold') {
            dataPoints.forEach(p => { p.className = 'data-point'; });
            kFoldProcessEl.classList.remove('visible');
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function simulateModelEvaluation(testPoints, trainPoints) {
        const trainDifficultySum = trainPoints.reduce((sum, point) => sum + parseFloat(point.dataset.difficulty), 0);
        const avgTrainDifficulty = trainDifficultySum / trainPoints.length;
        const trainingNoise = (Math.random() - 0.5) * 0.5;
        const modelQualityPenalty = (0.5 - avgTrainDifficulty) * 3 + trainingNoise;
        const testDifficultySum = testPoints.reduce((sum, point) => sum + parseFloat(point.dataset.difficulty), 0);
        const avgTestDifficulty = testDifficultySum / testPoints.length;
        const baseError = 5 + avgTestDifficulty * 10;
        const finalError = baseError + modelQualityPenalty;
        return Math.max(3.0, Math.min(17.0, finalError));
    }


    async function runSimpleSplitStandalone() {
        setControlsDisabled(true);
        clearSpecificVisuals('kfold');
        simpleResultLatestEl.textContent = 'Calculando...';
        if (window.CustomTerminal) {
            window.CustomTerminal.write("KFoldValidator: Iniciando validación simple (80/20 split).\n");
        }
        await new Promise(res => setTimeout(res, 200));
        const shuffledPoints = [...dataPoints];
        shuffleArray(shuffledPoints);
        const trainSize = Math.floor(NUM_DATA_POINTS * 0.8);
        const trainPoints = shuffledPoints.slice(0, trainSize);
        const testPoints = shuffledPoints.slice(trainSize);
        shuffledPoints.forEach((point, index) => {
            point.classList.remove('train', 'test');
            point.classList.add(index < trainSize ? 'train' : 'test');
        });
        const error = simulateModelEvaluation(testPoints, trainPoints);
        simpleSplitHistory.push(error);
        simpleResultLatestEl.textContent = `Último Error: ${error.toFixed(2)}%`;
        updateHistoryDisplay('simple');
        setControlsDisabled(false);
        if (window.CustomTerminal) {
            window.CustomTerminal.write(`KFoldValidator: Validación simple completada. Error: ${error.toFixed(2)}%.\n`);
        }
    }

    async function runKFoldStandalone() {
        setControlsDisabled(true);
        clearSpecificVisuals('simple');

        // --- LÓGICA DE PREPARACIÓN CORREGIDA ---
        // 1. Limpiar el contenido anterior del cuadro.
        kFoldProcessEl.innerHTML = '';
        // 2. Hacer visible el cuadro para que la animación pueda empezar.
        kFoldProcessEl.classList.add('visible');
        // 3. Limpiar cualquier texto de resultado final anterior.
        kFoldFinalResultLatestEl.textContent = '';

        // 4. Ahora, ejecutar el proceso que llenará el cuadro ya visible.
        await runKFold();

        setControlsDisabled(false);
    }

    async function runKFold() {
        const k = parseInt(kFoldsInput.value, 10);
        if (k < 2 || k > 10) {
            alert("Por favor, elige un valor de K entre 2 y 10.");
            // Si el usuario cancela o pone un valor malo, ocultamos el cuadro.
            kFoldProcessEl.classList.remove('visible');
            if (window.CustomTerminal) {
                window.CustomTerminal.write(`KFoldValidator: Intento de K-Fold cancelado por valor de K inválido: ${k}.\n`);
            }
            return;
        }
        if (window.CustomTerminal) {
            window.CustomTerminal.write(`KFoldValidator: Iniciando validación K-Fold con K=${k}.\n`);
        }

        // --- LIMPIEZA PROBLEMÁTICA ELIMINADA DE AQUÍ ---

        const shuffledPoints = [...dataPoints];
        shuffleArray(shuffledPoints);
        const foldSize = Math.floor(NUM_DATA_POINTS / k);
        const folds = [];
        for (let i = 0; i < k; i++) {
            const start = i * foldSize;
            const end = (i === k - 1) ? NUM_DATA_POINTS : start + foldSize;
            const fold = shuffledPoints.slice(start, end);
            folds.push(fold);
            fold.forEach(point => point.classList.add(`fold-${i + 1}`));
        }

        await new Promise(res => setTimeout(res, 300));

        let totalError = 0;
        for (let i = 0; i < k; i++) {
            dataPoints.forEach(point => point.classList.remove('is-training', 'is-testing'));
            await new Promise(res => setTimeout(res, 50));
            const testPoints = folds[i];
            const trainPoints = folds.filter((_, index) => index !== i).flat();
            for (let j = 0; j < k; j++) {
                folds[j].forEach(point => point.classList.add(i === j ? 'is-testing' : 'is-training'));
            }
            const error = simulateModelEvaluation(testPoints, trainPoints);
            totalError += error;
            const resultP = document.createElement('p');
            resultP.textContent = `Ronda ${i + 1}: Error = ${error.toFixed(2)}%`;
            kFoldProcessEl.appendChild(resultP);
            kFoldProcessEl.scrollTop = kFoldProcessEl.scrollHeight;
            await new Promise(res => setTimeout(res, 800));
        }

        kFoldFinalResultLatestEl.textContent = 'Calculando promedio...';
        await new Promise(res => setTimeout(res, 600));

        const avgError = totalError / k;
        kFoldHistory.push(avgError);
        kFoldFinalResultLatestEl.textContent = `Último Error Promedio: ${avgError.toFixed(2)}%`;
        updateHistoryDisplay('kfold');
        dataPoints.forEach(point => point.classList.remove('is-training', 'is-testing'));
        if (window.CustomTerminal) {
            window.CustomTerminal.write(`KFoldValidator: K-Fold completado. Error promedio: ${avgError.toFixed(2)}%.\n`);
        }
    }

    function updateHistoryDisplay(type) {
        if (type === 'simple') {
            simpleResultHistoryEl.innerHTML = '';
            const stableAvg = kFoldHistory.length > 0 ? kFoldHistory.reduce((a, b) => a + b, 0) / kFoldHistory.length : 10;
            simpleSplitHistory.forEach(val => {
                const item = document.createElement('span');
                item.className = 'history-item';
                item.textContent = val.toFixed(2);
                if (val < stableAvg - 1.5) item.classList.add('lucky');
                if (val > stableAvg + 1.5) item.classList.add('unlucky');
                simpleResultHistoryEl.appendChild(item);
            });
            simpleResultHistoryEl.scrollTop = simpleResultHistoryEl.scrollHeight;
        } else {
            kFoldHistoryEl.innerHTML = '';
            kFoldHistory.forEach(val => {
                const item = document.createElement('span');
                item.className = 'history-item';
                item.textContent = val.toFixed(2);
                kFoldHistoryEl.appendChild(item);
            });
            kFoldHistoryEl.scrollTop = kFoldHistoryEl.scrollHeight;
        }
    }

    init();
});