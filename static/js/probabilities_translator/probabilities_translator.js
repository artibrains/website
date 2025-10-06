document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const canvas = document.getElementById('classification-chart');
    const linearOutput = document.getElementById('linear-output');
    const logisticOutput = document.getElementById('logistic-output');
    const regenerateBtn = document.getElementById('regenerate-btn');

    // --- State ---
    let chart;
    let rawData = [];
    // Parámetros del modelo: z = b0 + b1*x + b2*y
    let modelParams = { b0: 0, b1: 0, b2: 0 };

    // --- Constants ---
    const CLASS_0_COLOR = '#007bff'; // Acudió a la cita
    const CLASS_1_COLOR = '#dc3545'; // No acudió a la cita
    const BOUNDARY_LINE_COLOR = 'rgba(40, 167, 69, 0.8)';
    const PREDICTION_MARKER_COLOR = '#000000'//'#343a40';

    // --- Helper Functions ---
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function interpolateColor(color1, color2, factor) {
        let result = { ...color1 };
        for (const key in result) {
            result[key] = Math.round(result[key] + factor * (color2[key] - result[key]));
        }
        return `rgb(${result.r}, ${result.g}, ${result.b})`;
    }

    // --- Chart.js Plugin for Background ---
    const backgroundPlugin = {
        id: 'background-gradient',
        beforeDraw: (chart) => {
            const { ctx, chartArea: { top, bottom, left, right }, scales: { x, y } } = chart;
            if (!modelParams.b1) return; // Don't draw if model is not ready

            const step = 10; // Draw in 10x10 pixel squares for performance
            const color1Rgb = hexToRgb(CLASS_0_COLOR);
            const color2Rgb = hexToRgb(CLASS_1_COLOR);

            for (let px = left; px < right; px += step) {
                for (let py = top; py < bottom; py += step) {
                    const daysSinceLast = x.getValueForPixel(px);
                    const age = y.getValueForPixel(py);

                    const z = modelParams.b0 + modelParams.b1 * daysSinceLast + modelParams.b2 * age;
                    const probability = 1 / (1 + Math.exp(-z));

                    ctx.fillStyle = interpolateColor(color1Rgb, color2Rgb, probability);
                    ctx.fillRect(px, py, step, step);
                }
            }
        }
    };


    // --- Functions ---

    /**
     * Genera datos 2D para predicción de asistencia a cita (días desde última visita vs edad).
     */
    function generateData(numPoints = 100) {
        rawData = [];
        const half = Math.floor(numPoints / 2);
        // Clase 0 (Acudió): Pacientes mayores, menos tiempo desde la última visita.
        for (let i = 0; i < half; i++) {
            const daysSinceLast = 10 + Math.random() * 90;  // 10-100 días
            const age = 40 + Math.random() * 40;           // 40-80 años
            rawData.push({ x: daysSinceLast, y: age, outcome: 0 });
        }
        // Clase 1 (No acudió): Pacientes más jóvenes, más tiempo desde la última visita.
        for (let i = 0; i < half; i++) {
            const daysSinceLast = 80 + Math.random() * 120; // 80-200 días
            const age = 18 + Math.random() * 32;           // 18-50 años
            rawData.push({ x: daysSinceLast, y: age, outcome: 1 });
        }
    }

    /**
     * Calcula una línea de decisión creíble entre los dos grupos de datos.
     */
    function calculateDecisionBoundary(data) {
        const class0 = data.filter(p => p.outcome === 0);
        const class1 = data.filter(p => p.outcome === 1);
        if (class0.length === 0 || class1.length === 0) return { b0: 0, b1: 1, b2: 1 };

        const centroid0 = {
            x: class0.reduce((sum, p) => sum + p.x, 0) / class0.length,
            y: class0.reduce((sum, p) => sum + p.y, 0) / class0.length
        };
        const centroid1 = {
            x: class1.reduce((sum, p) => sum + p.x, 0) / class1.length,
            y: class1.reduce((sum, p) => sum + p.y, 0) / class1.length
        };

        const midPoint = { x: (centroid0.x + centroid1.x) / 2, y: (centroid0.y + centroid1.y) / 2 };

        // El vector entre centroides nos da la dirección del gradiente
        const b1_orig = centroid1.x - centroid0.x;
        const b2_orig = centroid1.y - centroid0.y;

        // Escalar los parámetros para que la función sigmoide no sea demasiado "abrupta".
        // Queremos que el valor 'z' tenga un rango razonable en el área de los datos.
        const magnitude_sq = b1_orig * b1_orig + b2_orig * b2_orig;
        if (magnitude_sq === 0) return { b0: 0, b1: 1, b2: 1 }; // Evitar división por cero

        // El factor '5' controla la "nitidez". Un valor más grande hace la transición más abrupta.
        // Lo ajustamos para que z vaya de -2.5 a +2.5 entre los centroides de los datos.
        const k = 5 / magnitude_sq;
        const b1 = b1_orig * k;
        const b2 = b2_orig * k;

        // b0 se calcula para que la línea de decisión z=0 pase por el punto medio
        const b0 = -(b1 * midPoint.x + b2 * midPoint.y);

        return { b0, b1, b2 };
    }

    /**
     * Genera los puntos para la línea de frontera de decisión (donde z=0).
     */
    function getDecisionBoundaryLine() {
        const { b0, b1, b2 } = modelParams;
        if (b2 === 0) return []; // Evitar división por cero

        const xMin = chart.options.scales.x.min;
        const xMax = chart.options.scales.x.max;

        // Ecuación de la línea: z = b0 + b1*x + b2*y = 0  =>  y = (-b0 - b1*x) / b2
        const yAtXMin = (-b0 - b1 * xMin) / b2;
        const yAtXMax = (-b0 - b1 * xMax) / b2;

        return [{ x: xMin, y: yAtXMin }, { x: xMax, y: yAtXMax }];
    }

    /**
     * Gestiona los clics en el gráfico para realizar una predicción.
     */
    function handleChartClick(event) {
        const daysSinceLast = chart.scales.x.getValueForPixel(event.x);
        const age = chart.scales.y.getValueForPixel(event.y);

        const { b0, b1, b2 } = modelParams;
        const z = b0 + b1 * daysSinceLast + b2 * age;
        const probability = 1 / (1 + Math.exp(-z));

        linearOutput.textContent = z.toFixed(2);
        logisticOutput.textContent = `${(probability * 100).toFixed(1)}%`;

        chart.data.datasets[3].data = [{ x: daysSinceLast, y: age }];
        chart.update('none');
    }

    /**
     * Regenera los datos y redibuja todo el gráfico.
     */
    function regenerateAndRedraw() {
        generateData();
        modelParams = calculateDecisionBoundary(rawData);

        linearOutput.textContent = 'N/A';
        logisticOutput.textContent = 'N/A';

        chart.data.datasets[0].data = rawData.filter(p => p.outcome === 0);
        chart.data.datasets[1].data = rawData.filter(p => p.outcome === 1);
        chart.data.datasets[2].data = getDecisionBoundaryLine();
        chart.data.datasets[3].data = [];

        chart.update();
    }

    /**
     * Inicializa la aplicación.
     */
    function init() {
        const ctx = canvas.getContext('2d');
        chart = new Chart(ctx, {
            type: 'scatter',
            plugins: [backgroundPlugin], // Register the custom plugin
            data: {
                datasets: [
                    { label: 'Acudió a la Cita', data: [], backgroundColor: CLASS_0_COLOR, borderColor: 'white', borderWidth: 1 },
                    { label: 'No Acudió a la Cita', data: [], backgroundColor: CLASS_1_COLOR, borderColor: 'white', borderWidth: 1 },
                    { label: 'Frontera de Decisión', data: [], type: 'line', borderColor: BOUNDARY_LINE_COLOR, borderWidth: 3, fill: false, pointRadius: 0 },
                    { label: 'Nuevo Paciente', data: [], backgroundColor: PREDICTION_MARKER_COLOR, pointStyle: 'crossRot', radius: 10, borderWidth: 3 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'Días desde la última cita' }, min: 0, max: 220 },
                    y: { title: { display: true, text: 'Edad del Paciente' }, min: 15, max: 80 }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                onClick: handleChartClick
            }
        });

        regenerateAndRedraw();
        regenerateBtn.addEventListener('click', regenerateAndRedraw);
    }

    // --- Run ---
    init();
});