// Mover este archivo a static/js/error-comparison.js para Hugo.

// Configuración inicial
const POINT_COUNT = 20;  // Más puntos
const MIN_X = 0;
const MAX_X = 50;
const TRUE_SLOPE = 2;
const TRUE_INTERCEPT = 10;
const NORMAL_NOISE = 0.1;
const OUTLIER_NOISE = 2.0;  // Más ruido para outliers
const OUTLIER_PROBABILITY = 0.3;  // Más outliers

function generateNormalData() {
    if (window.CustomTerminal) {
        window.CustomTerminal.write("Generando datos normales (sin outliers significativos).\n");
    }
    return Array.from({ length: POINT_COUNT }, () => {
        const x = MIN_X + Math.random() * (MAX_X - MIN_X);
        const yWithoutNoise = TRUE_SLOPE * x + TRUE_INTERCEPT;
        const noise = (Math.random() - 0.5) * NORMAL_NOISE * yWithoutNoise;
        return { x, y: Math.max(0, Math.round(yWithoutNoise + noise)) };
    }).sort((a, b) => a.x - b.x);
}

function generateOutlierData() {
    if (window.CustomTerminal) {
        window.CustomTerminal.write("Generando datos con outliers.\n");
    }
    return Array.from({ length: POINT_COUNT }, () => {
        const x = MIN_X + Math.random() * (MAX_X - MIN_X);
        const yWithoutNoise = TRUE_SLOPE * x + TRUE_INTERCEPT;
        const isOutlier = Math.random() < OUTLIER_PROBABILITY;
        const noise = (Math.random() - 0.5) * (isOutlier ? OUTLIER_NOISE : NORMAL_NOISE) * yWithoutNoise;
        return { x, y: Math.max(0, Math.round(yWithoutNoise + noise)) };
    }).sort((a, b) => a.x - b.x);
}

// Inicialización del gráfico
const chart = new Chart(document.getElementById('gameChart'), {
    type: 'scatter',
    data: {
        datasets: [{
            label: 'Datos',
            data: [],
            backgroundColor: 'blue'
        }, {
            label: 'Regresión L1',
            data: [],
            type: 'line',
            borderColor: 'red',
            fill: false
        }, {
            label: 'Regresión L2',
            data: [],
            type: 'line',
            borderColor: 'green',
            fill: false
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: { display: true, text: 'X' },
                min: MIN_X,
                max: MAX_X
            },
            y: {
                title: { display: true, text: 'Y' },
                min: 0,
                max: MAX_X * TRUE_SLOPE * 1.5  // Dar más espacio vertical para ver outliers
            }
        },
        plugins: {
            legend: {
                labels: {
                    fontSize: 14
                }
            }
        }
    }
});

if (window.CustomTerminal) {
    window.CustomTerminal.write("Visualizador de Comparación de Errores L1 vs L2 inicializado.\n");
}

function gradientDescent(data, errorType) {
    let slope = 1.5;  // Valor inicial más centrado
    let intercept = 15; // Valor inicial más centrado
    const learningRate = errorType === 'L1' ? 0.0001 : 0.000001;
    const iterations = 100;

    if (window.CustomTerminal) {
        window.CustomTerminal.write(`Iniciando descenso de gradiente para ${errorType}. Tasa Aprendizaje: ${learningRate}, Iteraciones: ${iterations}\n`);
    }

    for (let i = 0; i < iterations; i++) {
        let slopeGrad = 0;
        let interceptGrad = 0;

        for (const point of data) {
            const predicted = slope * point.x + intercept;
            const error = predicted - point.y;

            if (errorType === 'L1') {
                slopeGrad += Math.sign(error) * point.x;
                interceptGrad += Math.sign(error);
            } else { // L2
                slopeGrad += error * point.x;
                interceptGrad += error;
            }
        }

        slope -= learningRate * slopeGrad;
        intercept -= learningRate * interceptGrad;

        // Aplicar límites a los valores
        slope = Math.max(1.0, Math.min(3.0, slope));
        intercept = Math.max(0, Math.min(30, intercept));
    }

    if (window.CustomTerminal) {
        window.CustomTerminal.write(`Descenso de gradiente ${errorType} finalizado. Pendiente=${slope.toFixed(2)}, Intercepto=${intercept.toFixed(2)}\n`);
    }
    return { slope, intercept };
}

function calculateErrors(data, slope, intercept) {
    return data.reduce((acc, point) => {
        const predicted = slope * point.x + intercept;
        const error = point.y - predicted;
        return {
            l1: acc.l1 + Math.abs(error),
            l2: acc.l2 + error * error
        };
    }, { l1: 0, l2: 0 });
}

function updateRegressions(newData) {
    const optimizationStatusDiv = document.getElementById('optimizationStatus');
    if (optimizationStatusDiv) {
        optimizationStatusDiv.classList.remove('hidden');
    }

    if (window.CustomTerminal) {
        window.CustomTerminal.write("Actualizando regresiones L1 y L2 con nuevos datos.\n");
    }
    const optimizationL1 = gradientDescent(newData, 'L1');
    const optimizationL2 = gradientDescent(newData, 'L2');

    const l1Line = newData.map(point => ({
        x: point.x,
        y: optimizationL1.slope * point.x + optimizationL1.intercept
    }));

    const l2Line = newData.map(point => ({
        x: point.x,
        y: optimizationL2.slope * point.x + optimizationL2.intercept
    }));

    // Calcular errores
    const errorsL1 = calculateErrors(newData, optimizationL1.slope, optimizationL1.intercept);
    const errorsL2 = calculateErrors(newData, optimizationL2.slope, optimizationL2.intercept);

    // Actualizar tabla de errores
    const errorL1Val = (errorsL1.l1 / newData.length).toFixed(2);
    const errorL2Val = (errorsL2.l2 / newData.length).toFixed(2);
    document.getElementById('errorL1').textContent = errorL1Val;
    document.getElementById('errorL2').textContent = errorL2Val;

    if (window.CustomTerminal) {
        window.CustomTerminal.write(`Errores calculados: L1 MAE = ${errorL1Val}, L2 MSE = ${errorL2Val}\n`);
    }

    chart.data.datasets[0].data = newData;
    chart.data.datasets[1].data = l1Line;
    chart.data.datasets[2].data = l2Line;
    chart.update();

    if (optimizationStatusDiv) {
        optimizationStatusDiv.classList.add('hidden');
    }
}

document.getElementById('generateNormal').addEventListener('click', () => {
    if (window.CustomTerminal) {
        window.CustomTerminal.write("Usuario solicitó generar datos normales.\n");
    }
    updateRegressions(generateNormalData());
});

document.getElementById('generateOutliers').addEventListener('click', () => {
    if (window.CustomTerminal) {
        window.CustomTerminal.write("Usuario solicitó generar datos con outliers.\n");
    }
    updateRegressions(generateOutlierData());
});

// Inicialización
updateRegressions(generateNormalData());
