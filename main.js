document.addEventListener('DOMContentLoaded', () => {
    // Load test image on startup
    fetch('test.jpg')
        .then(response => response.blob())
        .then(blob => {
            const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
            handleImageUpload(file);
        })
        .catch(error => console.error('Error loading test image:', error));

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const originalImage = document.getElementById('original-image');
    const encodedImage = document.getElementById('encoded-image');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('quality-value');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const downloadBtn = document.getElementById('download-btn');

    let currentFile = null;
    let originalFilename = 'test.jpg';
    let currentEncodedBlob = null;  // Store the current encoded blob

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            handleImageUpload(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    });

    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
        updateEncodedImage();
    });

    widthInput.addEventListener('input', updateEncodedImage);
    heightInput.addEventListener('input', updateEncodedImage);

    async function encodeImage(img, width, height, quality) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        return new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
        });
    }

    async function handleImageUpload(file) {
        currentFile = file;
        originalFilename = file.name.replace(/\.[^/.]+$/, '');
        
        const originalUrl = URL.createObjectURL(file);
        originalImage.src = originalUrl;
        
        document.getElementById('original-size-readable').textContent = formatFileSize(file.size);
        document.getElementById('original-size-bytes').textContent = file.size;
        
        originalImage.onload = () => {
            document.getElementById('original-dimensions').textContent = 
                `${originalImage.naturalWidth}x${originalImage.naturalHeight}`;
            
            widthInput.value = originalImage.naturalWidth;
            heightInput.value = originalImage.naturalHeight;
            
            updateEncodedImage();
            URL.revokeObjectURL(originalUrl);
        };
    }

    async function updateEncodedImage() {
        if (!currentFile) return;

        const width = parseInt(widthInput.value) || originalImage.naturalWidth;
        const height = parseInt(heightInput.value) || originalImage.naturalHeight;
        const quality = parseInt(qualitySlider.value) / 100;

        try {
            // Generate the encoded blob
            currentEncodedBlob = await encodeImage(originalImage, width, height, quality);
            
            // Create and display the encoded image
            const encodedUrl = URL.createObjectURL(currentEncodedBlob);
            encodedImage.src = encodedUrl;
            
            // Update size information
            document.getElementById('encoded-size-readable').textContent = formatFileSize(currentEncodedBlob.size);
            document.getElementById('encoded-size-bytes').textContent = currentEncodedBlob.size;
            document.getElementById('encoded-dimensions').textContent = `${width}x${height}`;
            
            // Clean up the URL after the image loads
            encodedImage.onload = () => URL.revokeObjectURL(encodedUrl);
        } catch (error) {
            console.error('Error encoding image:', error);
        }
    }

    downloadBtn.addEventListener('click', () => {
        if (currentEncodedBlob) {
            const width = parseInt(widthInput.value) || originalImage.naturalWidth;
            const height = parseInt(heightInput.value) || originalImage.naturalHeight;
            const quality = parseInt(qualitySlider.value);
            
            // Use the exact same blob that's being previewed
            const url = URL.createObjectURL(currentEncodedBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${originalFilename}-${width}x${height}-q${quality}-${currentEncodedBlob.size}b.jpg`;
            link.click();
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 100);
        }
    });

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});