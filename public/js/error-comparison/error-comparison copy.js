// Mover este archivo a static/js/error-comparison.js para Hugo.

// Debug logger for visual output
function debugLog(message) {
    console.log(message);
    const debugDiv = document.getElementById('debugLog');
    if (debugDiv) {
        debugDiv.innerHTML += message + '<br>';
        debugDiv.scrollTop = debugDiv.scrollHeight;
    }
}

// File timestamp: 2025-08-14 - LATEST VERSION
debugLog('=== JS FILE LOADED: 2025-08-14 LATEST ===');

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
        window.CustomTerminal.write("ErrorComparison: Generando datos normales (sin outliers significativos).\n");
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
        window.CustomTerminal.write("ErrorComparison: Generando datos con outliers.\n");
    }
    return Array.from({ length: POINT_COUNT }, () => {
        const x = MIN_X + Math.random() * (MAX_X - MIN_X);
        const yWithoutNoise = TRUE_SLOPE * x + TRUE_INTERCEPT;
        const isOutlier = Math.random() < OUTLIER_PROBABILITY;
        const noise = (Math.random() - 0.5) * (isOutlier ? OUTLIER_NOISE : NORMAL_NOISE) * yWithoutNoise;
        return { x, y: Math.max(0, Math.round(yWithoutNoise + noise)) };
    }).sort((a, b) => a.x - b.x);
}

// Inicialización del gráfico (deferida hasta que el DOM esté listo)
let chart;
let currentData = [];
function createChart() {
    const canvas = document.getElementById('gameChart');
    if (!canvas || typeof Chart === 'undefined') return null;
    return new Chart(canvas, {
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
            }, {
                label: 'Tu línea',
                data: [],
                type: 'line',
                borderColor: 'orange',
                borderDash: [5, 5],
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
                        // Chart.js v3+: font config nested
                        font: { size: 14 }
                    }
                }
            }
        }
    });
}

if (window.CustomTerminal) {
    window.CustomTerminal.write("ErrorComparison: Visualizador de Comparación de Errores L1 vs L2 inicializado.\n");
}

function gradientDescent(data, errorType) {
    let slope = 1.5;  // Valor inicial más centrado
    let intercept = 15; // Valor inicial más centrado
    const learningRate = errorType === 'L1' ? 0.0001 : 0.000001;
    const iterations = 100;

    if (window.CustomTerminal) {
        window.CustomTerminal.write(`ErrorComparison: Iniciando descenso de gradiente para ${errorType}. Tasa Aprendizaje: ${learningRate}, Iteraciones: ${iterations}\n`);
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
        window.CustomTerminal.write(`ErrorComparison: Descenso de gradiente ${errorType} finalizado. Pendiente=${slope.toFixed(2)}, Intercepto=${intercept.toFixed(2)}\n`);
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
    if (window.CustomTerminal) {
        window.CustomTerminal.write("ErrorComparison: Actualizando regresiones L1 y L2 con nuevos datos.\n");
    }
    // Guardar dataset actual para comparaciones aunque no exista el chart
    currentData = Array.isArray(newData) ? newData.slice() : [];
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
    const e1 = document.getElementById('errorL1');
    const e2 = document.getElementById('errorL2');
    if (e1) e1.textContent = errorL1Val;
    if (e2) e2.textContent = errorL2Val;

    if (window.CustomTerminal) {
        window.CustomTerminal.write(`ErrorComparison: Errores calculados: L1 MAE = ${errorL1Val}, L2 MSE = ${errorL2Val}\n`);
    }

    if (chart) {
        chart.data.datasets[0].data = newData;
        chart.data.datasets[1].data = l1Line;
        chart.data.datasets[2].data = l2Line;
        // Mantener vista de usuario si existía
        updateUserLinePreview();
        chart.update();
    }
}

function wireGenerateButtons() {
    const btnNormal = document.getElementById('generateNormal');
    const btnOut = document.getElementById('generateOutliers');
    if (btnNormal) btnNormal.addEventListener('click', () => {
        if (window.CustomTerminal) {
            window.CustomTerminal.write("ErrorComparison: Usuario solicitó generar datos normales.\n");
        }
        updateRegressions(generateNormalData());
    });
    if (btnOut) btnOut.addEventListener('click', () => {
        if (window.CustomTerminal) {
            window.CustomTerminal.write("ErrorComparison: Usuario solicitó generar datos con outliers.\n");
        }
        updateRegressions(generateOutlierData());
    });
}

// --- Comparación Usuario vs Óptimo (modal on demand) ---
function showCompareOverlay(show) {
    const overlay = document.getElementById('compareOverlay');
    if (!overlay) return;
    if (show) overlay.classList.remove('hidden'); else overlay.classList.add('hidden');
}

function compareUserVsOptimal() {
    const errorType = document.getElementById('errorType')?.value || 'L1';
    const slopeInput = document.getElementById('userSlopeInput');
    const interceptInput = document.getElementById('userInterceptInput');
    if (!slopeInput || !interceptInput) return;
    const userSlope = parseFloat(slopeInput.value);
    const userIntercept = parseFloat(interceptInput.value);
    if (!isFinite(userSlope) || !isFinite(userIntercept)) return;

    // Toma la serie de datos actual del gráfico
    let data = (chart && chart.data && chart.data.datasets && chart.data.datasets[0]) ? chart.data.datasets[0].data : currentData;
    if (!data || !data.length) {
        data = generateNormalData();
        updateRegressions(data);
    }

    showCompareOverlay(true);
    setTimeout(() => {
        // Recalcular óptimos para el conjunto actual y tipo de error seleccionado
        const opt = gradientDescent(data, errorType);
        const optErr = calculateErrors(data, opt.slope, opt.intercept);
        const usrErr = calculateErrors(data, userSlope, userIntercept);

        // Normalizar al promedio por punto
        const userErrorAvg = (errorType === 'L1' ? (usrErr.l1 / data.length) : (usrErr.l2 / data.length)).toFixed(2);
        const optErrorAvg = (errorType === 'L1' ? (optErr.l1 / data.length) : (optErr.l2 / data.length)).toFixed(2);

        // Volcar resultados en el modal
        const modal = document.getElementById('resultsModal');
        const closeBtn = modal?.querySelector('.close-button');
        if (modal) {
            modal.querySelector('#errorTypeLabel').textContent = `Error (${errorType})`;
            modal.querySelector('#userSlope').textContent = userSlope.toFixed(2);
            modal.querySelector('#userIntercept').textContent = userIntercept.toFixed(2);
            modal.querySelector('#userError').textContent = userErrorAvg;
            modal.querySelector('#optimalSlope').textContent = opt.slope.toFixed(2);
            modal.querySelector('#optimalIntercept').textContent = opt.intercept.toFixed(2);
            modal.querySelector('#optimalError').textContent = optErrorAvg;
            const resultText = modal.querySelector('#resultText');
            if (resultText) {
                const better = parseFloat(userErrorAvg) <= parseFloat(optErrorAvg);
                resultText.textContent = better ? 'Tu solución es comparable o mejor que la óptima estimada para este conjunto.' : 'La solución óptima estimada mejora tu resultado para este conjunto.';
            }
            // Abrir modal sólo en comparación
            modal.classList.remove('hidden');
            modal.classList.add('active');
            if (closeBtn) closeBtn.onclick = () => { modal.classList.remove('active'); modal.classList.add('hidden'); };
        }
        showCompareOverlay(false);
    }, 50);
}

function wireCompareButton() {
    debugLog('wireCompareButton called');
    const compareBtn = document.getElementById('compareButton');
    debugLog('Compare button found: ' + !!compareBtn);
    if (compareBtn) {
        compareBtn.addEventListener('click', () => {
            debugLog('Compare button clicked!');
            compareUserVsOptimal();
        });
        debugLog('Compare button event wired');
    }
}

// Cierre accesible del modal (Escape y clic fuera)
function wireModalClose() {
    const modal = document.getElementById('resultsModal');
    if (!modal) return;
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            modal.classList.add('hidden');
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            modal.classList.add('hidden');
        }
    });
}

// -------- Sliders & Vista previa de la línea del usuario --------
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

function updateUserLinePreview() {
    const slopeEl = document.getElementById('userSlopeInput');
    const interceptEl = document.getElementById('userInterceptInput');
    if (!slopeEl || !interceptEl) return;
    const m = parseFloat(slopeEl.value);
    const b = parseFloat(interceptEl.value);
    if (!isFinite(m) || !isFinite(b)) return;
    const data = (chart && chart.data && chart.data.datasets && chart.data.datasets[0]) ? chart.data.datasets[0].data : currentData;
    const line = (data && data.length)
        ? data.map(p => ({ x: p.x, y: m * p.x + b }))
        : [{ x: MIN_X, y: m * MIN_X + b }, { x: MAX_X, y: m * MAX_X + b }];
    if (chart && chart.data && chart.data.datasets[3]) {
        chart.data.datasets[3].data = line;
    }
}

function wireSliders() {
    debugLog('wireSliders called');
    const slopeRange = document.getElementById('userSlopeRange');
    const slopeInput = document.getElementById('userSlopeInput');
    const interceptRange = document.getElementById('userInterceptRange');
    const interceptInput = document.getElementById('userInterceptInput');
    debugLog('Slider elements found: ' + !!slopeRange + ' ' + !!slopeInput + ' ' + !!interceptRange + ' ' + !!interceptInput);

    if (!slopeRange || !slopeInput || !interceptRange || !interceptInput) {
        debugLog('Missing slider elements!');
        debugLog('Available elements with "user" in ID: ' +
            Array.from(document.querySelectorAll('[id*="user"]')).map(el => el.id).join(', '));
        return;
    }

    const syncSlopeFromRange = () => {
        debugLog('Slope range changed to: ' + slopeRange.value);
        slopeInput.value = parseFloat(slopeRange.value).toFixed(2);
        updateUserLinePreview();
        if (chart) chart.update('none');
    };
    const syncSlopeFromInput = () => {
        const v = clamp(parseFloat(slopeInput.value) || 0, 1.0, 3.0);
        debugLog('Slope input changed to: ' + v);
        slopeInput.value = v.toFixed(2);
        slopeRange.value = v.toString();
        updateUserLinePreview();
        if (chart) chart.update('none');
    };
    const syncInterceptFromRange = () => {
        debugLog('Intercept range changed to: ' + interceptRange.value);
        interceptInput.value = parseFloat(interceptRange.value).toFixed(1);
        updateUserLinePreview();
        if (chart) chart.update('none');
    };
    const syncInterceptFromInput = () => {
        const v = clamp(parseFloat(interceptInput.value) || 0, 0, 30);
        debugLog('Intercept input changed to: ' + v);
        interceptInput.value = v.toFixed(1);
        interceptRange.value = v.toString();
        updateUserLinePreview();
        if (chart) chart.update('none');
    };

    slopeRange.addEventListener('input', syncSlopeFromRange);
    slopeRange.addEventListener('change', syncSlopeFromRange);
    slopeInput.addEventListener('input', syncSlopeFromInput);
    slopeInput.addEventListener('change', syncSlopeFromInput);
    interceptRange.addEventListener('input', syncInterceptFromRange);
    interceptRange.addEventListener('change', syncInterceptFromRange);
    interceptInput.addEventListener('input', syncInterceptFromInput);
    interceptInput.addEventListener('change', syncInterceptFromInput);

    debugLog('All slider events wired');

    // Test if events work immediately
    debugLog('Testing slider functionality...');
    slopeRange.value = '2.00';
    syncSlopeFromRange();

    // Sincronizar estado inicial
    syncSlopeFromInput();
    syncInterceptFromInput();
    debugLog('Initial sync done');
}

// Inicialización segura tras cargar el DOM
function initErrorComparison() {
    debugLog('initErrorComparison called');
    debugLog('DOM elements check:');
    debugLog('- userSlopeRange: ' + !!document.getElementById('userSlopeRange'));
    debugLog('- userSlopeInput: ' + !!document.getElementById('userSlopeInput'));
    debugLog('- compareButton: ' + !!document.getElementById('compareButton'));
    debugLog('- gameChart: ' + !!document.getElementById('gameChart'));
    debugLog('- Chart available: ' + (typeof Chart !== 'undefined'));

    // Siempre cablear controles aunque el chart aún no esté
    wireGenerateButtons();
    wireCompareButton();
    wireSliders();
    wireModalClose();
    // Intentar crear chart ahora
    chart = createChart();
    debugLog('Chart created: ' + !!chart);
    // Generar datos iniciales y tabla
    updateRegressions(generateNormalData());
    updateUserLinePreview();
    if (chart) {
        chart.update('none');
    } else {
        // Reintentar cuando todo cargue (por si chart.js tarda)
        window.addEventListener('load', () => {
            if (!chart) chart = createChart();
            if (chart) {
                // Pegar datos actuales al chart
                if (currentData && currentData.length) {
                    updateRegressions(currentData);
                }
                updateUserLinePreview();
                chart.update('none');
            }
        }, { once: true });
    }
}

// Simple, reliable initialization that works like the debug test
function simpleInit() {
    debugLog('=== SIMPLE INIT STARTED ===');

    // Direct element access (like debug test)
    const slopeRange = document.getElementById('userSlopeRange');
    const slopeInput = document.getElementById('userSlopeInput');
    const interceptRange = document.getElementById('userInterceptRange');
    const interceptInput = document.getElementById('userInterceptInput');
    const compareBtn = document.getElementById('compareButton');
    const generateNormalBtn = document.getElementById('generateNormal');
    const generateOutliersBtn = document.getElementById('generateOutliers');

    debugLog('Elements found:');
    debugLog('- slopeRange: ' + !!slopeRange);
    debugLog('- slopeInput: ' + !!slopeInput);
    debugLog('- interceptRange: ' + !!interceptRange);
    debugLog('- interceptInput: ' + !!interceptInput);
    debugLog('- compareBtn: ' + !!compareBtn);
    debugLog('- Chart available: ' + (typeof Chart !== 'undefined'));

    if (!slopeRange || !slopeInput || !interceptRange || !interceptInput) {
        debugLog('ERROR: Missing essential elements');
        return false;
    }

    // Initialize chart if available
    if (typeof Chart !== 'undefined') {
        const canvas = document.getElementById('gameChart');
        if (canvas && !chart) {
            chart = createChart();
            debugLog('Chart initialized: ' + !!chart);
        }
    }

    // Simple slider handlers with chart updates
    const updatePreview = () => {
        if (chart) {
            updateUserLinePreview();
            chart.update('none');
        }
    };

    slopeRange.addEventListener('input', () => {
        debugLog('Slope slider moved to: ' + slopeRange.value);
        slopeInput.value = parseFloat(slopeRange.value).toFixed(2);
        updatePreview();
    });

    slopeInput.addEventListener('change', () => {
        debugLog('Slope input changed to: ' + slopeInput.value);
        const v = Math.max(1.0, Math.min(3.0, parseFloat(slopeInput.value) || 1.5));
        slopeInput.value = v.toFixed(2);
        slopeRange.value = v.toString();
        updatePreview();
    });

    interceptRange.addEventListener('input', () => {
        debugLog('Intercept slider moved to: ' + interceptRange.value);
        interceptInput.value = parseFloat(interceptRange.value).toFixed(1);
        updatePreview();
    });

    interceptInput.addEventListener('change', () => {
        debugLog('Intercept input changed to: ' + interceptInput.value);
        const v = Math.max(0, Math.min(30, parseFloat(interceptInput.value) || 15));
        interceptInput.value = v.toFixed(1);
        interceptRange.value = v.toString();
        updatePreview();
    });

    // Wire generate buttons
    if (generateNormalBtn) {
        generateNormalBtn.addEventListener('click', () => {
            debugLog('Generate normal data clicked');
            updateRegressions(generateNormalData());
        });
    }

    if (generateOutliersBtn) {
        generateOutliersBtn.addEventListener('click', () => {
            debugLog('Generate outliers data clicked');
            updateRegressions(generateOutlierData());
        });
    }

    // Full compare functionality
    if (compareBtn) {
        compareBtn.addEventListener('click', () => {
            debugLog('Compare button clicked! Running full comparison...');
            compareUserVsOptimal();
        });
    }

    // Wire modal close
    wireModalClose();

    // Initialize with data
    if (chart) {
        updateRegressions(generateNormalData());
        updatePreview();
    }

    debugLog('=== SIMPLE INIT COMPLETED SUCCESSFULLY ===');
    return true;
}// Try simple initialization first
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', simpleInit);
} else {
    simpleInit();
}

// Fallback after delay
setTimeout(() => {
    if (!simpleInit()) {
        debugLog('Retrying simple init after delay...');
        simpleInit();
    }
}, 1000);
