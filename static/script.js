const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const browseText = document.querySelector('.browse-text');
const previewContainer = document.getElementById('preview-container');
const imagePreview = document.getElementById('image-preview');
const resetBtn = document.getElementById('reset-btn');
const analyzeBtn = document.getElementById('analyze-btn');
const resultsSection = document.getElementById('results-section');
const carSpecsContainer = document.getElementById('car-specs-container');
const probBarsContainer = document.getElementById('prob-bars');
const predictedClass = document.getElementById('predicted-class');
const confidenceScore = document.getElementById('confidence-score');
const specBrand = document.getElementById('spec-brand');
const specYear = document.getElementById('spec-year');
const specEngine = document.getElementById('spec-engine');
const specDetails = document.getElementById('spec-details');
const uploadIcon = document.querySelector('.upload-icon');

let selectedFile = null;

function setLoadingState(isLoading) {
    const btnText = analyzeBtn.querySelector('.btn-text');
    const loader = analyzeBtn.querySelector('.loader');

    analyzeBtn.disabled = isLoading;
    if (btnText) btnText.textContent = isLoading ? 'Analizando...' : 'Analizar Vehículo';
    if (loader) loader.classList.toggle('hidden', !isLoading);
}

function openFilePicker() {
    if (fileInput) {
        fileInput.click();
    }
}

function resetUpload() {
    selectedFile = null;
    if (imagePreview) imagePreview.src = '';
    if (previewContainer) previewContainer.classList.add('hidden');
    if (dropZone) dropZone.classList.remove('hidden');
    if (resultsSection) resultsSection.classList.add('hidden');
    if (carSpecsContainer) carSpecsContainer.classList.add('hidden');
    if (probBarsContainer) probBarsContainer.innerHTML = '';
}

function showDropZoneHighlight(active) {
    if (dropZone) {
        dropZone.classList.toggle('dragover', active);
        if (uploadIcon) uploadIcon.style.color = active ? 'var(--accent)' : '';
    }
}

function renderResults(res) {
    if (!resultsSection) return;
    resultsSection.classList.remove('hidden');
    // Determinar la etiqueta con mayor probabilidad
    function getTopPrediction(obj) {
        if (obj.probabilities && Object.keys(obj.probabilities).length > 0) {
            const sorted = Object.entries(obj.probabilities).sort((a, b) => b[1] - a[1]);
            return { label: sorted[0][0], prob: sorted[0][1] };
        }
        return { label: obj.prediction || '-', prob: obj.confidence || 0 };
    }

    const umbralConfianza = 0.40;
    const top = getTopPrediction(res);
    const esJDM = top.label !== 'No JDM' && top.prob >= umbralConfianza;

    // Mostrar la etiqueta de mayor probabilidad como principal
    predictedClass.textContent = top.label;
    predictedClass.style.color = esJDM ? '' : '#ff4444';
    confidenceScore.textContent = (top.prob * 100).toFixed(1) + '%';

    if (esJDM) {
        if (carSpecsContainer) carSpecsContainer.classList.remove('hidden');
        specBrand.textContent = res.specs?.brand || '-';
        specYear.textContent = res.specs?.year || '-';
        specEngine.textContent = res.specs?.engine || '-';
        specDetails.textContent = res.specs?.details || '-';
    } else {
        if (carSpecsContainer) carSpecsContainer.classList.remove('hidden');
        specBrand.textContent = '-';
        specYear.textContent = '-';
        specEngine.textContent = '-';
        specDetails.textContent = 'La IA no detectó con seguridad un auto deportivo japonés en esta imagen.';
    }

    if (probBarsContainer) {
        probBarsContainer.innerHTML = '';
        if (res.probabilities) {
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
    }

}

async function analyzeSelectedFile() {
    if (!selectedFile) {
        alert('Selecciona una imagen antes de analizar.');
        return;
    }

    setLoadingState(true);

    try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        console.log('DEBUG /predict response:', data);
        if (data.success) {
            console.log('DEBUG result object:', data.result);
            renderResults(data.result);
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('Error en el análisis: ' + data.error);
        }
    } catch (err) {
        console.error('Error de red al analizar imagen:', err);
        alert('No se pudo conectar con el servidor. Revisa la consola y vuelve a intentarlo.');
    } finally {
        setLoadingState(false);
    }
}

function handleFileSelection(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
        return;
    }

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
        if (imagePreview) imagePreview.src = reader.result;
        if (previewContainer) previewContainer.classList.remove('hidden');
        if (dropZone) dropZone.classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

if (browseText) {
    browseText.addEventListener('click', event => {
        event.stopPropagation();
        openFilePicker();
    });
}

if (dropZone) {
    dropZone.addEventListener('click', openFilePicker);
    dropZone.addEventListener('dragover', event => {
        event.preventDefault();
        showDropZoneHighlight(true);
    });
    dropZone.addEventListener('dragleave', () => {
        showDropZoneHighlight(false);
    });
    dropZone.addEventListener('drop', event => {
        event.preventDefault();
        showDropZoneHighlight(false);
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelection(files[0]);
        }
    });
}

if (fileInput) {
    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
            handleFileSelection(fileInput.files[0]);
        }
    });
}

if (resetBtn) {
    resetBtn.addEventListener('click', resetUpload);
}

if (analyzeBtn) {
    analyzeBtn.addEventListener('click', analyzeSelectedFile);
}

// En caso de que el usuario deje el drag zone con el cursor fuera de la ventana
window.addEventListener('dragend', () => showDropZoneHighlight(false));
window.addEventListener('drop', event => {
    if (event.target === window) {
        event.preventDefault();
        showDropZoneHighlight(false);
    }
});
