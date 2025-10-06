document.addEventListener('DOMContentLoaded', () => {
    // --- Constants ---
    const NUM_PATIENTS = 100;
    const MISS_RATE = 0.20; // 20% of patients will miss their appointment
    const COST_REMINDER = 5; // 5€ per reminder
    const COST_LOST_APPOINTMENT = 25; // 25€ per missed appointment

    // --- DOM Elements ---
    const patientContainer = document.getElementById('patient-container');
    const thresholdSlider = document.getElementById('threshold-slider');
    const thresholdValueEl = document.getElementById('threshold-value');
    const resetBtn = document.getElementById('reset-btn');
    const findOptimalBtn = document.getElementById('find-optimal-btn');
    const optimalGraphContainer = document.getElementById('optimal-graph-container');
    const costChartCanvas = document.getElementById('cost-chart');

    // Confusion Matrix Cells
    const vpEl = document.getElementById('vp');
    const fpEl = document.getElementById('fp');
    const vnEl = document.getElementById('vn');
    const fnEl = document.getElementById('fn');

    // Outcomes
    const citasPerdidasEl = document.getElementById('citas-perdidas');
    const costeRecordatoriosEl = document.getElementById('coste-recordatorios');
    const costeTotalEl = document.getElementById('coste-total');

    // --- State ---
    let patients = [];
    let costChart = null;

    /**
     * Generates simulation data for patients.
     */
    function generatePatientData() {
        patients = [];
        for (let i = 0; i < NUM_PATIENTS; i++) {
            const trueOutcome = Math.random() < MISS_RATE ? 1 : 0; // 1 = missed, 0 = attended

            // Simulate a "good" but not perfect model.
            // The predicted probability will be correlated with the true outcome.
            let predictedProb;
            if (trueOutcome === 1) {
                // If patient will miss, predict a higher probability (e.g., 0.4 to 1.0)
                predictedProb = 0.4 + Math.random() * 0.6;
            } else {
                // If patient will attend, predict a lower probability (e.g., 0.0 to 0.6)
                predictedProb = Math.random() * 0.6;
            }

            // Ensure probability is capped at 1.0 in case of floating point inaccuracies
            if (predictedProb > 1) predictedProb = 1;

            patients.push({ id: i, trueOutcome, predictedProb });
        }
    }

    /**
     * Renders the patient icons in the DOM.
     */
    function renderPatients() {
        patientContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();
        patients.forEach(patient => {
            const patientDiv = document.createElement('div');
            patientDiv.className = 'patient';
            patientDiv.dataset.patientId = patient.id;
            const probabilityPercent = Math.round(patient.predictedProb * 100);
            patientDiv.textContent = probabilityPercent;
            fragment.appendChild(patientDiv);
        });
        patientContainer.appendChild(fragment);
    }

    /**
     * Runs the simulation based on the current threshold.
     * @param {number} thresholdValue - The decision threshold (0-100).
     */
    function runSimulation(thresholdValue) {
        const threshold = thresholdValue / 100;

        // Initialize counters
        let vp = 0, fp = 0, vn = 0, fn = 0;

        patients.forEach(patient => {
            const patientDiv = patientContainer.querySelector(`[data-patient-id='${patient.id}']`);

            // 1 = predict miss, 0 = predict attend
            const prediction = patient.predictedProb > threshold ? 1 : 0;

            // Update patient icon color
            patientDiv.classList.remove('predicted-attend', 'predicted-miss');
            if (prediction === 1) {
                patientDiv.classList.add('predicted-miss');
            } else {
                patientDiv.classList.add('predicted-attend');
            }

            // Update confusion matrix counters
            if (prediction === 1 && patient.trueOutcome === 1) {
                vp++; // Verdadero Positivo: Predijimos que faltaría y acertamos.
            } else if (prediction === 1 && patient.trueOutcome === 0) {
                fp++; // Falso Positivo: Predijimos que faltaría, pero acudió. (Coste de recordatorio innecesario)
            } else if (prediction === 0 && patient.trueOutcome === 1) {
                fn++; // Falso Negativo: Predijimos que acudiría, pero faltó. (Coste de cita perdida)
            } else if (prediction === 0 && patient.trueOutcome === 0) {
                vn++; // Verdadero Negativo: Predijimos que acudiría y acertamos.
            }
        });

        // Update DOM with new values
        vpEl.textContent = vp;
        fpEl.textContent = fp;
        vnEl.textContent = vn;
        fnEl.textContent = fn;

        // Calculate and display outcomes
        const lostAppointmentsCount = fn;
        const reminderCost = (vp + fp) * COST_REMINDER;
        const lostAppointmentCost = lostAppointmentsCount * COST_LOST_APPOINTMENT;
        const totalCost = reminderCost + lostAppointmentCost;

        citasPerdidasEl.textContent = `${lostAppointmentsCount} (Coste: ${lostAppointmentCost}€)`;
        costeRecordatoriosEl.textContent = `${reminderCost}€ (${vp + fp} recordatorios)`;
        costeTotalEl.textContent = `${totalCost}€`;
    }

    /**
     * Calculates the total cost for a given threshold without updating the DOM.
     * @param {number} threshold - The decision threshold (0-1).
     * @returns {Object} An object with the total cost and its components.
     */
    function calculateCostForThreshold(threshold) {
        let vp = 0, fp = 0, fn = 0;
        patients.forEach(patient => {
            const prediction = patient.predictedProb > threshold ? 1 : 0;
            if (prediction === 1 && patient.trueOutcome === 1) {
                vp++;
            } else if (prediction === 1 && patient.trueOutcome === 0) {
                fp++;
            } else if (prediction === 0 && patient.trueOutcome === 1) {
                fn++;
            }
        });
        const reminderCost = (vp + fp) * COST_REMINDER;
        const lostAppointmentCost = fn * COST_LOST_APPOINTMENT;
        return {
            cost: reminderCost + lostAppointmentCost,
            fn: fn,
            reminders: vp + fp
        };
    }

    /**
     * Finds the optimal threshold and displays the cost graph.
     */
    function findAndShowOptimal() {
        const costDetails = [];
        for (let t = 0; t <= 100; t++) {
            const result = calculateCostForThreshold(t / 100);
            costDetails.push({
                threshold: t,
                cost: result.cost,
                fn: result.fn,
                reminders: result.reminders
            });
        }

        let optimalThreshold = 0;
        let minCost = Infinity;

        costDetails.forEach(item => {
            if (item.cost < minCost) {
                minCost = item.cost;
                optimalThreshold = item.threshold;
            }
        });

        // Update slider and run simulation for the optimal value
        thresholdSlider.value = optimalThreshold;
        thresholdValueEl.textContent = `${optimalThreshold}%`;
        runSimulation(optimalThreshold);

        // Show and render graph
        optimalGraphContainer.style.display = 'block';
        renderCostChart(costDetails, optimalThreshold, minCost);
    }

    /**
     * Renders the cost analysis chart.
     * @param {Array<Object>} costData - Array of {threshold, cost, fn, reminders} objects.
     * @param {number} [optimalThreshold] - The threshold with minimum cost.
     * @param {number} [minCost] - The minimum cost value.
     */
    function renderCostChart(costData, optimalThreshold, minCost) {
        if (costChart) {
            costChart.destroy();
        }
        const ctx = costChartCanvas.getContext('2d');
        const datasets = [
            {
                label: 'Coste Total (€)',
                data: costData.map(d => d.cost),
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                fill: true,
                tension: 0.2,
                pointRadius: 0,
                order: 1,
            }
        ];

        // Add a highlighted point for the optimal threshold
        if (typeof optimalThreshold === 'number' && typeof minCost === 'number') {
            datasets.push({
                label: 'Óptimo',
                data: costData.map((d, i) => (i === optimalThreshold ? minCost : null)),
                borderColor: 'transparent',
                backgroundColor: '#ff9800',
                pointBorderColor: '#ff9800',
                pointBackgroundColor: '#ff9800',
                pointRadius: 7,
                type: 'line',
                fill: false,
                showLine: false,
                order: 2,
            });
        }

        costChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: costData.map(d => d.threshold),
                datasets: datasets
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: { title: { display: true, text: 'Umbral de Decisión (%)' } },
                    y: { title: { display: true, text: 'Coste Total (€)' } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: function (tooltipItems) {
                                const threshold = tooltipItems[0].label;
                                return `Umbral: ${threshold}%`;
                            },
                            label: function (tooltipItem) {
                                const cost = tooltipItem.raw;
                                if (cost == null) return null;
                                return `Coste Total: ${cost.toFixed(0)}€`;
                            },
                            afterBody: function (tooltipItems) {
                                // Find the index for the main dataset (not the optimal point)
                                let index = tooltipItems[0].dataIndex;
                                const dataPoint = costData[index];
                                if (!dataPoint) return [];
                                return [
                                    ``, // Empty line for spacing
                                    `Citas Perdidas: ${dataPoint.fn}`,
                                    `Recordatorios Enviados: ${dataPoint.reminders}`
                                ];
                            }
                        }
                    },
                    annotation: false
                }
            }
        });
    }

    /**
     * Handles slider input changes.
     */
    function handleSliderChange(event) {
        const thresholdValue = event.target.value;
        thresholdValueEl.textContent = `${thresholdValue}%`;
        runSimulation(thresholdValue);
    }

    /**
     * Resets the simulation with a new set of patients.
     */
    function resetSimulation() {
        generatePatientData();
        renderPatients();
        runSimulation(thresholdSlider.value);

        // Hide graph and destroy chart instance
        optimalGraphContainer.style.display = 'none';
        if (costChart) {
            costChart.destroy();
            costChart = null;
        }
    }

    /**
     * Initializes the application.
     */
    function init() {
        thresholdSlider.addEventListener('input', handleSliderChange);
        resetBtn.addEventListener('click', resetSimulation);
        findOptimalBtn.addEventListener('click', findAndShowOptimal);
        resetSimulation(); // Initial run
    }

    // --- Run ---
    init();
});