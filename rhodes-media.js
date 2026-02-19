// Extracted from rhodes.js: attachments, webcam capture, paste/drop intake, and preview panel actions

window.installRhodesMediaHelpers = function installRhodesMediaHelpers(deps) {
    if (!deps || window.__rhodesMediaHelpersInstalled) return;
    window.__rhodesMediaHelpersInstalled = true;

    const showToast = deps.showToast || function(msg) { try { alert(msg); } catch {} };
    const getWs = deps.getWs || function() { return null; };

    let pendingImages = Array.isArray(deps.initialPendingImages) ? deps.initialPendingImages.slice() : [];

    const imageBtn = document.getElementById('image-btn');
    const imageInput = document.getElementById('image-input');
    const imagePreview = document.getElementById('image-preview');

    function getPendingImages() {
        return pendingImages;
    }

    function setPendingImages(images) {
        pendingImages = Array.isArray(images) ? images : [];
    }

    function addImage(file) {
        if (!file || !file.type || !file.type.startsWith('image/')) return;
        if (pendingImages.length >= 5) {
            alert('Maximum 5 images');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            pendingImages.push({
                type: 'image',
                media_type: file.type,
                data: base64.split(',')[1],
                name: file.name
            });
            updateImagePreview();
        };
        reader.readAsDataURL(file);
    }

    function updateImagePreview() {
        if (!imagePreview) return;
        if (pendingImages.length === 0) {
            imagePreview.style.display = 'none';
            if (imageBtn) {
                imageBtn.style.borderColor = 'var(--cyan)';
                imageBtn.style.color = 'var(--cyan)';
            }
            return;
        }
        imagePreview.style.display = 'flex';
        imagePreview.style.gap = '8px';
        imagePreview.style.flexWrap = 'wrap';
        imagePreview.style.alignItems = 'center';
        if (imageBtn) {
            imageBtn.style.borderColor = 'var(--green)';
            imageBtn.style.color = 'var(--green)';
        }
        imagePreview.innerHTML = pendingImages.map((img, i) => {
            const isImage = img.type === 'image';
            const icon = img.type === 'document' ? '📄' : (img.type === 'text' ? '📝' : '🖼️');
            if (isImage) {
                return `<div style="position:relative;display:inline-block;">
                    <img src="data:${img.media_type};base64,${img.data}" style="height:60px;border-radius:4px;border:1px solid var(--cyan);">
                    <button onclick="removeImage(${i})" style="position:absolute;top:-8px;right:-8px;background:var(--magenta);border:none;color:#fff;width:20px;height:20px;border-radius:50%;cursor:pointer;font-size:12px;">×</button>
                </div>`;
            }
            return `<div style="position:relative;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;background:#1a1a1a;border:1px solid var(--cyan);border-radius:4px;">
                    <span style="font-size:20px;">${icon}</span>
                    <span style="color:var(--text);font-size:12px;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${img.name}</span>
                    <button onclick="removeImage(${i})" style="background:var(--magenta);border:none;color:#fff;width:18px;height:18px;border-radius:50%;cursor:pointer;font-size:11px;line-height:1;">×</button>
                </div>`;
        }).join('') + `<span style="color:var(--cyan);font-size:12px;">${pendingImages.length}/5 files</span>`;
    }

    function removeImage(index) {
        pendingImages.splice(index, 1);
        updateImagePreview();
    }

    window.removeImage = removeImage;

    window.downloadSiteContent = function(elementId) {
        const textarea = document.getElementById(elementId);
        if (!textarea) return;

        const content = textarea.value
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
        const filename = textarea.dataset.filename || 'website.html';

        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    let currentPreviewContent = null;
    let currentPreviewFilename = null;

    window.openPreview = function(elementId) {
        const textarea = document.getElementById(elementId);
        if (!textarea) return;

        currentPreviewFilename = textarea.dataset.filename || 'preview.html';
        currentPreviewContent = textarea.value
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');

        const title = document.getElementById('preview-title');
        if (title) title.textContent = `Preview: ${currentPreviewFilename}`;

        const frame = document.getElementById('preview-frame');
        if (frame) {
            const blob = new Blob([currentPreviewContent], { type: 'text/html' });
            frame.src = URL.createObjectURL(blob);
        }

        const panel = document.getElementById('preview-panel');
        if (panel) panel.classList.add('open');
        const overlay = document.getElementById('preview-overlay');
        if (overlay) overlay.classList.add('open');
    };

    window.closePreview = function() {
        const panel = document.getElementById('preview-panel');
        if (panel) panel.classList.remove('open');
        const overlay = document.getElementById('preview-overlay');
        if (overlay) overlay.classList.remove('open');
        const frame = document.getElementById('preview-frame');
        if (frame) frame.src = 'about:blank';
        currentPreviewContent = null;
    };

    window.downloadPreview = function() {
        if (!currentPreviewContent) return;
        const blob = new Blob([currentPreviewContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentPreviewFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    window.openPreviewNewTab = function() {
        if (!currentPreviewContent) return;
        const blob = new Blob([currentPreviewContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    window.deployPreview = function() {
        if (!currentPreviewContent) return;
        const siteName = prompt(
            'Enter site name (will be accessible at rhodesagi.com/sites/NAME/):',
            currentPreviewFilename.replace('.html', '').replace(/[^a-z0-9-]/gi, '-')
        );
        if (!siteName) return;

        const ws = getWs();
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                msg_type: 'deploy_site',
                payload: {
                    site_name: siteName,
                    html: currentPreviewContent
                }
            }));
            alert(`Deploying to rhodesagi.com/sites/${siteName}/...`);
            window.closePreview();
            return;
        }
        alert('Not connected to server');
    };

    if (imageBtn && imageInput) imageBtn.onclick = () => imageInput.click();
    if (imageInput) {
        imageInput.onchange = (e) => {
            Array.from(e.target.files).forEach(addFile);
            imageInput.value = '';
        };
    }

    function addFile(file) {
        if (!file) return;
        if (pendingImages.length >= 5) {
            showToast('Maximum 5 attachments');
            return;
        }

        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';
        const isText = file.type.startsWith('text/') ||
            /\.(txt|md|json|csv|xml|html|css|js|py|java|c|cpp|h|yml|yaml|log)$/i.test(file.name);

        if (!isImage && !isPdf && !isText) {
            showToast('Unsupported file type: ' + file.type);
            return;
        }

        const maxSize = isText ? 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast(`File too large (max ${isText ? '1MB' : '10MB'})`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            pendingImages.push({
                type: isImage ? 'image' : (isPdf ? 'document' : 'text'),
                media_type: file.type || 'text/plain',
                data: base64.split(',')[1],
                name: file.name
            });
            updateImagePreview();
            showToast('Added: ' + file.name);
        };
        reader.readAsDataURL(file);
    }

    const webcamBtn = document.getElementById('webcam-btn');
    const webcamModal = document.getElementById('webcam-modal');
    const webcamVideo = document.getElementById('webcam-video');
    const webcamCanvas = document.getElementById('webcam-canvas');
    const webcamCapture = document.getElementById('webcam-capture');
    const webcamCancel = document.getElementById('webcam-cancel');
    let webcamStream = null;

    if (webcamBtn && webcamModal && webcamVideo && webcamCanvas && webcamCapture) {
        webcamBtn.onclick = async () => {
            try {
                webcamCapture.disabled = true;
                webcamCapture.style.opacity = '0.5';

                webcamStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
                });
                webcamVideo.srcObject = webcamStream;
                webcamModal.style.display = 'flex';

                webcamVideo.onloadedmetadata = () => {
                    webcamVideo.play();
                };
                webcamVideo.onplaying = () => {
                    webcamCapture.disabled = false;
                    webcamCapture.style.opacity = '1';
                };
            } catch (err) {
                console.error('Webcam error:', err);
                showToast('Could not access webcam');
            }
        };
    }

    if (webcamCapture && webcamVideo && webcamCanvas) {
        webcamCapture.onclick = () => {
            if (webcamVideo.videoWidth === 0 || webcamVideo.videoHeight === 0) {
                showToast('Camera not ready yet, please wait...');
                return;
            }

            webcamCanvas.width = webcamVideo.videoWidth;
            webcamCanvas.height = webcamVideo.videoHeight;
            const ctx = webcamCanvas.getContext('2d');
            ctx.drawImage(webcamVideo, 0, 0);

            webcamCanvas.toBlob((blob) => {
                if (!blob) {
                    showToast('Failed to capture image');
                    return;
                }
                const file = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
                addImage(file);

                const input = document.getElementById('input');
                if (input && !input.value.trim()) {
                    input.value = 'Draw my portrait in ASCII art based on this photo';
                }

                closeWebcam();
                showToast('Photo captured! Click SEND to send');
            }, 'image/jpeg', 0.9);
        };
    }

    if (webcamCancel) webcamCancel.onclick = closeWebcam;

    function closeWebcam() {
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            webcamStream = null;
        }
        if (webcamVideo) webcamVideo.srcObject = null;
        if (webcamModal) webcamModal.style.display = 'none';
    }

    document.addEventListener('paste', (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const activeEl = document.activeElement;
        const isTextInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
        const hasText = Array.from(items).some(item => item.kind === 'string' && item.type === 'text/plain');

        if (isTextInput && hasText) return;

        for (const item of items) {
            if (item.kind === 'file') {
                e.preventDefault();
                addFile(item.getAsFile());
            }
        }
    });

    function setupDragDrop() {
        const chatEl = document.getElementById('chat');
        if (!chatEl || !document.body) {
            setTimeout(setupDragDrop, 50);
            return;
        }
        let dragCounter = 0;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            chatEl.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            document.body.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        chatEl.addEventListener('dragenter', () => {
            dragCounter++;
            chatEl.classList.add('drag-over');
        });

        chatEl.addEventListener('dragleave', () => {
            dragCounter--;
            if (dragCounter === 0) {
                chatEl.classList.remove('drag-over');
            }
        });

        chatEl.addEventListener('drop', (e) => {
            dragCounter = 0;
            chatEl.classList.remove('drag-over');
            const files = e.dataTransfer?.files;
            if (files && files.length > 0) {
                Array.from(files).forEach(addFile);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupDragDrop);
    } else {
        setupDragDrop();
    }

    window.rhodesMediaHelpers = {
        getPendingImages,
        setPendingImages,
        addFile,
        addImage,
        removeImage,
        updateImagePreview,
        closeWebcam
    };

    updateImagePreview();
};
