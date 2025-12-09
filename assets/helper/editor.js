const state = {
    textureImage: null,
    textureName: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    mode: 'uv',
    selectionBox: {
        x: 0,
        y: 0,
        width: 64,
        height: 64
    },
    collisionBox: {
        x: 0,
        y: 0,
        width: 32,
        height: 32
    },
    isDragging: false,
    dragMode: null,
    dragStartX: 0,
    dragStartY: 0,
    dragInitialBox: null,
    lastX: 0,
    lastY: 0,
    isInitialTouchScale: false,
    initialDistance: 0,
    
    cornerSize: 8,
};

const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const modeBtns = document.querySelectorAll('.mode-btn[data-mode]');
const loadTextureBtn = document.getElementById('loadTextureBtn');
const resetSelectionBtn = document.getElementById('resetSelectionBtn');
const generateBtn = document.getElementById('generateBtn');
const resetZoomBtn = document.getElementById('resetZoomBtn');

const typeNameInput = document.getElementById('typeName');
const zoffsetInput = document.getElementById('zoffset');
const textureModal = document.getElementById('textureModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const textureOptions = document.querySelectorAll('.texture-option');
const codeModal = document.getElementById('codeModal');
const generatedCode = document.getElementById('generatedCode');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const closeCodeBtn = document.getElementById('closeCodeBtn');
const closeHelpBtn = document.getElementById('closeHelpBtn');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const newMode = btn.dataset.mode;
        setMode(newMode);
    });
});

function setMode(newMode) {
    state.mode = newMode;
    
    modeBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === newMode) {
            btn.classList.add('active');
        }
    });
    
    canvas.className = `${newMode}-mode`;
    
    render();
}

loadTextureBtn.addEventListener('click', () => {
    textureModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
    textureModal.style.display = 'none';
});

textureOptions.forEach(btn => {
    btn.addEventListener('click', () => {
        const textureName = btn.dataset.texture;
        loadTexture(textureName);
        textureModal.style.display = 'none';
    });
});

canvas.addEventListener('mousedown', onCanvasMouseDown);
canvas.addEventListener('mousemove', onCanvasMouseMove);
canvas.addEventListener('mouseup', onCanvasMouseUp);
canvas.addEventListener('mousewheel', onMouseWheel, { passive: false });
canvas.addEventListener('DOMMouseScroll', onMouseWheel, { passive: false });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('touchstart', onTouchStart, { passive: false });
canvas.addEventListener('touchmove', onTouchMove, { passive: false });
canvas.addEventListener('touchend', onTouchEnd, { passive: false });

resetZoomBtn.addEventListener('click', () => {
    state.zoom = 1;
    if (state.textureImage) {
        state.panX = (canvas.width - state.textureImage.width) / 2;
        state.panY = (canvas.height - state.textureImage.height) / 2;
    }
    render();
});

resetSelectionBtn.addEventListener('click', resetSelection);
generateBtn.addEventListener('click', generateCode);
closeCodeBtn.addEventListener('click', () => {
    codeModal.style.display = 'none';
});
copyCodeBtn.addEventListener('click', copyCode);

function loadTexture(textureName) {
    const imagePath = `/assets/game/${textureName}.png`;
    
    const img = new Image();
    img.onload = function() {
        state.textureImage = img;
        state.textureName = textureName;
        state.zoom = 1;
        
        state.panX = (canvas.width - img.width) / 2;
        state.panY = (canvas.height - img.height) / 2;
        
        state.selectionBox = {
            x: Math.floor(img.width / 4),
            y: Math.floor(img.height / 4),
            width: Math.floor(img.width / 2),
            height: Math.floor(img.height / 2)
        };
        
        state.collisionBox = {
            x: Math.floor(img.width / 4),
            y: Math.floor(img.height / 4),
            width: Math.floor(img.width / 4),
            height: Math.floor(img.height / 4)
        };
        
        render();
    };
    
    img.onerror = function() {
        alert(`Error loading: ${imagePath}`);
    };
    
    img.src = imagePath;
}

function getCornerAtPoint(box, screenX, screenY) {
    if (!state.textureImage) return null;
    
    const rect = canvas.getBoundingClientRect();
    const screenPoint = screenToWorld(screenX, screenY);
    
    const threshold = state.cornerSize / state.zoom;
    
    const corners = [
        { name: 'tl', x: box.x, y: box.y },
        { name: 'tr', x: box.x + box.width, y: box.y },
        { name: 'bl', x: box.x, y: box.y + box.height },
        { name: 'br', x: box.x + box.width, y: box.y + box.height }
    ];
    
    for (let corner of corners) {
        const dist = Math.sqrt(
            Math.pow(screenPoint.x - corner.x, 2) +
            Math.pow(screenPoint.y - corner.y, 2)
        );
        if (dist < threshold) {
            return corner.name;
        }
    }
    
    return null;
}

function isPointInBox(box, screenX, screenY) {
    const point = screenToWorld(screenX, screenY);
    return point.x >= box.x && point.x <= box.x + box.width &&
           point.y >= box.y && point.y <= box.y + box.height;
}

function screenToWorld(screenX, screenY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (screenX - rect.left - state.panX) / state.zoom,
        y: (screenY - rect.top - state.panY) / state.zoom
    };
}

function onCanvasMouseDown(e) {
    if (!state.textureImage) return;
    
    if (state.mode === 'move') {
        state.isDragging = true;
        state.lastX = e.clientX;
        state.lastY = e.clientY;
        canvas.classList.add('dragging');
    } else if (state.mode === 'zoomin') {
        zoomAtPoint(1.3, e.clientX, e.clientY);
    } else if (state.mode === 'zoomout') {
        zoomAtPoint(0.77, e.clientX, e.clientY);
    } else if (state.mode === 'uv' || state.mode === 'collision') {
        const box = state.mode === 'uv' ? state.selectionBox : state.collisionBox;
        const corner = getCornerAtPoint(box, e.clientX, e.clientY);
        
        state.dragInitialBox = {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height
        };
        
        state.dragStartX = e.clientX;
        state.dragStartY = e.clientY;
        
        if (corner) {
            state.isDragging = true;
            state.dragMode = `corner-${corner}`;
        } else if (isPointInBox(box, e.clientX, e.clientY)) {
            state.isDragging = true;
            state.dragMode = 'move';
        }
    }
}

function onCanvasMouseMove(e) {
    if (!state.textureImage) return;
    
    if (state.isDragging) {
        if (state.mode === 'move') {
            const dx = e.clientX - state.lastX;
            const dy = e.clientY - state.lastY;
            
            state.panX += dx;
            state.panY += dy;
            
            state.lastX = e.clientX;
            state.lastY = e.clientY;
        } else if (state.mode === 'uv' || state.mode === 'collision') {
            handleBoxDrag(e.clientX, e.clientY);
        }
        
        render();
    } else if (state.mode === 'uv' || state.mode === 'collision') {
        const box = state.mode === 'uv' ? state.selectionBox : state.collisionBox;
        const corner = getCornerAtPoint(box, e.clientX, e.clientY);
        
        if (corner) {
            if (corner === 'tl' || corner === 'br') {
                canvas.style.cursor = 'nwse-resize';
            } else {
                canvas.style.cursor = 'nesw-resize';
            }
        } else if (isPointInBox(box, e.clientX, e.clientY)) {
            canvas.style.cursor = 'grab';
        } else {
            canvas.style.cursor = 'crosshair';
        }
    }
}

function onCanvasMouseUp(e) {
    state.isDragging = false;
    state.dragMode = null;
    state.dragInitialBox = null;
    canvas.classList.remove('dragging');
    if (state.mode === 'uv' || state.mode === 'collision') {
        canvas.style.cursor = 'crosshair';
    }
}

function handleBoxDrag(screenX, screenY) {
    const box = state.mode === 'uv' ? state.selectionBox : state.collisionBox;
    const initialBox = state.dragInitialBox;
    
    const screenDx = screenX - state.dragStartX;
    const screenDy = screenY - state.dragStartY;
    
    const worldDx = screenDx / state.zoom;
    const worldDy = screenDy / state.zoom;
    
    if (state.dragMode === 'move') {
        box.x = Math.round(initialBox.x + worldDx);
        box.y = Math.round(initialBox.y + worldDy);
        
        if (box.x < 0) box.x = 0;
        if (box.y < 0) box.y = 0;
        if (box.x + box.width > state.textureImage.width) {
            box.x = state.textureImage.width - box.width;
        }
        if (box.y + box.height > state.textureImage.height) {
            box.y = state.textureImage.height - box.height;
        }
    } else if (state.dragMode && state.dragMode.startsWith('corner-')) {
        const corner = state.dragMode.replace('corner-', '');
        const roundedDx = Math.round(worldDx);
        const roundedDy = Math.round(worldDy);
        
        if (corner === 'tl') {
            box.x = Math.round(initialBox.x + roundedDx);
            box.y = Math.round(initialBox.y + roundedDy);
            box.width = Math.round(initialBox.width - roundedDx);
            box.height = Math.round(initialBox.height - roundedDy);
        } else if (corner === 'tr') {
            box.y = Math.round(initialBox.y + roundedDy);
            box.width = Math.round(initialBox.width + roundedDx);
            box.height = Math.round(initialBox.height - roundedDy);
        } else if (corner === 'bl') {
            box.x = Math.round(initialBox.x + roundedDx);
            box.width = Math.round(initialBox.width - roundedDx);
            box.height = Math.round(initialBox.height + roundedDy);
        } else if (corner === 'br') {
            box.width = Math.round(initialBox.width + roundedDx);
            box.height = Math.round(initialBox.height + roundedDy);
        }
        
        if (box.width < 1) box.width = 1;
        if (box.height < 1) box.height = 1;
        
        if (box.x < 0) box.x = 0;
        if (box.y < 0) box.y = 0;
        if (box.x + box.width > state.textureImage.width) {
            box.x = state.textureImage.width - box.width;
        }
        if (box.y + box.height > state.textureImage.height) {
            box.y = state.textureImage.height - box.height;
        }
    }
}

function onMouseWheel(e) {
    if (!state.textureImage) return;
    e.preventDefault();
    
    const delta = e.deltaY || e.detail;
    const zoomFactor = delta > 0 ? 0.9 : 1.1;
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    zoomAtPoint(zoomFactor, centerX, centerY);
}

function zoomAtPoint(factor, screenX, screenY) {
    const centerScreenX = canvas.width / 2;
    const centerScreenY = canvas.height / 2;
    
    const centerWorldX = (centerScreenX - state.panX) / state.zoom;
    const centerWorldY = (centerScreenY - state.panY) / state.zoom;
    
    state.zoom *= factor;
    state.zoom = Math.max(0.1, Math.min(5, state.zoom));
    
    state.panX = centerScreenX - centerWorldX * state.zoom;
    state.panY = centerScreenY - centerWorldY * state.zoom;
    
    render();
}

function onTouchStart(e) {
    if (!state.textureImage) return;
    
    if (e.touches.length === 1) {
        if (state.mode === 'move') {
            state.isDragging = true;
            state.lastX = e.touches[0].clientX;
            state.lastY = e.touches[0].clientY;
        } else if (state.mode === 'zoomin' || state.mode === 'zoomout') {
            state.isDragging = true;
        } else if (state.mode === 'uv' || state.mode === 'collision') {
            const box = state.mode === 'uv' ? state.selectionBox : state.collisionBox;
            const corner = getCornerAtPoint(box, e.touches[0].clientX, e.touches[0].clientY);
            
            state.dragInitialBox = {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height
            };
            
            state.dragStartX = e.touches[0].clientX;
            state.dragStartY = e.touches[0].clientY;
            
            if (corner) {
                state.isDragging = true;
                state.dragMode = `corner-${corner}`;
            } else if (isPointInBox(box, e.touches[0].clientX, e.touches[0].clientY)) {
                state.isDragging = true;
                state.dragMode = 'move';
            }
        }
    } else if (e.touches.length === 2) {
        state.isInitialTouchScale = true;
        state.initialDistance = getTouchDistance(e.touches[0], e.touches[1]);
    }
}

function onTouchMove(e) {
    if (!state.textureImage) return;
    e.preventDefault();
    
    if (e.touches.length === 1 && state.isDragging) {
        if (state.mode === 'move') {
            const dx = e.touches[0].clientX - state.lastX;
            const dy = e.touches[0].clientY - state.lastY;
            
            state.panX += dx;
            state.panY += dy;
            
            state.lastX = e.touches[0].clientX;
            state.lastY = e.touches[0].clientY;
        } else if (state.mode === 'uv' || state.mode === 'collision') {
            handleBoxDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
        
        render();
    } else if (e.touches.length === 2 && state.isInitialTouchScale) {
        const distance = getTouchDistance(e.touches[0], e.touches[1]);
        const delta = distance - state.initialDistance;
        
        if (Math.abs(delta) > 5) {
            const factor = 1 + delta * 0.005;
            
            const rect = canvas.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            zoomAtPoint(factor, centerX, centerY);
            state.initialDistance = distance;
        }
    }
}

function onTouchEnd(e) {
    state.isDragging = false;
    state.dragMode = null;
    state.dragInitialBox = null;
    state.isInitialTouchScale = false;
}

function getTouchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function resetSelection() {
    if (state.textureImage) {
        const visibleWidth = canvas.width / state.zoom;
        const visibleHeight = canvas.height / state.zoom;
        
        const boxWidth = Math.floor(visibleWidth * 0.9);
        const boxHeight = Math.floor(visibleHeight * 0.9);
        
        const centerWorldX = (canvas.width / 2 - state.panX) / state.zoom;
        const centerWorldY = (canvas.height / 2 - state.panY) / state.zoom;
        
        const boxX = Math.floor(centerWorldX - boxWidth / 2);
        const boxY = Math.floor(centerWorldY - boxHeight / 2);
        
        state.selectionBox = {
            x: boxX,
            y: boxY,
            width: boxWidth,
            height: boxHeight
        };
        
        state.collisionBox = {
            x: boxX,
            y: boxY,
            width: Math.floor(boxWidth / 2),
            height: Math.floor(boxHeight / 2)
        };
    }
    render();
}

function render() {
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!state.textureImage) {
        ctx.fillStyle = '#555';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Load a texture to begin', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    ctx.save();
    
    ctx.translate(state.panX, state.panY);
    ctx.scale(state.zoom, state.zoom);
    
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(state.textureImage, 0, 0);
    
    if (state.mode === 'uv') {
        drawSelectableBox(state.selectionBox, '#707070');
    } else if (state.mode === 'collision') {
        drawSelectableBox(state.collisionBox, '#909090');
        drawSelectableBox(state.selectionBox, '#606060', 0.1);
    }
    
    ctx.restore();
}

function drawSelectableBox(box, color, alpha = 0.3) {
    const width = box.width;
    const height = box.height;
    
    const hex = color.substring(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.fillRect(box.x, box.y, width, height);
    
    const cornerSize = Math.max(4, state.cornerSize / state.zoom);
    ctx.fillStyle = color;
    
    ctx.fillRect(box.x - cornerSize / 2, box.y - cornerSize / 2, cornerSize, cornerSize);
    
    ctx.fillRect(box.x + width - cornerSize / 2, box.y - cornerSize / 2, cornerSize, cornerSize);
    
    ctx.fillRect(box.x - cornerSize / 2, box.y + height - cornerSize / 2, cornerSize, cornerSize);
    
    ctx.fillRect(box.x + width - cornerSize / 2, box.y + height - cornerSize / 2, cornerSize, cornerSize);
}



function generateCode() {
    if (state.mode === 'uv') {
        const box = state.selectionBox;
        
        if (box.width < 1 || box.height < 1) {
            alert('Invalid UV selection size');
            return;
        }
    }
    
    if (state.mode === 'collision') {
        const box = state.collisionBox;
        
        if (box.width < 1 || box.height < 1) {
            alert('Invalid collision selection size');
            return;
        }
    }
    
    const uvBox = state.selectionBox;
    const collisionBox = state.collisionBox;
    
    const typeName = typeNameInput.value.trim() || '1';
    const zoffset = parseInt(zoffsetInput.value) || 5;
    
    const collisionOffsetX = Math.floor(collisionBox.x - uvBox.x);
    const collisionOffsetY = Math.floor(collisionBox.y - uvBox.y);
    
    const code = `{
  name: '${typeName}',
  uvStartPx: { u: ${Math.floor(uvBox.x)}, v: ${Math.floor(uvBox.y)} },
  widthPx: ${Math.floor(uvBox.width)},
  heightPx: ${Math.floor(uvBox.height)},
  zoffset: ${zoffset},
  collision: { startx: ${collisionOffsetX}, starty: ${collisionOffsetY}, width: ${Math.floor(collisionBox.width)}, height: ${Math.floor(collisionBox.height)} }
}`;
    
    generatedCode.textContent = code;
    codeModal.style.display = 'flex';
}

function copyCode() {
    const code = generatedCode.textContent;
    navigator.clipboard.writeText(code).then(() => {
        const btn = copyCodeBtn;
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}
