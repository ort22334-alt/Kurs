(function(){
    // DOM elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const previewImg = document.getElementById('preview');
    const noImageDiv = document.getElementById('noImage');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const brightnessSlider = document.getElementById('brightness');
    const contrastSlider = document.getElementById('contrast');
    const blurSlider = document.getElementById('blur');
    const sepiaSlider = document.getElementById('sepia');
    const brightnessVal = document.getElementById('brightnessValue');
    const contrastVal = document.getElementById('contrastValue');
    const blurValSpan = document.getElementById('blurValue');
    const sepiaValSpan = document.getElementById('sepiaValue');
    const rotateBtn = document.getElementById('rotateBtn');
    const resetEffectsBtn = document.getElementById('resetEffects');
    const applyBtn = document.getElementById('applyBtn');
    const resetBtn = document.getElementById('resetBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const fileInfoDiv = document.getElementById('fileInfo');
    const fileNameSpan = document.getElementById('fileName');
    const fileSizeSpan = document.getElementById('fileSize');
    const originalSizeSpan = document.getElementById('originalSize');
    const newSizeSpan = document.getElementById('newSize');

    // State
    let originalImage = null;
    let currentCanvas = null;
    let currentBlob = null;
    let rotationAngle = 0;
    let hasAppliedChanges = false;
    
    let tempBrightness = 100;
    let tempContrast = 100;
    let tempBlur = 0;
    let tempSepia = 0;
    
    let loadedFile = null;
    let originalImgWidth = 0, originalImgHeight = 0;
    
    function formatBytes(bytes) {
        if (!bytes && bytes !== 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024*1024)).toFixed(1) + ' MB';
    }
    
    function updatePreviewFromOriginal() {
        if (!originalImage || !originalImage.complete || originalImage.naturalWidth === 0) return;
        
        let targetW = parseInt(widthInput.value, 10);
        let targetH = parseInt(heightInput.value, 10);
        if (isNaN(targetW) || targetW < 10) targetW = originalImgWidth;
        if (isNaN(targetH) || targetH < 10) targetH = originalImgHeight;
        
        const canvas = document.createElement('canvas');
        let finalW = targetW, finalH = targetH;
        let angle = rotationAngle % 360;
        if (angle === 90 || angle === 270) {
            finalW = targetH;
            finalH = targetW;
        }
        canvas.width = finalW;
        canvas.height = finalH;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, finalW, finalH);
        ctx.save();
        ctx.translate(finalW/2, finalH/2);
        ctx.rotate(angle * Math.PI/180);
        ctx.drawImage(originalImage, -targetW/2, -targetH/2, targetW, targetH);
        ctx.restore();
        
        const filterStyle = `brightness(${tempBrightness/100}) contrast(${tempContrast/100}) blur(${tempBlur}px) sepia(${tempSepia/100})`;
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = finalW;
        finalCanvas.height = finalH;
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.filter = filterStyle;
        finalCtx.drawImage(canvas, 0, 0);
        
        previewImg.src = finalCanvas.toDataURL();
        previewImg.style.display = 'block';
        noImageDiv.style.display = 'none';
    }
    
    function refreshPreview() {
        if (!originalImage) return;
        updatePreviewFromOriginal();
    }
    
    function applyChanges() {
        if (!originalImage) {
            alert("Сначала загрузите изображение");
            return;
        }
        const targetW = parseInt(widthInput.value, 10);
        const targetH = parseInt(heightInput.value, 10);
        if (isNaN(targetW) || targetW < 5 || isNaN(targetH) || targetH < 5) {
            alert("Введите корректные размеры (минимум 5px)");
            return;
        }
        let angle = rotationAngle % 360;
        let canvasW = targetW, canvasH = targetH;
        if (angle === 90 || angle === 270) {
            canvasW = targetH;
            canvasH = targetW;
        }
        const canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(canvasW/2, canvasH/2);
        ctx.rotate(angle * Math.PI/180);
        ctx.drawImage(originalImage, -targetW/2, -targetH/2, targetW, targetH);
        ctx.restore();
        
        const filterCss = `brightness(${tempBrightness/100}) contrast(${tempContrast/100}) blur(${tempBlur}px) sepia(${tempSepia/100})`;
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = canvasW;
        finalCanvas.height = canvasH;
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.filter = filterCss;
        finalCtx.drawImage(canvas, 0, 0);
        
        currentCanvas = finalCanvas;
        previewImg.src = finalCanvas.toDataURL();
        previewImg.style.display = 'block';
        noImageDiv.style.display = 'none';
        
        finalCanvas.toBlob((blob) => {
            if (blob) {
                currentBlob = blob;
                newSizeSpan.innerText = formatBytes(blob.size);
            }
        }, 'image/png');
        
        hasAppliedChanges = true;
        applyBtn.disabled = false;
        resetBtn.disabled = false;
        downloadBtn.disabled = false;
    }
    
    function resetAll() {
        if (!originalImage) return;
        rotationAngle = 0;
        tempBrightness = 100;
        tempContrast = 100;
        tempBlur = 0;
        tempSepia = 0;
        brightnessSlider.value = 100;
        contrastSlider.value = 100;
        blurSlider.value = 0;
        sepiaSlider.value = 0;
        brightnessVal.innerText = '100%';
        contrastVal.innerText = '100%';
        blurValSpan.innerText = '0px';
        sepiaValSpan.innerText = '0%';
        if (originalImgWidth && originalImgHeight) {
            widthInput.value = originalImgWidth;
            heightInput.value = originalImgHeight;
        }
        refreshPreview();
        hasAppliedChanges = false;
        currentCanvas = null;
        currentBlob = null;
        downloadBtn.disabled = true;
        newSizeSpan.innerText = '—';
    }
    
    function resetEffectsOnly() {
        if (!originalImage) return;
        tempBrightness = 100;
        tempContrast = 100;
        tempBlur = 0;
        tempSepia = 0;
        rotationAngle = 0;
        brightnessSlider.value = 100;
        contrastSlider.value = 100;
        blurSlider.value = 0;
        sepiaSlider.value = 0;
        brightnessVal.innerText = '100%';
        contrastVal.innerText = '100%';
        blurValSpan.innerText = '0px';
        sepiaValSpan.innerText = '0%';
        refreshPreview();
    }
    
    function loadImageFromFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert("Пожалуйста, выберите изображение");
            return;
        }
        loadedFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                originalImgWidth = img.width;
                originalImgHeight = img.height;
                widthInput.value = img.width;
                heightInput.value = img.height;
                rotationAngle = 0;
                tempBrightness = 100;
                tempContrast = 100;
                tempBlur = 0;
                tempSepia = 0;
                brightnessSlider.value = 100;
                contrastSlider.value = 100;
                blurSlider.value = 0;
                sepiaSlider.value = 0;
                brightnessVal.innerText = '100%';
                contrastVal.innerText = '100%';
                blurValSpan.innerText = '0px';
                sepiaValSpan.innerText = '0%';
                refreshPreview();
                hasAppliedChanges = false;
                currentCanvas = null;
                currentBlob = null;
                downloadBtn.disabled = true;
                applyBtn.disabled = false;
                resetBtn.disabled = false;
                
                fileInfoDiv.style.display = 'block';
                fileNameSpan.innerText = file.name;
                fileSizeSpan.innerText = formatBytes(file.size);
                originalSizeSpan.innerText = `${img.width} × ${img.height} px`;
                newSizeSpan.innerText = '—';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // Event listeners
    dropArea.addEventListener('click', () => fileInput.click());
    dropArea.addEventListener('dragover', (e) => { e.preventDefault(); dropArea.style.background='#ecf3fa'; });
    dropArea.addEventListener('dragleave', () => dropArea.style.background='#f9fcff');
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.style.background='#f9fcff';
        const file = e.dataTransfer.files[0];
        if (file) loadImageFromFile(file);
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) loadImageFromFile(e.target.files[0]);
    });
    
    brightnessSlider.addEventListener('input', () => {
        tempBrightness = parseInt(brightnessSlider.value,10);
        brightnessVal.innerText = tempBrightness+'%';
        refreshPreview();
    });
    contrastSlider.addEventListener('input', () => {
        tempContrast = parseInt(contrastSlider.value,10);
        contrastVal.innerText = tempContrast+'%';
        refreshPreview();
    });
    blurSlider.addEventListener('input', () => {
        tempBlur = parseFloat(blurSlider.value);
        blurValSpan.innerText = tempBlur.toFixed(1)+'px';
        refreshPreview();
    });
    sepiaSlider.addEventListener('input', () => {
        tempSepia = parseInt(sepiaSlider.value,10);
        sepiaValSpan.innerText = tempSepia+'%';
        refreshPreview();
    });
    widthInput.addEventListener('input', () => { if(originalImage) refreshPreview(); });
    heightInput.addEventListener('input', () => { if(originalImage) refreshPreview(); });
    rotateBtn.addEventListener('click', () => {
        if (!originalImage) return;
        rotationAngle = (rotationAngle + 90) % 360;
        refreshPreview();
    });
    resetEffectsBtn.addEventListener('click', resetEffectsOnly);
    applyBtn.addEventListener('click', applyChanges);
    resetBtn.addEventListener('click', resetAll);
    downloadBtn.addEventListener('click', () => {
        if (!currentCanvas && !hasAppliedChanges) {
            alert("Сначала примените изменения (кнопка «Применить изменения»)");
            return;
        }
        if (currentCanvas) {
            currentCanvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'edited_image.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        } else if (originalImage) {
            alert("Нажмите «Применить изменения» перед скачиванием");
        }
    });
})();
