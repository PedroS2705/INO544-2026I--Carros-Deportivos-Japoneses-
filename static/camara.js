// static/js/camara.js

const btnCamaraLive = document.getElementById('btn-camara-en-vivo');
const contenidoDropzone = document.getElementById('contenido-dropzone');
const contenedorStreaming = document.getElementById('contenedor-streaming');

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const btnCapturar = document.getElementById('capturar-btn');
const resultadoDiv = document.getElementById('resultado-ia');

let videoStream = null;

// Función para activar la cámara en el recuadro principal
async function encenderCamara() {
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = videoStream;
        
        // Intercambiar vistas en la interfaz
        if (contenidoDropzone) contenidoDropzone.style.display = 'none';
        contenedorStreaming.style.display = 'flex';
        
        // Cambiar el estado visual del botón
        btnCamaraLive.innerHTML = '🔴 Apagar Cámara';
        btnCamaraLive.style.color = '#ff4444';
        btnCamaraLive.style.borderColor = '#ff4444';
        if (resultadoDiv) resultadoDiv.innerText = "Modo cámara activo. Apunta a un auto y presiona 'Reconocer Auto'.";
    } catch (err) {
        console.error("Error al acceder a la cámara: ", err);
        alert("No se pudo acceder a la cámara web. Verifica los permisos de tu navegador.");
    }
}

// Función para apagar la cámara y restaurar el drag & drop
function apagarCamara() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        videoStream = null;
        
        // Intercambiar vistas de nuevo
        contenedorStreaming.style.display = 'none';
        if (contenidoDropzone) contenidoDropzone.style.display = 'block';
        
        // Restaurar botón principal
        btnCamaraLive.innerHTML = '🎥 Cámara en Vivo';
        btnCamaraLive.style.color = ''; 
        btnCamaraLive.style.borderColor = '';
        if (resultadoDiv) resultadoDiv.innerText = "Cámara desactivada.";
    }
}

// Controlar el clic en el botón "Cámara en Vivo"
btnCamaraLive.addEventListener('click', () => {
    if (!videoStream) {
        encenderCamara();
    } else {
        apagarCamara();
    }
});

// Evento para tomar la foto y mandarla a la IA
btnCapturar.addEventListener('click', async () => {
    if (!videoStream) return;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    
    // Cambiar estado del botón mientras carga
    const originalText = btnCapturar.innerHTML;
    btnCapturar.innerHTML = '⏳ Analizando Vehículo...';
    btnCapturar.disabled = true;

    try {
        const response = await fetch('/predict_frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl })
        });

        const data = await response.json();

        if (data.success) {
            const res = data.result;
            const resultsSection = document.getElementById('results-section');
            const specsContainer = document.getElementById('car-specs-container');
            const probBarsContainer = document.getElementById('prob-bars');
            
            // Mostrar la sección de resultados
            if (resultsSection) resultsSection.classList.remove('hidden');
            
            // LÓGICA DE VALIDACIÓN: ¿Es realmente un JDM? (Umbral 40%)
            const umbralConfianza = 0.40; 
            const esJDM = res.prediction !== "No JDM" && res.confidence >= umbralConfianza;

            if (esJDM) {
                // SÍ ES UN JDM
                document.getElementById('predicted-class').textContent = res.prediction;
                document.getElementById('predicted-class').style.color = ""; 
                document.getElementById('confidence-score').textContent = (res.confidence * 100).toFixed(1) + '%';
                
                if (specsContainer) specsContainer.classList.remove('hidden');
                document.getElementById('spec-brand').textContent = res.specs?.brand || '-';
                document.getElementById('spec-year').textContent = res.specs?.year || '-';
                document.getElementById('spec-engine').textContent = res.specs?.engine || '-';
                document.getElementById('spec-details').textContent = res.specs?.details || '-';
            } else {
                // NO ES UN JDM O LA CONFIANZA ES MUY BAJA
                document.getElementById('predicted-class').textContent = "No es un JDM / Duda";
                document.getElementById('predicted-class').style.color = "#ff4444";
                document.getElementById('confidence-score').textContent = (res.confidence * 100).toFixed(1) + '%';
                
                if (specsContainer) specsContainer.classList.remove('hidden');
                document.getElementById('spec-brand').textContent = "-";
                document.getElementById('spec-year').textContent = "-";
                document.getElementById('spec-engine').textContent = "-";
                document.getElementById('spec-details').textContent = "La IA no detectó con seguridad un auto deportivo japonés en esta imagen.";
            }

            // Llenar las Barras de Probabilidades
            if (probBarsContainer) {
                probBarsContainer.innerHTML = ''; 
                
                if (res.probabilities) {
                    // Ordenar de mayor a menor
                    const sortedProbs = Object.entries(res.probabilities).sort((a, b) => b[1] - a[1]);

                    for (const [modelo, prob] of sortedProbs) {
                        const porcentaje = (prob * 100).toFixed(1);
                        const barHtml = `
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                                <span style="width: 150px; color: #aaa; font-size: 14px; text-align: left;">${modelo}</span>
                                <div style="flex-grow: 1; height: 4px; background-color: #333; border-radius: 2px; margin: 0 15px; overflow: hidden;">
                                    <div style="width: ${porcentaje}%; height: 100%; background-color: ${modelo === "No JDM" ? '#ff4444' : '#fff'}; border-radius: 2px;"></div>
                                </div>
                                <span style="width: 50px; text-align: right; color: #aaa; font-size: 14px;">${porcentaje}%</span>
                            </div>
                        `;
                        probBarsContainer.insertAdjacentHTML('beforeend', barHtml);
                    }
                }
            }
            
            // Hacer scroll suave hacia abajo
            if (resultsSection) resultsSection.scrollIntoView({ behavior: 'smooth' });

        } else {
            alert("Error en el análisis: " + data.error);
        }
    } catch (error) {
        console.error("Error de red: ", error);
        alert("No se pudo conectar con el servidor. Revisa tu consola.");
    } finally {
        // Restaurar el botón
        btnCapturar.innerHTML = originalText;
        btnCapturar.disabled = false;
    }
});