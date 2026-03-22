/* RhodesCards — Image Occlusion editor
   Draw rectangles on an image to create cloze cards.
   Each rectangle becomes a separate cloze deletion. */

RC.occlusionState = {
    image: null,
    imageUrl: null,
    rects: [],
    drawing: false,
    startX: 0,
    startY: 0,
    canvas: null,
    ctx: null,
    scale: 1,
};

RC.showOcclusion = function() {
    document.getElementById('occlusionModal').style.display = 'flex';
    RC.occlusionState.rects = [];
    RC.occlusionState.image = null;
    RC.occlusionState.imageUrl = null;
    document.getElementById('occlusionPreview').innerHTML =
        '<div style="color:var(--dim);text-align:center;padding:40px">Upload or paste an image to start</div>';
    document.getElementById('occlusionRectCount').textContent = '0 regions';
};

RC.initOcclusionCanvas = function(img) {
    var container = document.getElementById('occlusionPreview');
    container.innerHTML = '';

    var canvas = document.createElement('canvas');
    var maxW = container.clientWidth - 20;
    var scale = Math.min(1, maxW / img.width);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    canvas.style.cursor = 'crosshair';
    canvas.style.borderRadius = '4px';

    RC.occlusionState.canvas = canvas;
    RC.occlusionState.ctx = canvas.getContext('2d');
    RC.occlusionState.scale = scale;
    RC.occlusionState.image = img;
    RC.occlusionState.rects = [];

    container.appendChild(canvas);
    RC.drawOcclusion();

    // Mouse events
    canvas.addEventListener('mousedown', function(e) {
        var rect = canvas.getBoundingClientRect();
        RC.occlusionState.drawing = true;
        RC.occlusionState.startX = (e.clientX - rect.left);
        RC.occlusionState.startY = (e.clientY - rect.top);
    });

    canvas.addEventListener('mousemove', function(e) {
        if (!RC.occlusionState.drawing) return;
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        RC.drawOcclusion();
        // Draw current rectangle
        var ctx = RC.occlusionState.ctx;
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
            RC.occlusionState.startX, RC.occlusionState.startY,
            x - RC.occlusionState.startX, y - RC.occlusionState.startY
        );
        ctx.setLineDash([]);
    });

    canvas.addEventListener('mouseup', function(e) {
        if (!RC.occlusionState.drawing) return;
        RC.occlusionState.drawing = false;
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        var s = RC.occlusionState.scale;
        var rx = Math.min(RC.occlusionState.startX, x) / s;
        var ry = Math.min(RC.occlusionState.startY, y) / s;
        var rw = Math.abs(x - RC.occlusionState.startX) / s;
        var rh = Math.abs(y - RC.occlusionState.startY) / s;

        // Min size 10x10 pixels
        if (rw < 10 || rh < 10) return;

        RC.occlusionState.rects.push({
            x: Math.round(rx), y: Math.round(ry),
            w: Math.round(rw), h: Math.round(rh),
            label: 'Region ' + (RC.occlusionState.rects.length + 1)
        });

        RC.drawOcclusion();
        document.getElementById('occlusionRectCount').textContent = RC.occlusionState.rects.length + ' region' + (RC.occlusionState.rects.length !== 1 ? 's' : '');
    });

    // Touch events for mobile
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        var touch = e.touches[0];
        var rect = canvas.getBoundingClientRect();
        RC.occlusionState.drawing = true;
        RC.occlusionState.startX = touch.clientX - rect.left;
        RC.occlusionState.startY = touch.clientY - rect.top;
    });

    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (!RC.occlusionState.drawing) return;
        var touch = e.touches[0];
        var rect = canvas.getBoundingClientRect();
        var x = touch.clientX - rect.left;
        var y = touch.clientY - rect.top;
        RC.drawOcclusion();
        var ctx = RC.occlusionState.ctx;
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(RC.occlusionState.startX, RC.occlusionState.startY,
            x - RC.occlusionState.startX, y - RC.occlusionState.startY);
    });

    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        if (!RC.occlusionState.drawing) return;
        RC.occlusionState.drawing = false;
        // Use last touch position
        var changedTouch = e.changedTouches[0];
        var rect = canvas.getBoundingClientRect();
        var x = changedTouch.clientX - rect.left;
        var y = changedTouch.clientY - rect.top;

        var s = RC.occlusionState.scale;
        var rx = Math.min(RC.occlusionState.startX, x) / s;
        var ry = Math.min(RC.occlusionState.startY, y) / s;
        var rw = Math.abs(x - RC.occlusionState.startX) / s;
        var rh = Math.abs(y - RC.occlusionState.startY) / s;

        if (rw < 10 || rh < 10) return;

        RC.occlusionState.rects.push({
            x: Math.round(rx), y: Math.round(ry),
            w: Math.round(rw), h: Math.round(rh),
            label: 'Region ' + (RC.occlusionState.rects.length + 1)
        });

        RC.drawOcclusion();
        document.getElementById('occlusionRectCount').textContent = RC.occlusionState.rects.length + ' region' + (RC.occlusionState.rects.length !== 1 ? 's' : '');
    });
};

RC.drawOcclusion = function() {
    var s = RC.occlusionState;
    if (!s.ctx || !s.image) return;

    s.ctx.clearRect(0, 0, s.canvas.width, s.canvas.height);
    s.ctx.drawImage(s.image, 0, 0, s.canvas.width, s.canvas.height);

    // Draw all rectangles
    for (var i = 0; i < s.rects.length; i++) {
        var r = s.rects[i];
        var x = r.x * s.scale;
        var y = r.y * s.scale;
        var w = r.w * s.scale;
        var h = r.h * s.scale;

        // Fill with semi-transparent color
        s.ctx.fillStyle = 'rgba(0, 255, 204, 0.3)';
        s.ctx.fillRect(x, y, w, h);

        // Border
        s.ctx.strokeStyle = 'rgba(0, 255, 204, 0.9)';
        s.ctx.lineWidth = 2;
        s.ctx.strokeRect(x, y, w, h);

        // Label
        s.ctx.fillStyle = '#00ffcc';
        s.ctx.font = 'bold ' + Math.max(12, 14 * s.scale) + 'px sans-serif';
        s.ctx.fillText('c' + (i + 1), x + 4, y + Math.max(14, 16 * s.scale));
    }
};

RC.undoLastRect = function() {
    if (RC.occlusionState.rects.length === 0) return;
    RC.occlusionState.rects.pop();
    RC.drawOcclusion();
    document.getElementById('occlusionRectCount').textContent = RC.occlusionState.rects.length + ' region' + (RC.occlusionState.rects.length !== 1 ? 's' : '');
};

RC.handleOcclusionImage = function(input) {
    var file = input.files[0];
    if (!file) return;
    RC.loadOcclusionFile(file);
};

RC.loadOcclusionFile = function(file) {
    if (!file.type.startsWith('image/')) {
        RC.toast('Please select an image file', 'error');
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
        RC.occlusionState.imageUrl = e.target.result;
        var img = new Image();
        img.onload = function() {
            RC.initOcclusionCanvas(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

RC.createOcclusionCards = async function() {
    var s = RC.occlusionState;
    if (!s.image || !s.rects.length) {
        RC.toast('Draw at least one region on the image', 'error');
        return;
    }
    if (!RC.currentDeckId) {
        RC.toast('No deck selected', 'error');
        return;
    }

    // Upload the image first
    var blob = await new Promise(function(resolve) {
        var tempCanvas = document.createElement('canvas');
        tempCanvas.width = s.image.width;
        tempCanvas.height = s.image.height;
        var ctx = tempCanvas.getContext('2d');
        ctx.drawImage(s.image, 0, 0);
        tempCanvas.toBlob(resolve, 'image/png');
    });

    var formData = new FormData();
    formData.append('file', blob, 'occlusion.png');
    var uploadResult;
    try {
        uploadResult = await RC.apiUpload('/media/upload', formData);
    } catch (e) {
        RC.toast('Failed to upload image: ' + e.message, 'error');
        return;
    }

    var imageUrl = uploadResult.url;

    // Build cloze text: image with occlusion regions as cloze markers
    // The front shows the image with regions. Each cloze hides one region.
    var occlusionData = JSON.stringify(s.rects.map(function(r, i) {
        return { x: r.x, y: r.y, w: r.w, h: r.h, label: r.label };
    }));

    // Create a cloze note where front contains the image + occlusion metadata
    var front = '![occlusion](' + imageUrl + ')\n\n';
    for (var i = 0; i < s.rects.length; i++) {
        front += '{{c' + (i + 1) + '::' + (s.rects[i].label || 'Region ' + (i + 1)) + '}} ';
    }

    var back = '[occlusion_data]' + occlusionData + '[/occlusion_data]';
    var tags = document.getElementById('occlusionTags').value.split(',').map(function(t) { return t.trim(); }).filter(Boolean);

    try {
        var result = await RC.api('POST', '/notes', {
            deck_id: RC.currentDeckId,
            card_type: 'cloze',
            fields: { front: front, back: back },
            tags: tags,
        });

        RC.toast(result.cards_created + ' occlusion card' + (result.cards_created !== 1 ? 's' : '') + ' created');
        document.getElementById('occlusionModal').style.display = 'none';
        RC.showDeckDetail(RC.currentDeckId);
    } catch (e) { RC.toast(e.message, 'error'); }
};

// Paste handler for occlusion modal
document.addEventListener('paste', function(e) {
    var modal = document.getElementById('occlusionModal');
    if (!modal || modal.style.display !== 'flex') return;

    var items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image/') === 0) {
            e.preventDefault();
            var file = items[i].getAsFile();
            RC.loadOcclusionFile(file);
            break;
        }
    }
});
