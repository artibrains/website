document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired, initializing K-Means...');

    // --- 1. CONFIGURACIÓN INICIAL Y REFERENCIAS AL DOM ---

    // Referencias a los elementos del DOM
    const kSlider = document.getElementById('k-slider');
    const kValueSpan = document.getElementById('k-value');
    const clusterBtn = document.getElementById('cluster-btn');
    const elbowBtn = document.getElementById('elbow-btn');
    const resetBtn = document.getElementById('reset-btn');
    const statusMessage = document.getElementById('status-message');
    const startStepBtn = document.getElementById('start-step-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const elbowStatusMessage = document.getElementById('elbow-status-message');
    const kmeansPlusPlusCheckbox = document.getElementById('kmeans-plus-plus-checkbox');
    const infoIcon = document.getElementById('info-icon');

    // Referencias a los Canvas y sus contextos 2D
    const kmeansCanvas = document.getElementById('kmeans-canvas');
    const kmeansCtx = kmeansCanvas.getContext('2d');
    const elbowCanvas = document.getElementById('elbow-canvas');
    const elbowCtx = elbowCanvas.getContext('2d');

    // Verificar que todos los elementos críticos existen
    if (!kmeansCanvas || !statusMessage) {
        console.error('Critical DOM elements not found:', { kmeansCanvas, statusMessage });
        return;
    }

    console.log('All critical DOM elements found, proceeding with initialization...');

    // --- CORRECCIÓN: Leer las variables de CSS para usarlas en JavaScript ---
    const computedStyles = getComputedStyle(document.body);
    const PRIMARY_COLOR_JS = computedStyles.getPropertyValue('--primary-color').trim();
    const ACCENT_COLOR_JS = computedStyles.getPropertyValue('--accent-color').trim();

    // Constantes de configuración
    const KMEANS_WIDTH = kmeansCanvas.width;
    const KMEANS_HEIGHT = kmeansCanvas.height;
    const ELBOW_WIDTH = elbowCanvas.width;
    const ELBOW_HEIGHT = elbowCanvas.height;
    const MAX_K_ELBOW = 10;
    const POINT_RADIUS = 5;
    const CENTROID_SIZE = 12;

    // Variables de estado de la aplicación
    let dataPoints = [];
    let centroids = [];
    let animationFrameId = null;
    let kmeansState = null; // Para la ejecución paso a paso

    // Paleta de colores para los clusters. Son visualmente distintos.
    const CLUSTER_COLORS = [
        '#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00',
        '#ffff33', '#a65628', '#f781bf', '#999999', '#e6ab02'
    ];

    // --- 2. FUNCIONES DE DIBUJO EN CANVAS ---

    function clearCanvas(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawPoint(point, color = '#333') {
        kmeansCtx.beginPath();
        kmeansCtx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
        kmeansCtx.fillStyle = color;
        kmeansCtx.fill();
        kmeansCtx.closePath();
    }

    function drawCentroid(centroid, color) {
        kmeansCtx.beginPath();
        kmeansCtx.lineWidth = 4;
        kmeansCtx.strokeStyle = color;
        kmeansCtx.moveTo(centroid.x - CENTROID_SIZE / 2, centroid.y - CENTROID_SIZE / 2);
        kmeansCtx.lineTo(centroid.x + CENTROID_SIZE / 2, centroid.y + CENTROID_SIZE / 2);
        kmeansCtx.moveTo(centroid.x + CENTROID_SIZE / 2, centroid.y - CENTROID_SIZE / 2);
        kmeansCtx.lineTo(centroid.x - CENTROID_SIZE / 2, centroid.y + CENTROID_SIZE / 2);
        kmeansCtx.stroke();
        kmeansCtx.closePath();
    }

    // --- 3. LÓGICA DE DATOS Y ALGORITMOS ---

    function generateDataPoints() {
        if (window.CustomTerminal) {
            window.CustomTerminal.write("KMeans: Generando nuevos puntos de datos aleatorios.\n");
        }
        const points = [];
        const numTrueClusters = Math.floor(Math.random() * 3) + 3;
        const pointsPerCluster = 50;
        const spread = KMEANS_WIDTH / (numTrueClusters * 2);

        for (let i = 0; i < numTrueClusters; i++) {
            const clusterCenterX = Math.random() * (KMEANS_WIDTH - 2 * spread) + spread;
            const clusterCenterY = Math.random() * (KMEANS_HEIGHT - 2 * spread) + spread;

            for (let j = 0; j < pointsPerCluster; j++) {
                const offsetX = (Math.random() - 0.5 + Math.random() - 0.5) * spread;
                const offsetY = (Math.random() - 0.5 + Math.random() - 0.5) * spread;
                points.push({ x: clusterCenterX + offsetX, y: clusterCenterY + offsetY });
            }
        }
        return points;
    }

    function getDistanceSq(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return dx * dx + dy * dy;
    }

    function initializeCentroidsKMeansPlusPlus(k) {
        const newCentroids = [];
        if (dataPoints.length === 0) return newCentroids;

        // 1. Choose one center uniformly at random from among the data points.
        let firstCentroidIndex = Math.floor(Math.random() * dataPoints.length);
        newCentroids.push(dataPoints[firstCentroidIndex]);

        // Array to store squared distances
        const distSqArray = new Array(dataPoints.length).fill(Infinity);

        // 2. Repeat k-1 times
        for (let i = 1; i < k; i++) {
            let totalSumOfDistSq = 0;

            // For each data point, find the squared distance to the nearest centroid
            dataPoints.forEach((point, pointIndex) => {
                let minDistanceSq = Infinity;
                newCentroids.forEach(centroid => {
                    const distSq = getDistanceSq(point, centroid);
                    if (distSq < minDistanceSq) {
                        minDistanceSq = distSq;
                    }
                });
                distSqArray[pointIndex] = minDistanceSq;
                totalSumOfDistSq += minDistanceSq;
            });

            // 3. Choose the next centroid with probability proportional to D(x)^2
            const randomValue = Math.random() * totalSumOfDistSq;
            let cumulativeSum = 0;
            let nextCentroidIndex = -1;

            for (let j = 0; j < dataPoints.length; j++) {
                cumulativeSum += distSqArray[j];
                if (cumulativeSum >= randomValue) {
                    nextCentroidIndex = j;
                    break;
                }
            }

            // Fallback in case of floating point issues or if the last point is chosen
            if (nextCentroidIndex === -1) {
                nextCentroidIndex = dataPoints.length - 1;
            }

            newCentroids.push(dataPoints[nextCentroidIndex]);
        }

        return newCentroids;
    }

    // --- 4. FUNCIONALIDAD PRINCIPAL: K-MEANS y MÉTODO DEL CODO ---

    function initialize() {
        console.log('initialize() function called');

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        // Detener y limpiar el estado de k-means paso a paso
        if (kmeansState && kmeansState.timerId) {
            clearInterval(kmeansState.timerId);
        }
        kmeansState = null;

        toggleMainButtons(true);
        nextStepBtn.disabled = true;
        playPauseBtn.disabled = true;
        playPauseBtn.textContent = 'Reproducir';

        // Generar datos siempre, tanto en inicialización como en reset
        console.log('Generating data points...');
        dataPoints = generateDataPoints();
        console.log('Generated', dataPoints.length, 'data points');

        kmeansCanvas.style.display = 'block';
        elbowCanvas.style.display = 'none';
        statusMessage.textContent = 'Datos generados. Elige un valor de K para comenzar.';
        elbowStatusMessage.textContent = '';

        clearCanvas(kmeansCtx, kmeansCanvas);
        dataPoints.forEach(point => drawPoint(point, '#888'));
        console.log('Canvas cleared and points drawn');

        if (window.CustomTerminal) {
            window.CustomTerminal.write("KMeans: Aplicación inicializada con nuevos datos.\n");
        }
    }

    async function startKMeansAnimation() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        toggleMainButtons(false);
        statusMessage.textContent = 'Agrupando...';
        const K = parseInt(kSlider.value, 10);
        if (window.CustomTerminal) {
            window.CustomTerminal.write(`KMeans: Iniciando animación de K-Means con K=${K}.\n`);
        }

        // Inicializar centroides aleatoriamente o con K-Means++
        if (kmeansPlusPlusCheckbox.checked) {
            centroids = initializeCentroidsKMeansPlusPlus(K);
        } else {
            centroids = [];
            for (let i = 0; i < K; i++) {
                centroids.push({
                    x: Math.random() * KMEANS_WIDTH,
                    y: Math.random() * KMEANS_HEIGHT
                });
            }
        }

        let iterations = 0;
        const maxIterations = 100;
        let centroidsMoved = true;

        while (centroidsMoved && iterations < maxIterations) {
            iterations++;
            centroidsMoved = false;

            // 1. Asignar puntos a los centroides más cercanos
            dataPoints.forEach(point => {
                let minDistanceSq = Infinity;
                let closestCentroidIndex = 0;
                centroids.forEach((centroid, index) => {
                    const distSq = getDistanceSq(point, centroid);
                    if (distSq < minDistanceSq) {
                        minDistanceSq = distSq;
                        closestCentroidIndex = index;
                    }
                });
                point.cluster = closestCentroidIndex;
            });

            // 2. Recalcular centroides
            const newCentroids = [];
            for (let i = 0; i < K; i++) {
                const clusterPoints = dataPoints.filter(p => p.cluster === i);
                if (clusterPoints.length > 0) {
                    const sum = clusterPoints.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
                    const newCentroid = { x: sum.x / clusterPoints.length, y: sum.y / clusterPoints.length };

                    if (getDistanceSq(newCentroid, centroids[i]) > 0.1) {
                        centroidsMoved = true;
                    }
                    newCentroids.push(newCentroid);
                } else {
                    // Re-inicializar centroide si el cluster está vacío
                    newCentroids.push({ x: Math.random() * KMEANS_WIDTH, y: Math.random() * KMEANS_HEIGHT });
                    centroidsMoved = true;
                }
            }
            centroids = newCentroids;

            // 3. Dibujar el estado actual
            clearCanvas(kmeansCtx, kmeansCanvas);
            dataPoints.forEach(point => drawPoint(point, CLUSTER_COLORS[point.cluster]));
            centroids.forEach((centroid, i) => drawCentroid(centroid, CLUSTER_COLORS[i]));

            // 4. Esperar para visualizar el paso
            statusMessage.textContent = `Agrupando... Iteración ${iterations}`;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        statusMessage.textContent = `¡Convergencia alcanzada en ${iterations} iteraciones!`;
        toggleMainButtons(true);
        if (window.CustomTerminal) {
            window.CustomTerminal.write(`KMeans: Animación de K-Means finalizada en ${iterations} iteraciones.\n`);
        }
    }

    function runKMeansSync(k) {
        let localCentroids = [];
        for (let i = 0; i < k; i++) {
            localCentroids.push({ x: Math.random() * KMEANS_WIDTH, y: Math.random() * KMEANS_HEIGHT });
        }

        const localDataPoints = JSON.parse(JSON.stringify(dataPoints));
        let iterations = 0, moved = true;

        while (moved && iterations < 100) {
            moved = false;
            iterations++;

            localDataPoints.forEach(point => {
                let minDistSq = Infinity;
                localCentroids.forEach((centroid, index) => {
                    const distSq = getDistanceSq(point, centroid);
                    if (distSq < minDistSq) {
                        minDistSq = distSq;
                        point.cluster = index;
                    }
                });
            });

            const newCentroids = [];
            for (let i = 0; i < k; i++) {
                const clusterPoints = localDataPoints.filter(p => p.cluster === i);
                if (clusterPoints.length > 0) {
                    const sum = clusterPoints.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
                    const newCentroid = { x: sum.x / clusterPoints.length, y: sum.y / clusterPoints.length };
                    if (getDistanceSq(newCentroid, localCentroids[i]) > 0.1) moved = true;
                    newCentroids.push(newCentroid);
                } else {
                    newCentroids.push({ x: Math.random() * KMEANS_WIDTH, y: Math.random() * KMEANS_HEIGHT });
                    moved = true;
                }
            }
            localCentroids = newCentroids;
        }

        let sse = 0;
        localDataPoints.forEach(point => {
            const centroid = localCentroids[point.cluster];
            if (centroid) {
                sse += getDistanceSq(point, centroid);
            }
        });

        return { sse, centroids: localCentroids };
    }

    function calculateAndDrawElbow() {
        toggleMainButtons(false);
        elbowCanvas.style.display = 'block';
        elbowStatusMessage.textContent = 'Calculando inercias para K de 1 a 10...';
        if (window.CustomTerminal) {
            window.CustomTerminal.write("KMeans: Iniciando cálculo del método del codo.\n");
        }

        setTimeout(() => {
            const inertias = [];
            for (let k = 1; k <= MAX_K_ELBOW; k++) {
                const result = runKMeansSync(k);
                inertias.push(result.sse);
            }

            drawElbowPlot(inertias);
            const elbowK = findElbowPoint(inertias) + 1;
            if (elbowK > 0) {
                elbowStatusMessage.textContent = `Gráfico generado. K óptimo encontrado: ${elbowK}. El slider ha sido actualizado.`;
            } else {
                elbowStatusMessage.textContent = 'Gráfico del Método del Codo generado.';
            }
            toggleMainButtons(true);
            if (window.CustomTerminal) {
                window.CustomTerminal.write(`KMeans: Método del codo finalizado. K óptimo sugerido: ${elbowK}.\n`);
            }
        }, 50);
    }

    function drawElbowPlot(inertias) {
        clearCanvas(elbowCtx, elbowCanvas);

        const padding = 50;
        const chartWidth = ELBOW_WIDTH - 2 * padding;
        const chartHeight = ELBOW_HEIGHT - 2 * padding;
        const maxInertia = Math.max(...inertias);

        elbowCtx.beginPath();
        elbowCtx.moveTo(padding, padding);
        elbowCtx.lineTo(padding, ELBOW_HEIGHT - padding);
        elbowCtx.lineTo(ELBOW_WIDTH - padding, ELBOW_HEIGHT - padding);
        elbowCtx.strokeStyle = '#333';
        elbowCtx.stroke();

        elbowCtx.fillStyle = '#333';
        elbowCtx.textAlign = 'center';
        elbowCtx.fillText("Número de Clusters (K)", ELBOW_WIDTH / 2, ELBOW_HEIGHT - 15);
        elbowCtx.save();
        elbowCtx.translate(15, ELBOW_HEIGHT / 2);
        elbowCtx.rotate(-Math.PI / 2);
        elbowCtx.fillText("Inercia (SSE)", 0, 0);
        elbowCtx.restore();

        elbowCtx.beginPath();
        inertias.forEach((inertia, i) => {
            const k = i + 1;
            const x = padding + (i / (MAX_K_ELBOW - 1)) * chartWidth;
            const y = padding + (1 - inertia / maxInertia) * chartHeight;

            if (i === 0) {
                elbowCtx.moveTo(x, y);
            } else {
                elbowCtx.lineTo(x, y);
            }

            if (k % 2 === 0 || k === 1 || k === MAX_K_ELBOW) {
                elbowCtx.fillText(k, x, ELBOW_HEIGHT - padding + 20);
            }
        });
        // --- CORRECCIÓN: Usar la constante de JS en lugar de la sintaxis de CSS ---
        elbowCtx.strokeStyle = PRIMARY_COLOR_JS;
        elbowCtx.lineWidth = 2;
        elbowCtx.stroke();

        inertias.forEach((inertia, i) => {
            const k = i + 1;
            const x = padding + (i / (MAX_K_ELBOW - 1)) * chartWidth;
            const y = padding + (1 - inertia / maxInertia) * chartHeight;
            elbowCtx.beginPath();
            elbowCtx.arc(x, y, 4, 0, 2 * Math.PI);
            // --- CORRECCIÓN ---
            elbowCtx.fillStyle = PRIMARY_COLOR_JS;
            elbowCtx.fill();
        });

        const elbowPointIndex = findElbowPoint(inertias);
        if (elbowPointIndex !== -1) {
            const k = elbowPointIndex + 1;
            const x = padding + (elbowPointIndex / (MAX_K_ELBOW - 1)) * chartWidth;
            const y = padding + (1 - inertias[elbowPointIndex] / maxInertia) * chartHeight;

            elbowCtx.beginPath();
            elbowCtx.arc(x, y, 8, 0, 2 * Math.PI);
            // --- CORRECCIÓN ---
            elbowCtx.fillStyle = ACCENT_COLOR_JS;
            elbowCtx.fill();

            elbowCtx.fillStyle = ACCENT_COLOR_JS;
            elbowCtx.font = 'bold 12px Inter';
            elbowCtx.fillText(`K Óptimo ≈ ${k}`, x, y - 15);

            // Actualizar el slider
            kSlider.value = k;
            kValueSpan.textContent = k;
        }
    }

    function findElbowPoint(inertias) {
        const points = inertias.map((inertia, i) => ({ x: i, y: inertia }));
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];

        let maxDistance = -1;
        let elbowIndex = -1;

        for (let i = 1; i < points.length - 1; i++) {
            const currentPoint = points[i];
            const distance = Math.abs(
                (lastPoint.y - firstPoint.y) * currentPoint.x -
                (lastPoint.x - firstPoint.x) * currentPoint.y +
                lastPoint.x * firstPoint.y -
                lastPoint.y * firstPoint.x
            ) / Math.sqrt(
                Math.pow(lastPoint.y - firstPoint.y, 2) +
                Math.pow(lastPoint.x - firstPoint.x, 2)
            );

            if (distance > maxDistance) {
                maxDistance = distance;
                elbowIndex = i;
            }
        }
        return elbowIndex;
    }

    // --- 5. GESTIÓN DE EVENTOS Y UTILIDADES ---

    function toggleMainButtons(enabled) {
        clusterBtn.disabled = !enabled;
        elbowBtn.disabled = !enabled;
        resetBtn.disabled = !enabled;
        startStepBtn.disabled = !enabled;
        kSlider.disabled = !enabled;
        kmeansPlusPlusCheckbox.disabled = !enabled;
    }

    // --- NUEVAS FUNCIONES PARA PASO A PASO ---

    function initializeKMeansStepByStep() {
        const K = parseInt(kSlider.value, 10);
        let initialCentroids;

        if (window.CustomTerminal) {
            window.CustomTerminal.write(`KMeans: Inicializando K-Means paso a paso con K=${K}.\n`);
        }

        if (kmeansPlusPlusCheckbox.checked) {
            initialCentroids = initializeCentroidsKMeansPlusPlus(K);
        } else {
            initialCentroids = [];
            for (let i = 0; i < K; i++) {
                initialCentroids.push({
                    x: Math.random() * KMEANS_WIDTH,
                    y: Math.random() * KMEANS_HEIGHT
                });
            }
        }

        kmeansState = {
            k: K,
            centroids: initialCentroids,
            iterations: 0,
            maxIterations: 100,
            isFinished: false,
            isRunning: false,
            timerId: null,
        };

        // Limpiar clusters previos
        dataPoints.forEach(p => delete p.cluster);

        clearCanvas(kmeansCtx, kmeansCanvas);
        dataPoints.forEach(point => drawPoint(point, '#888'));
        kmeansState.centroids.forEach((centroid, i) => drawCentroid(centroid, CLUSTER_COLORS[i]));

        statusMessage.textContent = `Listo para iniciar K-Means con K=${K}. Presiona "Siguiente Paso".`;

        toggleMainButtons(false);
        resetBtn.disabled = false; // Permitir reiniciar en cualquier momento
        nextStepBtn.disabled = false;
        playPauseBtn.disabled = false;
    }

    function runKMeansStep() {
        if (!kmeansState || kmeansState.isFinished) return;

        kmeansState.iterations++;
        let centroidsMoved = false;

        if (window.CustomTerminal && !kmeansState.isRunning) {
            window.CustomTerminal.write(`KMeans: Ejecutando paso ${kmeansState.iterations} de K-Means.\n`);
        }

        // 1. Asignar puntos
        dataPoints.forEach(point => {
            let minDistanceSq = Infinity;
            let closestCentroidIndex = 0;
            kmeansState.centroids.forEach((centroid, index) => {
                const distSq = getDistanceSq(point, centroid);
                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    closestCentroidIndex = index;
                }
            });
            point.cluster = closestCentroidIndex;
        });

        // 2. Recalcular centroides
        const newCentroids = [];
        for (let i = 0; i < kmeansState.k; i++) {
            const clusterPoints = dataPoints.filter(p => p.cluster === i);
            if (clusterPoints.length > 0) {
                const sum = clusterPoints.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
                const newCentroid = { x: sum.x / clusterPoints.length, y: sum.y / clusterPoints.length };
                if (getDistanceSq(newCentroid, kmeansState.centroids[i]) > 0.1) {
                    centroidsMoved = true;
                }
                newCentroids.push(newCentroid);
            } else {
                newCentroids.push({ x: Math.random() * KMEANS_WIDTH, y: Math.random() * KMEANS_HEIGHT });
                centroidsMoved = true;
            }
        }
        kmeansState.centroids = newCentroids;

        // 3. Dibujar
        clearCanvas(kmeansCtx, kmeansCanvas);
        dataPoints.forEach(point => drawPoint(point, CLUSTER_COLORS[point.cluster]));
        kmeansState.centroids.forEach((centroid, i) => drawCentroid(centroid, CLUSTER_COLORS[i]));

        statusMessage.textContent = `Iteración ${kmeansState.iterations} completada.`;

        // 4. Comprobar finalización
        if (!centroidsMoved || kmeansState.iterations >= kmeansState.maxIterations) {
            kmeansState.isFinished = true;
            statusMessage.textContent = `¡Convergencia alcanzada en ${kmeansState.iterations} iteraciones!`;
            if (kmeansState.isRunning) {
                togglePlayPause(); // Detener la reproducción
            }
            nextStepBtn.disabled = true;
            playPauseBtn.disabled = true;
            if (window.CustomTerminal) {
                window.CustomTerminal.write(`KMeans: K-Means paso a paso finalizado en ${kmeansState.iterations} iteraciones.\n`);
            }
        }
    }

    function togglePlayPause() {
        if (!kmeansState || kmeansState.isFinished) return;

        kmeansState.isRunning = !kmeansState.isRunning;
        if (kmeansState.isRunning) {
            playPauseBtn.textContent = 'Pausar';
            nextStepBtn.disabled = true;
            if (window.CustomTerminal) {
                window.CustomTerminal.write("KMeans: Reproducción automática iniciada.\n");
            }
            // Ejecutar el primer paso inmediatamente, luego establecer el intervalo
            runKMeansStep();
            if (!kmeansState.isFinished) {
                kmeansState.timerId = setInterval(runKMeansStep, 1000);
            }
        } else {
            playPauseBtn.textContent = 'Reproducir';
            nextStepBtn.disabled = false;
            clearInterval(kmeansState.timerId);
            kmeansState.timerId = null;
            if (window.CustomTerminal) {
                window.CustomTerminal.write("KMeans: Reproducción automática pausada.\n");
            }
        }
    }

    kSlider.addEventListener('input', (e) => {
        kValueSpan.textContent = e.target.value;
    });

    clusterBtn.addEventListener('click', startKMeansAnimation);
    resetBtn.addEventListener('click', initialize);
    elbowBtn.addEventListener('click', calculateAndDrawElbow);

    // --- NUEVOS EVENT LISTENERS ---
    startStepBtn.addEventListener('click', initializeKMeansStepByStep);
    nextStepBtn.addEventListener('click', runKMeansStep);
    playPauseBtn.addEventListener('click', togglePlayPause);

    // --- INICIO DE LA APLICACIÓN ---
    console.log('About to call initialize()...');
    initialize();
    console.log('initialize() call completed');
});
