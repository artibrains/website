// Configuración inicial
const POINT_COUNT = 100;
const CANVAS_SIZE = 400;

// Generación de datos
function generateData() {
    const data = [];
    for (let i = 0; i < POINT_COUNT; i++) {
        // Clase 0: distribución normal alrededor de (-1, -1)
        if (i < POINT_COUNT / 2) {
            data.push({
                x: randn_bm() - 1,
                y: randn_bm() - 1,
                class: 0
            });
        }
        // Clase 1: distribución normal alrededor de (1, 1)
        else {
            data.push({
                x: randn_bm() + 1,
                y: randn_bm() + 1,
                class: 1
            });
        }
    }
    return data;
}

// Distribución normal Box-Muller
function randn_bm() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Función sigmoide
function sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
}

// Generar puntos de la línea de decisión
function generateDecisionBoundary() {
    const points = [];
    for (let x = -3; x <= 3; x += 0.1) {
        // Resolver w1*x + w2*y + b = 0 para y
        const y = (-w1 * x - b) / w2;
        points.push({ x: x, y: y });
    }
    return points;
}

// Función para generar las etiquetas flotantes
function generateZoneLabels() {
    // Calcular un punto en el centro de cada zona
    const x = 2;  // Posición x fija para las etiquetas
    const y = (-w1 * x - b) / w2;  // Punto en la línea de decisión

    return [{
        label: 'No asistirán',
        position: { x: x, y: y + 1 },  // Etiqueta encima de la línea
        color: 'rgba(255, 0, 0, 0.8)',
        anchor: 'center'
    }, {
        label: 'Asistirán',
        position: { x: x, y: y - 1 },  // Etiqueta debajo de la línea
        color: 'rgba(0, 0, 255, 0.8)',
        anchor: 'center'
    }];
}

// Variables globales
let data = generateData();
let showSigmoid = false; // Cambiar a false para empezar en modo clasificación
let w1 = 1, w2 = 1, b = 0, threshold = 0.5;

// Registrar el plugin datalabels
Chart.register(ChartDataLabels);

// Inicialización del gráfico
const ctx = document.getElementById('gameChart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'scatter',
    data: {
        datasets: [{
            label: 'Pacientes',
            data: data,
            pointBackgroundColor: function (context) {
                const index = context.dataIndex;
                const point = data[index];

                // Color según su clase real (no predicha)
                const trueColor = point.class === 1 ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 255, 0.3)';

                return trueColor; // Color real del punto
            },
            pointBorderColor: function (context) {
                const index = context.dataIndex;
                const point = data[index];
                const z = w1 * point.x + w2 * point.y + b;
                const prob = sigmoid(z);
                return prob > threshold ? 'rgba(255, 0, 0, 0.9)' : 'rgba(0, 0, 255, 0.9)';
            },
            pointBorderWidth: 2,
            pointRadius: 6
        },
        {
            label: 'Frontera de decisión',
            data: generateDecisionBoundary(),
            type: 'line',
            borderColor: '#28a745',
            borderWidth: 2,
            fill: false,
            pointRadius: 0
        },
        {
            label: 'Etiquetas de zona',
            data: generateZoneLabels().map(label => label.position),
            backgroundColor: 'transparent',
            datalabels: {
                color: function (context) {
                    return context.dataIndex === 0 ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 0, 255, 0.8)';
                },
                font: { size: 16, weight: 'bold' },
                formatter: function (value, context) {
                    return context.dataIndex === 0 ? 'No asistirán' : 'Asistirán';
                }
            }
        }]
    },
    options: {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Clasificación de Pacientes' // Título inicial para modo clasificación
            },
            legend: {
                display: true,
                position: 'top'
            },
            datalabels: {
                display: function (context) {
                    return context.datasetIndex === 2;  // Solo mostrar etiquetas para el tercer dataset
                },
                anchor: 'center',
                align: 'center'
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const point = data[context.dataIndex];
                        const realClass = point.class === 1 ? 'No asistirá' : 'Asistirá';
                        const z = w1 * point.x + w2 * point.y + b;
                        const prob = sigmoid(z);
                        const predicted = prob > threshold ? 'No asistirá' : 'Asistirá';
                        return [
                            `Real: ${realClass}`,
                            `Predicción: ${predicted}`,
                            `Probabilidad: ${(prob * 100).toFixed(1)}%`
                        ];
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Indicador 1'
                },
                min: -3,
                max: 3,
                grid: {
                    drawOnChartArea: true
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Indicador 2'
                },
                min: -3,
                max: 3,
                grid: {
                    drawOnChartArea: true
                }
            }
        }
    }
});

// Event listeners
document.getElementById('w1Slider').addEventListener('input', e => {
    w1 = parseFloat(e.target.value);
    document.getElementById('w1Value').textContent = w1.toFixed(1);
    updateChart();
});

document.getElementById('w2Slider').addEventListener('input', e => {
    w2 = parseFloat(e.target.value);
    document.getElementById('w2Value').textContent = w2.toFixed(1);
    updateChart();
});

document.getElementById('bSlider').addEventListener('input', e => {
    b = parseFloat(e.target.value);
    document.getElementById('bValue').textContent = b.toFixed(1);
    updateChart();
});

document.getElementById('thresholdSlider').addEventListener('input', e => {
    threshold = parseFloat(e.target.value);
    document.getElementById('thresholdValue').textContent = threshold.toFixed(1);
    updateChart();
});

document.getElementById('toggleSigmoid').addEventListener('click', () => {
    showSigmoid = !showSigmoid;

    // Actualizar texto del botón y modo
    const toggleText = document.getElementById('toggleText');
    const modeText = document.getElementById('modeText');

    if (showSigmoid) {
        toggleText.textContent = 'Ver Clasificación';
        modeText.textContent = 'Modo actual: Probabilidades';
        chart.options.plugins.title.text = 'Probabilidad de No Asistencia';
    } else {
        toggleText.textContent = 'Ver Probabilidades';
        modeText.textContent = 'Modo actual: Clasificación Simple';
        chart.options.plugins.title.text = 'Clasificación de Pacientes';
    }

    chart.data.datasets[0].pointBackgroundColor = chart.data.datasets[0].pointBackgroundColor;
    chart.update();
});

document.getElementById('resetButton').addEventListener('click', () => {
    // Generar nuevos datos primero
    data = generateData();

    // Restablecer parámetros
    w1 = 1;
    w2 = 1;
    b = 0;
    threshold = 0.5;
    showSigmoid = false;

    // Reset sliders
    document.getElementById('w1Slider').value = w1;
    document.getElementById('w2Slider').value = w2;
    document.getElementById('bSlider').value = b;
    document.getElementById('thresholdSlider').value = threshold;

    // Reset values
    document.getElementById('w1Value').textContent = w1.toFixed(1);
    document.getElementById('w2Value').textContent = w2.toFixed(1);
    document.getElementById('bValue').textContent = b.toFixed(1);
    document.getElementById('thresholdValue').textContent = threshold.toFixed(1);

    // Reset mode text
    document.getElementById('toggleText').textContent = 'Ver Probabilidades';
    document.getElementById('modeText').textContent = 'Modo actual: Clasificación Simple';

    // Actualizar gráfico con los nuevos datos
    chart.data.datasets[0].data = data;
    updateChart();
    if (window.GameResultsModal) { // Hide modal on reset
        window.GameResultsModal.hide();
    }
    if (window.CustomTerminal) {
        window.CustomTerminal.write("Juego Sigmoide reiniciado. Nuevos datos generados y parámetros reseteados.\n");
    }
});

// Modificar el event listener del botón de comprobar
document.getElementById('checkButton').addEventListener('click', () => {
    const accuracy = calculateAccuracy();
    const correct = Math.round(accuracy * data.length / 100);
    const total = data.length;
    const currentThreshold = parseFloat(document.getElementById('thresholdSlider').value);

    let summaryMessage;
    let detailsHtml = `
        <table>
            <tr><th>Métrica</th><th>Valor</th></tr>
            <tr><td>Precisión</td><td>${accuracy.toFixed(1)}%</td></tr>
            <tr><td>Pacientes Correctamente Clasificados</td><td>${correct} de ${total}</td></tr>
            <tr><td>Umbral de Decisión</td><td>${currentThreshold.toFixed(2)}</td></tr>
        </table>
    `;

    if (accuracy >= 80) {
        summaryMessage = `¡Excelente trabajo! 🎉 Has conseguido una precisión del ${accuracy.toFixed(1)}%, superando el objetivo del 80%. Tu modelo identifica correctamente el riesgo de no-show en la mayoría de los pacientes.`;
    } else if (accuracy >= 70) {
        summaryMessage = `¡Buen intento! 👍 Has alcanzado una precisión del ${accuracy.toFixed(1)}%. Estás cerca del objetivo. Prueba ajustando un poco más los parámetros.`;
    } else {
        summaryMessage = `Sigue intentándolo 💪 Tu precisión actual es del ${accuracy.toFixed(1)}%. Consejo: Observa cómo la línea verde separa los grupos de puntos y ajusta los parámetros para mejorar la clasificación.`;
    }

    if (window.CustomTerminal) {
        window.CustomTerminal.write(`Comprobación de clasificación: Precisión=${accuracy.toFixed(1)}%, Correctos=${correct}/${total}, Umbral=${currentThreshold.toFixed(2)}\n`);
    }

    if (window.GameResultsModal) {
        window.GameResultsModal.show(
            'Resultados de la Clasificación',
            summaryMessage,
            detailsHtml
        );
    } else {
        console.error("GameResultsModal no está disponible.");
        if (window.CustomTerminal) {
            window.CustomTerminal.write("Error: GameResultsModal no disponible para mostrar resultados.\n");
        }
        // Fallback to alert if modal is not available
        alert(`Resultados:\nPrecisión: ${accuracy.toFixed(1)}%\nCorrectos: ${correct}/${total}\nUmbral: ${currentThreshold.toFixed(2)}\n\n${summaryMessage}`);
    }
});

function calculateAccuracy() {
    let correct = 0;
    data.forEach(point => {
        // Usar el modelo de regresión logística
        const z = w1 * point.x + w2 * point.y + b;  // Combinación lineal
        const prob = sigmoid(z);  // Transformación sigmoide
        const predicted = prob > threshold ? 1 : 0;  // Clasificación según umbral
        if (predicted === point.class) correct++;
    });
    return (correct / data.length) * 100;
}

// Modificar updateChart para evitar mostrar modal automáticamente
function updateChart() {
    // Actualizar línea de decisión
    chart.data.datasets[1].data = generateDecisionBoundary();
    chart.data.datasets[2].data = generateZoneLabels();
    chart.update();

    // Logica de actualización del modal anterior eliminada de aquí.
    // El botón "Comprobar clasificación" se encargará de mostrar los resultados.
    if (window.CustomTerminal) {
        const currentW1 = parseFloat(document.getElementById('w1Slider').value);
        const currentW2 = parseFloat(document.getElementById('w2Slider').value);
        const currentB = parseFloat(document.getElementById('bSlider').value);
        const currentThreshold = parseFloat(document.getElementById('thresholdSlider').value);
        // Avoid logging too frequently if updateChart is called rapidly by sliders
        // This simple check helps, but a debounce/throttle would be better for performance.
        if (w1 !== currentW1 || w2 !== currentW2 || b !== currentB || threshold !== currentThreshold) {
            // This log might be too verbose if sliders update very fast.
            // window.CustomTerminal.write(`Parámetros actualizados: w1=${currentW1.toFixed(1)}, w2=${currentW2.toFixed(1)}, b=${currentB.toFixed(1)}, Umbral=${currentThreshold.toFixed(1)}. Gráfico actualizado.\n`);
        }
    }
}

// Inicialización
updateChart();
if (window.CustomTerminal) {
    window.CustomTerminal.write("Juego Sigmoide: Gráfico inicializado.\n");
}
// Mostrar botón de resultados
const showResultsButton = document.getElementById('showResultsButton');
showResultsButton.classList.remove('hidden');
showResultsButton.classList.add('show');


// Event listeners para el modal
document.querySelector('.close-button').addEventListener('click', hideModal);
document.getElementById('showResultsButton').addEventListener('click', showModal);
document.getElementById('resultsModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) hideModal();
});

// Inicialización
updateChart();
