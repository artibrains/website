// Game configuration
const POINT_COUNT = 15;
const MIN_PATIENTS = 5;
const MAX_PATIENTS = 50;
const MIN_SLOPE = 1.0;     // Minimum masks per patient
const MAX_SLOPE = 3.0;     // Maximum masks per patient
const MIN_INTERCEPT = 0;   // Minimum base stock
const MAX_INTERCEPT = 30;  // Maximum base stock
const NOISE_FACTOR = 0.3;

// Generate game data
function generateData() {
    if (window.CustomTerminal) {
        window.CustomTerminal.write("LinearRegressionGame: Generando nuevos datos para el juego.\n");
    }
    const trueSlope = MIN_SLOPE + Math.random() * (MAX_SLOPE - MIN_SLOPE);
    const trueIntercept = MIN_INTERCEPT + Math.random() * (MAX_INTERCEPT - MIN_INTERCEPT);

    if (window.CustomTerminal) {
        window.CustomTerminal.write(`Generando nuevos datos. Parámetros reales: Pendiente (m) = ${trueSlope.toFixed(2)}, Intercepto (b) = ${trueIntercept.toFixed(2)}\n`);
    }

    return Array.from({ length: POINT_COUNT }, () => {
        const x = MIN_PATIENTS + Math.random() * (MAX_PATIENTS - MIN_PATIENTS);
        const yWithoutNoise = trueSlope * x + trueIntercept;
        const noise = (Math.random() - 0.5) * NOISE_FACTOR * yWithoutNoise;
        const y = Math.max(0, Math.round(yWithoutNoise + noise));
        return { x, y };
    }).sort((a, b) => a.x - b.x);
}

// Initialize game
const data = generateData();
if (window.CustomTerminal) {
    window.CustomTerminal.write("LinearRegressionGame: Juego de regresión lineal inicializado.\n");
}
const chart = new Chart(document.getElementById('gameChart'), {
    type: 'scatter',
    data: {
        datasets: [{
            label: 'Real data',
            data: data,
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--INTERNAL-MAIN-LINK-color'),
            pointRadius: 5,  // Make real data points visible and larger
            type: 'scatter'  // Ensure scatter type for real data
        }, {
            label: 'Your prediction',
            data: [],
            type: 'line',
            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--INTERNAL-BOX-CAUTION-color'),
            fill: false,
            showLine: true,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        elements: {
            line: {
                tension: 0  // Keep straight lines
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Number of patients'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Masks needed'
                }
            }
        }
    }
});

if (window.CustomTerminal) {
    window.CustomTerminal.write("Juego de Regresión Lineal iniciado.\n");
}

// Event handlers and UI updates
const slopeSlider = document.getElementById('slopeSlider');
const interceptSlider = document.getElementById('interceptSlider');
const checkButton = document.getElementById('checkButton');

function updateLine() {
    const slope = parseFloat(slopeSlider.value);
    const intercept = parseFloat(interceptSlider.value);

    // Just two points for the line
    const lineData = [
        { x: MIN_PATIENTS, y: slope * MIN_PATIENTS + intercept },
        { x: MAX_PATIENTS, y: slope * MAX_PATIENTS + intercept }
    ];

    chart.data.datasets[1].data = lineData;
    chart.data.datasets[1].showLine = true;
    chart.update();

    document.getElementById('slopeValue').textContent = slope.toFixed(1);
    document.getElementById('interceptValue').textContent = intercept;

    if (window.CustomTerminal && (slopeSlider.value !== previousSlope || interceptSlider.value !== previousIntercept)) {
        window.CustomTerminal.write(`Usuario ajustó línea: Pendiente=${slope.toFixed(1)}, Intercepto=${intercept}\n`);
        previousSlope = slopeSlider.value;
        previousIntercept = interceptSlider.value;
    }

    // The old logic for hiding showResultsButton is no longer needed as the button is removed.
}

function calculateError(slope, intercept, errorType, logCalculationDetails = true) {
    const errors = data.map(point => {
        const predicted = slope * point.x + intercept;
        const error = point.y - predicted;
        return errorType === 'L1' ? Math.abs(error) : error * error;
    });

    if (logCalculationDetails && window.CustomTerminal) {
        window.CustomTerminal.write(`Detalle cálculo error: Tipo=${errorType}, Pendiente=${slope.toFixed(2)}, Intercepto=${intercept.toFixed(2)}\n`);
        const averageError = errors.reduce((sum, err) => sum + err, 0) / data.length;
        if (errorType === 'L1') {
            window.CustomTerminal.write(`Error L1 (MAE) resultante: ${averageError.toFixed(3)}\n`);
        } else {
            window.CustomTerminal.write(`Error L2 (MSE) resultante: ${averageError.toFixed(3)}\n`);
        }
    }

    return errors.reduce((sum, error) => sum + error, 0) / data.length;
}

function gradientDescent(errorType) {
    let slope = 1.5;
    let intercept = 15;
    const learningRate = errorType === 'L1' ? 0.0001 : 0.000001;
    const iterations = 100;
    const steps = [];

    if (window.CustomTerminal) {
        window.CustomTerminal.write(`Iniciando descenso de gradiente. Tipo Error: ${errorType}, Tasa Aprendizaje: ${learningRate}, Iteraciones: ${iterations}\n`);
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

        slope = Math.max(MIN_SLOPE, Math.min(MAX_SLOPE, slope));
        intercept = Math.max(MIN_INTERCEPT, Math.min(MAX_INTERCEPT, intercept));

        const currentStepError = calculateError(slope, intercept, errorType, false); // Calculate error without logging details
        steps.push({ slope, intercept, error: currentStepError });



    }


    return {
        final: { slope, intercept },
        steps: steps
    };
}

function animateGradientDescent(steps, finalCallback) {
    let stepIndex = 0;
    const animationSpeed = 50;

    if (window.CustomTerminal) {
        window.CustomTerminal.write("Iniciando animación del descenso de gradiente...\n");
    }

    if (chart.data.datasets.length === 2) {
        chart.data.datasets.push({
            label: 'Optimización',
            data: [],
            type: 'line',
            borderColor: 'green',
            fill: false,
            showLine: true,
            pointRadius: 0
        });
    }

    function updateStep() {
        if (stepIndex >= steps.length) {
            finalCallback();
            return;
        }

        const { slope, intercept, error } = steps[stepIndex]; // Destructure error as well

        if (window.CustomTerminal) {
            window.CustomTerminal.write(`Iteración ${stepIndex + 1}: Pendiente=${slope.toFixed(2)}, Intercepto=${intercept.toFixed(2)}, Error=${error.toFixed(3)}\n`);
        }

        const lineData = data.map(point => ({
            x: point.x,
            y: slope * point.x + intercept
        }));

        chart.data.datasets[2].data = lineData;
        chart.update('none');

        stepIndex++;
        setTimeout(updateStep, animationSpeed);
    }

    updateStep(); // Initial call to start the animation
}

// Remove old showModal and hideModal functions for 'resultsModal'

// Remove event listeners for the old modal elements
// document.querySelector('.close-button').addEventListener('click', hideModal); // Old
// document.getElementById('showResultsButton').addEventListener('click', showModal); // Old
// document.getElementById('resultsModal').addEventListener('click', function (e) { // Old
//     if (e.target === this) {
//         hideModal();
//     }
// });

// The DOMContentLoaded listener for the old modal is also removed.

function resetGame() {
    data.length = 0;
    generateData().forEach(point => data.push(point));

    slopeSlider.value = 1;
    interceptSlider.value = 10;

    chart.data.datasets = [{
        label: 'Real data',
        data: data,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--INTERNAL-MAIN-LINK-color'),
        pointRadius: 5,  // Make real data points visible and larger
        type: 'scatter'  // Ensure scatter type for real data
    }, {
        label: 'Your prediction',
        data: [],
        type: 'line',
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--INTERNAL-BOX-CAUTION-color'),
        fill: false,
        showLine: true,
        pointRadius: 0
    }];
    // Remove the third dataset (optimization line) if it exists
    if (chart.data.datasets.length > 2) {
        chart.data.datasets.pop();
    }

    if (window.GameResultsModal) {
        window.GameResultsModal.hide();
    }
    // The old showResultsButton hiding logic is removed.

    updateLine();
    if (window.CustomTerminal) { // Log initial line after reset
        const currentSlope = parseFloat(slopeSlider.value);
        const currentIntercept = parseFloat(interceptSlider.value);
        window.CustomTerminal.write(`Línea de predicción tras reseteo: Pendiente=${currentSlope.toFixed(1)}, Intercepto=${currentIntercept}\n`);
    }
    previousSlope = slopeSlider.value; // Update previous values
    previousIntercept = slopeSlider.value; // Corrected: should be interceptSlider.value


    checkButton.disabled = false;
    slopeSlider.disabled = false;
    interceptSlider.disabled = false;
    if (window.CustomTerminal) {
        window.CustomTerminal.write("Juego reiniciado.\n"); // Simplified message
    }
}

document.getElementById('resetButton').addEventListener('click', resetGame);

// Add event listeners for sliders and error type changes
let previousSlope = slopeSlider.value;
let previousIntercept = interceptSlider.value; // Corrected initialization

slopeSlider.addEventListener('input', () => {
    updateLine();
    const showResultsButton = document.getElementById('showResultsButton'); // This element no longer exists
    if (showResultsButton && !showResultsButton.classList.contains('hidden')) { // Check if it exists before trying to access classList
        showResultsButton.classList.add('hidden');
    }
});
interceptSlider.addEventListener('input', () => {
    updateLine();
    const showResultsButton = document.getElementById('showResultsButton'); // This element no longer exists
    if (showResultsButton && !showResultsButton.classList.contains('hidden')) { // Check if it exists
        showResultsButton.classList.add('hidden');
    }
});

document.getElementById('errorType').addEventListener('change', () => {
    const errorType = document.getElementById('errorType').value;
    if (window.CustomTerminal) {
        window.CustomTerminal.write(`Usuario cambió tipo de error a: ${errorType}\n`);
    }
    const showResultsButton = document.getElementById('showResultsButton'); // This element no longer exists
    if (showResultsButton && !showResultsButton.classList.contains('hidden')) { // Check if it exists
        showResultsButton.classList.add('hidden');
    }
});

checkButton.addEventListener('click', () => {
    const errorType = document.getElementById('errorType').value;
    const userSlope = parseFloat(slopeSlider.value);
    const userIntercept = parseFloat(interceptSlider.value);

    if (window.CustomTerminal) {
        window.CustomTerminal.write(`Usuario verificó resultado. Pendiente: ${userSlope.toFixed(2)}, Intercepto: ${userIntercept.toFixed(2)}, Tipo Error: ${errorType}\n`);
    }

    checkButton.disabled = true;
    slopeSlider.disabled = true;
    interceptSlider.disabled = true;
    document.getElementById('optimizationStatus').classList.remove('hidden');

    const optimization = gradientDescent(errorType);
    const userError = calculateError(userSlope, userIntercept, errorType);
    const optimalError = calculateError(optimization.final.slope, optimization.final.intercept, errorType);

    animateGradientDescent(optimization.steps, () => {
        document.getElementById('optimizationStatus').classList.add('hidden');
        if (window.CustomTerminal) {
            window.CustomTerminal.write(`Animación del descenso de gradiente finalizada. Solución óptima alcanzada: Pendiente=${optimization.final.slope.toFixed(2)}, Intercepto=${optimization.final.intercept.toFixed(2)}, Error=${optimalError.toFixed(3)}\n`);
        }

        const errorDiff = Math.abs(userError - optimalError); // Simpler difference for summary
        let summaryMessage;
        if (errorDiff < 0.1 * optimalError && errorDiff < 5) { // Be a bit more lenient if optimalError is very small
            summaryMessage = `¡Felicidades! 🎉 Tu predicción es muy cercana a la óptima. Error de tu predicción: ${userError.toFixed(3)}.`;
        } else if (userError < optimalError * 1.5) {
            summaryMessage = `¡Buen intento! 👍 Tu predicción está cerca. Error óptimo: ${optimalError.toFixed(3)}, Tu error: ${userError.toFixed(3)}.`;
        }
        else {
            summaryMessage = `Puedes mejorar. 📈 Error óptimo: ${optimalError.toFixed(3)}, Tu error: ${userError.toFixed(3)}. Intenta ajustar los parámetros.`;
        }

        const detailsHtml = `
            <table>
                <thead>
                    <tr>
                        <th>Parámetro</th>
                        <th>Tu Solución</th>
                        <th>Solución Óptima (${errorType})</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Pendiente (m)</td>
                        <td>${userSlope.toFixed(2)}</td>
                        <td>${optimization.final.slope.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Intercepto (b)</td>
                        <td>${userIntercept.toFixed(2)}</td>
                        <td>${optimization.final.intercept.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Error (${errorType})</td>
                        <td>${userError.toFixed(3)}</td>
                        <td>${optimalError.toFixed(3)}</td>
                    </tr>
                </tbody>
            </table>
        `;

        if (window.CustomTerminal) {
            window.CustomTerminal.write(`Resultados para modal: Usuario (Error: ${userError.toFixed(3)}), Óptimo (Error: ${optimalError.toFixed(3)})\n`);
            window.CustomTerminal.write(summaryMessage + "\n");
        }

        if (window.GameResultsModal) {
            window.GameResultsModal.show(
                'Comparación de Resultados',
                summaryMessage,
                detailsHtml
            );
        } else {
            console.error("GameResultsModal no está disponible.");
            // Fallback to alert
            alert(`Resultados:\n${summaryMessage}\n\nTu Pendiente: ${userSlope.toFixed(2)}, Intercepto: ${userIntercept.toFixed(2)}, Error: ${userError.toFixed(3)}\nÓptimo Pendiente: ${optimization.final.slope.toFixed(2)}, Intercepto: ${optimization.final.intercept.toFixed(2)}, Error: ${optimalError.toFixed(3)}`);
        }

        // The old showResultsButton logic is removed.
        checkButton.disabled = false;
        slopeSlider.disabled = false;
        interceptSlider.disabled = false;
    });
});

// Initial line update
updateLine();
if (window.CustomTerminal) {
    const initialSlope = parseFloat(slopeSlider.value);
    const initialIntercept = parseFloat(interceptSlider.value);
    window.CustomTerminal.write(`Línea de predicción inicial del usuario: Pendiente=${initialSlope.toFixed(1)}, Intercepto=${initialIntercept}\n`);
}
// Ensure previous values are set after initial updateLine call
previousSlope = slopeSlider.value;
previousIntercept = slopeSlider.value; // Corrected