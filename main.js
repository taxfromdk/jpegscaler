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

    // File input handler
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    });

    // Quality slider handler
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
        updateEncodedImage();
    });

    // Dimension inputs handler
    widthInput.addEventListener('input', updateEncodedImage);
    heightInput.addEventListener('input', updateEncodedImage);

    // Download button handler
    downloadBtn.addEventListener('click', () => {
        if (encodedImage.src) {
            const link = document.createElement('a');
            link.href = encodedImage.src;
            const width = parseInt(widthInput.value) || originalImage.naturalWidth;
            const height = parseInt(heightInput.value) || originalImage.naturalHeight;
            const quality = parseInt(qualitySlider.value);
            link.download = `${originalFilename}-${width}x${height}-q${quality}.jpg`;
            link.click();
        }
    });

    async function handleImageUpload(file) {
        currentFile = file;
        originalFilename = file.name.replace(/\.[^/.]+$/, '');
        
        // Display original image
        const originalUrl = URL.createObjectURL(file);
        originalImage.src = originalUrl;
        
        // Update original image info
        document.getElementById('original-size').textContent = formatFileSize(file.size);
        
        originalImage.onload = () => {
            document.getElementById('original-dimensions').textContent = 
                `${originalImage.naturalWidth}x${originalImage.naturalHeight}`;
            
            // Set default dimensions
            widthInput.value = originalImage.naturalWidth;
            heightInput.value = originalImage.naturalHeight;
            
            updateEncodedImage();
        };
    }

    async function updateEncodedImage() {
        if (!currentFile) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate dimensions
        let newWidth = parseInt(widthInput.value) || originalImage.naturalWidth;
        let newHeight = parseInt(heightInput.value) || originalImage.naturalHeight;

        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw image with new dimensions
        ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);

        // Convert to JPEG with selected quality
        const quality = parseInt(qualitySlider.value) / 100;
        const encodedUrl = canvas.toDataURL('image/jpeg', quality);
        encodedImage.src = encodedUrl;

        // Update encoded image info
        encodedImage.onload = async () => {
            const response = await fetch(encodedUrl);
            const blob = await response.blob();
            document.getElementById('encoded-size').textContent = formatFileSize(blob.size);
            document.getElementById('encoded-dimensions').textContent = 
                `${newWidth}x${newHeight}`;
        };
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});