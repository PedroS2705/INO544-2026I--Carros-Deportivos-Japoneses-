// static/js/camara.js

const btnCamaraLive = document.getElementById('btn-camara-en-vivo');
const btnStopCamera = document.getElementById('camera-stop-btn'); // Botón detener del panel premium
const cameraSection = document.getElementById('camera-section'); // Sección premium del HTML

// Apuntamos a los elementos de video y canvas de la sección premium
const video = document.getElementById('camera-video');
const canvas = document.getElementById('camera-canvas');
const resultadoDiv = document.getElementById('resultado-ia');

let videoStream = null;
let autoCaptureInterval = null;
const cameraStatus = document.getElementById('camera-status');
const timerCountdown = document.getElementById('timer-countdown');
const cameraBrand = document.getElementById('camera-brand');
const cameraModel = document.getElementById('camera-model');
const cameraCircleFill = document.getElementById('camera-circle-fill');
const cameraConfidenceText = document.getElementById('camera-confidence-text');
const cameraAnalyzing = document.getElementById('camera-analyzing');

function updateCameraStatus(text) {
    if (cameraStatus) cameraStatus.textContent = text;
}

// Logs de diagnóstico iniciales
try {
    console.log('[DEBUG] camara.js loaded — btnCamaraLive present:', !!btnCamaraLive);
    if (cameraStatus) cameraStatus.textContent = 'Script cámara cargado.';
} catch (e) {
    console.error('[DEBUG] camara.js init error', e);
}

function updateTimer(seconds) {
    if (timerCountdown) timerCountdown.textContent = `${seconds}s`;
}

function renderCameraResult(res) {
    if (cameraBrand) cameraBrand.textContent = res.specs?.brand || res.prediction || '-';
    if (cameraModel) cameraModel.textContent = res.prediction || '-';
    if (cameraConfidenceText) cameraConfidenceText.textContent = (res.confidence * 100).toFixed(1) + '%';
    if (cameraCircleFill) cameraCircleFill.setAttribute('stroke-dasharray', `${res.confidence * 100}, 100`);
    if (cameraAnalyzing) cameraAnalyzing.style.display = 'none';
}

function startAutoCapture() {
    if (autoCaptureInterval) return;
    updateTimer(2);
    captureAndAnalyzeFrame(true);
    autoCaptureInterval = setInterval(() => {
        if (videoStream) {
            captureAndAnalyzeFrame(true);
        }
        updateTimer(2);
    }, 3000);
}

function stopAutoCapture() {
    if (autoCaptureInterval) {
        clearInterval(autoCaptureInterval);
        autoCaptureInterval = null;
        if (timerCountdown) timerCountdown.textContent = '—';
    }
}

async function captureAndAnalyzeFrame(isAuto = false) {
    if (!videoStream || !canvas || !video) return;
    const context = canvas.getContext('2d');
    
    // Sincronizar el tamaño del canvas con el flujo de video en tiempo real
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');

    if (cameraAnalyzing) cameraAnalyzing.style.display = 'flex';
    updateCameraStatus('Analizando imagen de cámara...');

    try {
        const response = await fetch('/predict_frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl })
        });

        const data = await response.json();
        
        if (data.success) {
            const res = data.result;
            renderCameraResult(res);

            // 1. Determinar la predicción con mayor probabilidad
            let topLabel = res.prediction || '-';
            let topProb = res.confidence || 0;

            if (res.probabilities && Object.keys(res.probabilities).length > 0) {
                const sorted = Object.entries(res.probabilities).sort((a, b) => b[1] - a[1]);
                topLabel = sorted[0][0];
                topProb = sorted[0][1];
            }

            const esNoJDM = topLabel === 'No JDM';

            // 2. Mantener el bloque superior derecho de predicción principal vacío por estética limpia
            const predictedClassEl = document.getElementById('predicted-class');
            const confidenceScoreEl = document.getElementById('confidence-score');
            
            if (predictedClassEl) {
                predictedClassEl.textContent = ''; 
            }
            if (confidenceScoreEl) {
                confidenceScoreEl.textContent = ''; 
            }

            // 3. Rellenar las especificaciones técnicas SIEMPRE con lo que devuelva el backend
            const resultsSection = document.getElementById('results-section');
            const specsContainer = document.getElementById('car-specs-container');
            
            if (resultsSection) resultsSection.classList.remove('hidden');
            
            if (specsContainer) {
                specsContainer.classList.remove('hidden');
                
                if (!esNoJDM) {
                    document.getElementById('spec-brand').textContent = res.specs?.brand || '-';
                    document.getElementById('spec-year').textContent = res.specs?.year || '-';
                    document.getElementById('spec-engine').textContent = res.specs?.engine || '-';
                    document.getElementById('spec-details').textContent = res.specs?.details || '-';
                } else {
                    document.getElementById('spec-brand').textContent = '-';
                    document.getElementById('spec-year').textContent = '-';
                    document.getElementById('spec-engine').textContent = '-';
                    document.getElementById('spec-details').textContent = 'La IA no detectó un auto deportivo japonés en esta imagen.';
                }
            }

            // 4. Renderizar las barras de probabilidad dinámicas
            const probBarsContainer = document.getElementById('prob-bars');
            if (probBarsContainer && res.probabilities) {
                probBarsContainer.innerHTML = '';
                const sortedProbs = Object.entries(res.probabilities).sort((a, b) => b[1] - a[1]);
                for (const [modelo, prob] of sortedProbs) {
                    const porcentaje = (prob * 100).toFixed(1);
                    const barHtml = `
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                            <span style="width: 150px; color: #aaa; font-size: 14px; text-align: left;">${modelo}</span>
                            <div style="flex-grow: 1; height: 4px; background-color: #333; border-radius: 2px; margin: 0 15px; overflow: hidden;">
                                <div style="width: ${porcentaje}%; height: 100%; background-color: ${modelo === 'No JDM' ? '#ff4444' : '#fff'}; border-radius: 2px;"></div>
                            </div>
                            <span style="width: 50px; text-align: right; color: #aaa; font-size: 14px;">${porcentaje}%</span>
                        </div>
                    `;
                    probBarsContainer.insertAdjacentHTML('beforeend', barHtml);
                }
            }

            if (resultsSection && !isAuto) resultsSection.scrollIntoView({ behavior: 'smooth' });
            updateCameraStatus('Imagen detectada y analizada correctamente.');
        } else {
            console.error('Error devuelto por la IA:', data.error);
            updateCameraStatus('Error al analizar la imagen de la cámara.');
        }
    } catch (error) {
        console.error('Error de red: ', error);
        updateCameraStatus('Error de conexión con el servidor.');
    }
}

// Función para activar la cámara en la sección dedicada
async function encenderCamara() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            const msg = 'getUserMedia no está disponible en este navegador.';
            updateCameraStatus(msg);
            alert(msg);
            return;
        }

        console.log('[DEBUG] Solicitando acceso a la cámara...');
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); 
        console.log('[DEBUG] Acceso concedido.');
        
        if (video) {
            video.srcObject = videoStream;
        }
        
        // Removemos la clase hidden de la sección premium para mostrarla abajo
        if (cameraSection) cameraSection.classList.remove('hidden');
        
        // MODIFICADO: Ocultar por completo el botón "Cámara en Vivo" al encender
        if (btnCamaraLive) btnCamaraLive.classList.add('hidden');
        
        updateCameraStatus('Modo cámara activo.');
        if (resultadoDiv) resultadoDiv.innerText = "Modo cámara activo. Escaneando en vivo...";

        if (video) {
            video.addEventListener('playing', () => {
                startAutoCapture();
            }, { once: true });
        }
    } catch (err) {
        console.error('[DEBUG] Error crítico al encender cámara:', err);
        const name = err.name || 'Error';
        updateCameraStatus(`No se pudo abrir la cámara: ${name}`);
        alert(`Error al abrir la cámara web: ${name}. Revisa los permisos.`);
    }
}

// Función para apagar la cámara y ocultar el contenedor premium
function apagarCamara() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        if (video) video.srcObject = null;
        videoStream = null;
        stopAutoCapture();
        
        // Volvemos a ocultar la sección de la cámara
        if (cameraSection) cameraSection.classList.add('hidden');
        
        // MODIFICADO: Volver a mostrar el botón "Cámara en Vivo" cuando se detenga
        if (btnCamaraLive) btnCamaraLive.classList.remove('hidden');
        
        updateCameraStatus('Cámara desactivada.');
        if (resultadoDiv) resultadoDiv.innerText = "Cámara desactivada.";
    }
}

// Manejador de clic en el botón principal para encender
if (btnCamaraLive) {
    btnCamaraLive.addEventListener('click', (e) => {
        e.preventDefault();
        if (!videoStream) {
            encenderCamara();
        } else {
            apagarCamara();
        }
    });
}

// Manejador de clic en el botón "Detener" del panel premium
if (btnStopCamera) {
    btnStopCamera.addEventListener('click', (e) => {
        e.preventDefault();
        apagarCamara();
    });
}