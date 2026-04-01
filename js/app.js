// FluxoMod - Main Application Controller
'use strict';

class FluxoModApp {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.shapes = [];
        this.connectors = [];
        this.projectName = 'Sem título';
        this.currentTool = 'select';
        this.viewport = { x: 0, y: 0, zoom: 1, width: 0, height: 0 };
        this.grid = new Grid();
        this.history = new HistoryManager();
        this.selection = new SelectionManager(this);
        this.clipboard = new ClipboardManager(this);
        this.shortcuts = new ShortcutManager(this);
        this.storage = new StorageManager(this);
        this.minimap = new Minimap(this);
        this.isPanning = false;
        this.isSpacePanning = false;
        this.panStart = null;
        this.drawingShape = null;
        this.drawingConnector = null;
        this.smartGuides = null;
        this.mouseWorld = { x: 0, y: 0 };
        this.editingText = null;
        this._rafId = null;
    }

    init() {
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        this.minimap.init();
        this.buildShapeLibrary();
        this.bindEvents();
        this.history.onChange = () => this.updateToolbarState();

        if (this.storage.hasAutoSave()) {
            this.storage.loadAutoSave();
        }
        this.storage.startAutoSave(15000);
        this.updateTitle();
        this.updateToolbarState();
        this.render();

        // Show welcome modal on first use
        if (!localStorage.getItem('fluxomod_welcomed')) {
            this.showTemplateDialog();
            localStorage.setItem('fluxomod_welcomed', '1');
        }
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = container.clientWidth * dpr;
        this.canvas.height = container.clientHeight * dpr;
        this.canvas.style.width = container.clientWidth + 'px';
        this.canvas.style.height = container.clientHeight + 'px';
        this.viewport.width = container.clientWidth;
        this.viewport.height = container.clientHeight;
        this.ctx.scale(dpr, dpr);
        this.render();
    }

    bindEvents() {
        window.addEventListener('resize', Utils.debounce(() => this.resizeCanvas(), 100));
        document.addEventListener('keydown', (e) => this.shortcuts.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.onDblClick(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        this.canvas.addEventListener('contextmenu', (e) => this.onContextMenu(e));
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#context-menu')) this.closeContextMenu();
            if (!e.target.closest('.dropdown-menu') && !e.target.closest('.menu-btn[data-menu]'))
                this.closeAllDropdowns();
        });

        // Drag and drop from shape library
        document.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => this.onDrop(e));
    }

    screenToWorld(sx, sy) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (sx - rect.left) / this.viewport.zoom + this.viewport.x,
            y: (sy - rect.top) / this.viewport.zoom + this.viewport.y
        };
    }

    worldToScreen(wx, wy) {
        return {
            x: (wx - this.viewport.x) * this.viewport.zoom,
            y: (wy - this.viewport.y) * this.viewport.zoom
        };
    }

    onMouseDown(e) {
        const world = this.screenToWorld(e.clientX, e.clientY);
        this.mouseWorld = world;

        if (e.button === 1 || (e.button === 0 && this.currentTool === 'pan')) {
            this.isPanning = true;
            this.panStart = { x: e.clientX, y: e.clientY, vx: this.viewport.x, vy: this.viewport.y };
            return;
        }

        if (e.button !== 0) return;

        switch (this.currentTool) {
            case 'select': this.onSelectDown(world, e); break;
            case 'connector': this.onConnectorDown(world); break;
            case 'text': this.onTextDown(world); break;
            default:
                if (this.currentTool.startsWith('shape:')) {
                    this.onShapeDrawDown(world);
                }
                break;
        }
    }

    onMouseMove(e) {
        const world = this.screenToWorld(e.clientX, e.clientY);
        this.mouseWorld = world;
        this.updateCursorPosition(world);

        if (this.isPanning) {
            const dx = e.clientX - this.panStart.x;
            const dy = e.clientY - this.panStart.y;
            this.viewport.x = this.panStart.vx - dx / this.viewport.zoom;
            this.viewport.y = this.panStart.vy - dy / this.viewport.zoom;
            this.render();
            return;
        }

        if (this.isSpacePanning && this.panStart) {
            const dx = e.clientX - this.panStart.x;
            const dy = e.clientY - this.panStart.y;
            this.viewport.x = this.panStart.vx - dx / this.viewport.zoom;
            this.viewport.y = this.panStart.vy - dy / this.viewport.zoom;
            this.panStart.x = e.clientX;
            this.panStart.y = e.clientY;
            this.panStart.vx = this.viewport.x;
            this.panStart.vy = this.viewport.y;
            this.render();
            return;
        }

        switch (this.currentTool) {
            case 'select': this.onSelectMove(world, e); break;
            case 'connector': this.onConnectorMove(world); break;
            default:
                if (this.currentTool.startsWith('shape:') && this.drawingShape) {
                    this.onShapeDrawMove(world);
                }
                break;
        }
    }

    onMouseUp(e) {
        const world = this.screenToWorld(e.clientX, e.clientY);

        if (this.isPanning) {
            this.isPanning = false;
            this.panStart = null;
            return;
        }

        switch (this.currentTool) {
            case 'select': this.onSelectUp(world); break;
            case 'connector': this.onConnectorUp(world); break;
            default:
                if (this.currentTool.startsWith('shape:') && this.drawingShape) {
                    this.onShapeDrawUp(world);
                }
                break;
        }
    }

    onDblClick(e) {
        const world = this.screenToWorld(e.clientX, e.clientY);
        const shape = this.getShapeAtPoint(world.x, world.y);
        if (shape) this.startTextEdit(shape);
    }

    onWheel(e) {
        e.preventDefault();
        const world = this.screenToWorld(e.clientX, e.clientY);
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Utils.clamp(this.viewport.zoom * delta, 0.1, 5);
        this.viewport.x = world.x - (world.x - this.viewport.x) * (newZoom / this.viewport.zoom);
        this.viewport.y = world.y - (world.y - this.viewport.y) * (newZoom / this.viewport.zoom);
        this.viewport.zoom = newZoom;
        this.updateZoomDisplay();
        this.render();
    }

    onKeyUp(e) {
        if (e.key === ' ') {
            this.isSpacePanning = false;
            this.panStart = null;
            this.canvas.parentElement.classList.remove('tool-pan');
        }
    }

    onContextMenu(e) {
        e.preventDefault();
        const world = this.screenToWorld(e.clientX, e.clientY);
        const shape = this.getShapeAtPoint(world.x, world.y);
        if (shape && !this.selection.selectedShapes.includes(shape)) {
            this.selection.selectShape(shape);
        }
        this.showContextMenu(e.clientX, e.clientY);
    }

    onDrop(e) {
        e.preventDefault();
        const shapeType = e.dataTransfer.getData('shape-type');
        if (!shapeType) return;
        const world = this.screenToWorld(e.clientX, e.clientY);
        const snapped = this.grid.snapPoint(world.x, world.y);
        const shape = new Shape(shapeType, snapped.x - 70, snapped.y - 40);
        const snap = StateSnapshot.capture(this);
        this.shapes.push(shape);
        this.history.push({ type: 'add', description: 'Adicionar forma', before: snap, after: StateSnapshot.capture(this) });
        this.selection.selectShape(shape);
        this.render();
    }

    // === SELECT TOOL ===
    onSelectDown(world, e) {
        const handle = this.selection.getHandleAtPoint(world.x, world.y);
        if (handle) {
            if (handle.id === 'rotate') {
                this.selection.isRotating = true;
                this.selection.dragStart = { x: world.x, y: world.y, origRotation: this.selection.selectedShapes[0].rotation };
            } else {
                this.selection.isResizing = true;
                this.selection.resizeHandle = handle;
                const s = this.selection.selectedShapes[0];
                this.selection.dragStart = { x: world.x, y: world.y, origX: s.x, origY: s.y, origW: s.width, origH: s.height };
            }
            this._beforeDragSnapshot = StateSnapshot.capture(this);
            return;
        }

        // Check connector ports for creating connections
        const port = this.selection.getPortAtPoint(world.x, world.y);
        if (port) {
            this.setTool('connector');
            this.onConnectorDown(world);
            return;
        }

        const shape = this.getShapeAtPoint(world.x, world.y);
        const conn = this.getConnectorAtPoint(world.x, world.y);

        if (shape) {
            if (e.shiftKey) {
                this.selection.selectShape(shape, true);
            } else if (!this.selection.selectedShapes.includes(shape)) {
                this.selection.selectShape(shape);
            }
            this.selection.isMoving = true;
            this.selection.dragStart = { x: world.x, y: world.y, positions: this.selection.selectedShapes.map(s => ({ x: s.x, y: s.y })) };
            this._beforeDragSnapshot = StateSnapshot.capture(this);
        } else if (conn) {
            this.selection.selectConnector(conn, e.shiftKey);
        } else {
            this.selection.clearSelection();
            this.selection.selectionRect = { x: world.x, y: world.y, width: 0, height: 0, startX: world.x, startY: world.y };
        }
        this.render();
    }

    onSelectMove(world) {
        if (this.selection.isMoving && this.selection.dragStart) {
            const dx = world.x - this.selection.dragStart.x;
            const dy = world.y - this.selection.dragStart.y;
            this.selection.selectedShapes.forEach((shape, i) => {
                const orig = this.selection.dragStart.positions[i];
                if (this.grid.snapEnabled) {
                    shape.x = this.grid.snap(orig.x + dx);
                    shape.y = this.grid.snap(orig.y + dy);
                } else {
                    shape.x = orig.x + dx;
                    shape.y = orig.y + dy;
                }
                shape.ports = shape.calculatePorts();
            });
            if (this.selection.selectedShapes.length === 1) {
                this.smartGuides = this.grid.getSmartGuides(this.selection.selectedShapes[0], this.shapes);
            }
            this.render();
        } else if (this.selection.isResizing && this.selection.dragStart) {
            this.resizeShape(world);
            this.render();
        } else if (this.selection.isRotating && this.selection.dragStart) {
            const shape = this.selection.selectedShapes[0];
            const center = shape.getCenter();
            const startAngle = Math.atan2(this.selection.dragStart.y - center.y, this.selection.dragStart.x - center.x);
            const curAngle = Math.atan2(world.y - center.y, world.x - center.x);
            let deg = this.selection.dragStart.origRotation + Utils.radToDeg(curAngle - startAngle);
            if (Math.abs(deg % 15) < 3) deg = Math.round(deg / 15) * 15;
            shape.rotation = deg;
            this.render();
        } else if (this.selection.selectionRect) {
            const r = this.selection.selectionRect;
            r.x = Math.min(r.startX, world.x);
            r.y = Math.min(r.startY, world.y);
            r.width = Math.abs(world.x - r.startX);
            r.height = Math.abs(world.y - r.startY);
            this.render();
        }

        this.updateCursorForHandle(world);
    }

    onSelectUp(world) {
        if ((this.selection.isMoving || this.selection.isResizing || this.selection.isRotating) && this._beforeDragSnapshot) {
            this.history.push({ type: 'move', description: 'Mover/Redimensionar', before: this._beforeDragSnapshot, after: StateSnapshot.capture(this) });
            this._beforeDragSnapshot = null;
        }

        if (this.selection.selectionRect && this.selection.selectionRect.width > 2) {
            const r = this.selection.selectionRect;
            this.shapes.forEach(shape => {
                if (Utils.rectIntersectsRect(r, shape.getBounds())) {
                    this.selection.selectShape(shape, true);
                }
            });
        }

        this.selection.isMoving = false;
        this.selection.isResizing = false;
        this.selection.isRotating = false;
        this.selection.selectionRect = null;
        this.selection.dragStart = null;
        this.smartGuides = null;
        this.render();
    }

    resizeShape(world) {
        const s = this.selection.selectedShapes[0];
        const d = this.selection.dragStart;
        const h = this.selection.resizeHandle.id;
        let nx = d.origX, ny = d.origY, nw = d.origW, nh = d.origH;
        const dx = world.x - d.x, dy = world.y - d.y;

        if (h.includes('e')) nw = Math.max(20, d.origW + dx);
        if (h.includes('w')) { nw = Math.max(20, d.origW - dx); nx = d.origX + d.origW - nw; }
        if (h.includes('s')) nh = Math.max(20, d.origH + dy);
        if (h.includes('n')) { nh = Math.max(20, d.origH - dy); ny = d.origY + d.origH - nh; }

        if (this.grid.snapEnabled) { nx = this.grid.snap(nx); ny = this.grid.snap(ny); nw = this.grid.snap(nw); nh = this.grid.snap(nh); }
        s.x = nx; s.y = ny; s.width = nw; s.height = nh;
        s.ports = s.calculatePorts();
    }

    // === CONNECTOR TOOL ===
    onConnectorDown(world) {
        const port = this.selection.getPortAtPoint(world.x, world.y);
        const connType = document.getElementById('connector-type')?.value || 'elbow';
        this.drawingConnector = new Connector({ type: connType, sourcePoint: { ...world } });
        if (port) {
            this.drawingConnector.sourceId = port.shape.id;
            this.drawingConnector.sourcePort = port.port.id;
        }
    }

    onConnectorMove(world) {
        if (this.drawingConnector) {
            this.drawingConnector.targetPoint = { ...world };
            this.render();
        }
    }

    onConnectorUp(world) {
        if (!this.drawingConnector) return;
        const port = this.selection.getPortAtPoint(world.x, world.y);
        if (port) {
            this.drawingConnector.targetId = port.shape.id;
            this.drawingConnector.targetPort = port.port.id;
        } else {
            this.drawingConnector.targetPoint = { ...world };
        }

        if (this.drawingConnector.sourceId || this.drawingConnector.targetId ||
            (this.drawingConnector.sourcePoint && this.drawingConnector.targetPoint &&
             Utils.distance(this.drawingConnector.sourcePoint.x, this.drawingConnector.sourcePoint.y,
                          this.drawingConnector.targetPoint.x, this.drawingConnector.targetPoint.y) > 10)) {
            const snap = StateSnapshot.capture(this);
            this.connectors.push(this.drawingConnector);
            this.history.push({ type: 'add', description: 'Adicionar conector', before: snap, after: StateSnapshot.capture(this) });
        }
        this.drawingConnector = null;
        this.setTool('select');
        this.render();
    }

    // === SHAPE DRAWING TOOL ===
    onShapeDrawDown(world) {
        const type = this.currentTool.replace('shape:', '');
        const snapped = this.grid.snapPoint(world.x, world.y);
        this.drawingShape = new Shape(type, snapped.x, snapped.y, 0, 0);
        this.drawingShape._startX = snapped.x;
        this.drawingShape._startY = snapped.y;
    }

    onShapeDrawMove(world) {
        if (!this.drawingShape) return;
        const snapped = this.grid.snapPoint(world.x, world.y);
        this.drawingShape.x = Math.min(this.drawingShape._startX, snapped.x);
        this.drawingShape.y = Math.min(this.drawingShape._startY, snapped.y);
        this.drawingShape.width = Math.abs(snapped.x - this.drawingShape._startX);
        this.drawingShape.height = Math.abs(snapped.y - this.drawingShape._startY);
        this.render();
    }

    onShapeDrawUp() {
        if (!this.drawingShape) return;
        if (this.drawingShape.width < 5 || this.drawingShape.height < 5) {
            this.drawingShape.width = this.drawingShape.getDefaultWidth();
            this.drawingShape.height = this.drawingShape.getDefaultHeight();
        }
        this.drawingShape.ports = this.drawingShape.calculatePorts();
        delete this.drawingShape._startX;
        delete this.drawingShape._startY;

        const snap = StateSnapshot.capture(this);
        this.shapes.push(this.drawingShape);
        this.history.push({ type: 'add', description: 'Adicionar forma', before: snap, after: StateSnapshot.capture(this) });
        this.selection.selectShape(this.drawingShape);
        this.drawingShape = null;
        this.setTool('select');
        this.render();
    }

    // === TEXT TOOL ===
    onTextDown(world) {
        const shape = this.getShapeAtPoint(world.x, world.y);
        if (shape) {
            this.startTextEdit(shape);
        } else {
            const snapped = this.grid.snapPoint(world.x, world.y);
            const textShape = new Shape('text', snapped.x, snapped.y, 150, 40, { text: '', style: { fillColor: 'transparent', strokeColor: 'transparent', strokeWidth: 0 } });
            const snap = StateSnapshot.capture(this);
            this.shapes.push(textShape);
            this.history.push({ type: 'add', description: 'Adicionar texto', before: snap, after: StateSnapshot.capture(this) });
            this.startTextEdit(textShape);
        }
        this.setTool('select');
    }

    startTextEdit(shape) {
        const editor = document.getElementById('text-editor');
        const textarea = editor.querySelector('textarea');
        const screenPos = this.worldToScreen(shape.x, shape.y);

        editor.style.display = 'block';
        editor.style.left = screenPos.x + 'px';
        editor.style.top = screenPos.y + 'px';
        textarea.style.width = (shape.width * this.viewport.zoom) + 'px';
        textarea.style.height = (shape.height * this.viewport.zoom) + 'px';
        textarea.style.fontSize = (shape.style.fontSize * this.viewport.zoom) + 'px';
        textarea.style.textAlign = shape.style.textAlign;
        textarea.style.color = shape.style.textColor;
        textarea.value = shape.text;
        textarea.focus();
        textarea.select();
        this.editingText = shape;

        const finishEdit = () => {
            const snap = StateSnapshot.capture(this);
            shape.text = textarea.value;
            editor.style.display = 'none';
            this.editingText = null;
            this.history.push({ type: 'edit', description: 'Editar texto', before: snap, after: StateSnapshot.capture(this) });
            this.render();
            textarea.removeEventListener('blur', finishEdit);
            textarea.removeEventListener('keydown', onKey);
        };

        const onKey = (e) => {
            if (e.key === 'Escape') finishEdit();
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishEdit(); }
        };

        textarea.addEventListener('blur', finishEdit);
        textarea.addEventListener('keydown', onKey);
    }

    // === QUERIES ===
    getShapeAtPoint(x, y) {
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            if (this.shapes[i].visible && this.shapes[i].containsPoint(x, y)) return this.shapes[i];
        }
        return null;
    }

    getConnectorAtPoint(x, y) {
        for (let i = this.connectors.length - 1; i >= 0; i--) {
            if (this.connectors[i].visible && this.connectors[i].containsPoint(x, y, this.shapes)) return this.connectors[i];
        }
        return null;
    }

    // === TOOL MANAGEMENT ===
    setTool(tool) {
        this.currentTool = tool;
        const container = this.canvas.parentElement;
        container.className = 'tool-' + (tool === 'pan' ? 'pan' : tool === 'connector' ? 'connector' : tool === 'text' ? 'text' : tool.startsWith('shape:') ? 'shape' : 'select');
        container.id = 'canvas-container';
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
    }

    // === ZOOM ===
    zoomIn() { this.setZoom(this.viewport.zoom * 1.2); }
    zoomOut() { this.setZoom(this.viewport.zoom / 1.2); }
    zoomReset() { this.setZoom(1); }

    setZoom(z) {
        const cx = this.viewport.x + this.viewport.width / this.viewport.zoom / 2;
        const cy = this.viewport.y + this.viewport.height / this.viewport.zoom / 2;
        this.viewport.zoom = Utils.clamp(z, 0.1, 5);
        this.viewport.x = cx - this.viewport.width / this.viewport.zoom / 2;
        this.viewport.y = cy - this.viewport.height / this.viewport.zoom / 2;
        this.updateZoomDisplay();
        this.render();
    }

    zoomToFit() {
        if (this.shapes.length === 0) return;
        const b = Utils.getBoundingBox(this.shapes);
        const p = 60;
        const zx = this.viewport.width / (b.width + p * 2);
        const zy = this.viewport.height / (b.height + p * 2);
        this.viewport.zoom = Utils.clamp(Math.min(zx, zy), 0.1, 2);
        this.viewport.x = b.x - (this.viewport.width / this.viewport.zoom - b.width) / 2;
        this.viewport.y = b.y - (this.viewport.height / this.viewport.zoom - b.height) / 2;
        this.updateZoomDisplay();
        this.render();
    }

    updateZoomDisplay() {
        const el = document.getElementById('zoom-value');
        if (el) el.textContent = Math.round(this.viewport.zoom * 100) + '%';
    }

    // === HISTORY ===
    undo() {
        const action = this.history.undo();
        if (action) { if (action.before) StateSnapshot.restore(this, action.before); this.selection.clearSelection(); this.render(); }
    }

    redo() {
        const action = this.history.redo();
        if (action) { if (action.after) StateSnapshot.restore(this, action.after); this.selection.clearSelection(); this.render(); }
    }

    // === OPERATIONS ===
    duplicateSelected() {
        if (this.selection.selectedShapes.length === 0) return;
        const snap = StateSnapshot.capture(this);
        const newShapes = this.selection.selectedShapes.map(s => { const c = s.clone(); this.shapes.push(c); return c; });
        this.history.push({ type: 'duplicate', description: 'Duplicar', before: snap, after: StateSnapshot.capture(this) });
        this.selection.clearSelection();
        newShapes.forEach(s => this.selection.selectShape(s, true));
        this.render();
    }

    alignShapes(dir) {
        if (this.selection.selectedShapes.length < 2) return;
        const snap = StateSnapshot.capture(this);
        AlignManager.align(this.selection.selectedShapes, dir);
        this.history.push({ type: 'align', description: 'Alinhar', before: snap, after: StateSnapshot.capture(this) });
        this.render();
    }

    bringForward() { this.reorder('forward'); }
    sendBackward() { this.reorder('backward'); }
    bringToFront() { this.reorder('front'); }
    sendToBack() { this.reorder('back'); }

    reorder(dir) {
        if (this.selection.selectedShapes.length !== 1) return;
        const s = this.selection.selectedShapes[0];
        const i = this.shapes.indexOf(s);
        if (i < 0) return;
        const snap = StateSnapshot.capture(this);
        this.shapes.splice(i, 1);
        if (dir === 'forward') this.shapes.splice(Math.min(i + 1, this.shapes.length), 0, s);
        else if (dir === 'backward') this.shapes.splice(Math.max(i - 1, 0), 0, s);
        else if (dir === 'front') this.shapes.push(s);
        else this.shapes.unshift(s);
        this.history.push({ type: 'reorder', description: 'Reordenar', before: snap, after: StateSnapshot.capture(this) });
        this.render();
    }

    toggleGrid() { this.grid.visible = !this.grid.visible; this.render(); }
    toggleRulers() { this.grid.showRulers = !this.grid.showRulers; this.render(); }

    // === FILE OPS ===
    newProject() {
        if (this.shapes.length > 0 && !confirm('Criar novo diagrama? As alterações não salvas serão perdidas.')) return;
        this.shapes = []; this.connectors = []; this.projectName = 'Sem título';
        this.history.clear(); this.selection.clearSelection(); this.viewport = { x: 0, y: 0, zoom: 1, width: this.viewport.width, height: this.viewport.height };
        this.updateTitle(); this.render();
    }

    saveProject() { this.storage.saveProject(); this.storage.autoSave(); this.clipboard.showToast('Projeto salvo!'); }
    saveProjectAs() {
        const name = prompt('Nome do projeto:', this.projectName);
        if (name) { this.projectName = name; this.saveProject(); }
    }

    openProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.fluxo,.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => ExportManager.importJSON(this, ev.target.result);
            reader.readAsText(file);
        };
        input.click();
    }

    updateTitle() {
        const el = document.getElementById('project-name');
        if (el) el.textContent = this.projectName;
        document.title = this.projectName + ' — FluxoMod';
    }

    updateToolbarState() {
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');
        if (undoBtn) undoBtn.style.opacity = this.history.canUndo() ? '1' : '0.4';
        if (redoBtn) redoBtn.style.opacity = this.history.canRedo() ? '1' : '0.4';
    }

    updatePropertyPanel() {
        const panel = document.getElementById('prop-content');
        if (!panel) return;
        if (this.selection.selectedShapes.length === 1) {
            const s = this.selection.selectedShapes[0];
            panel.innerHTML = this.buildPropertyHTML(s);
            this.bindPropertyEvents(s);
        } else if (this.selection.selectedShapes.length > 1) {
            panel.innerHTML = `<div class="prop-group"><div class="prop-group-title">Seleção Múltipla</div><p style="font-size:12px;color:var(--text-muted)">${this.selection.selectedShapes.length} formas selecionadas</p></div>`;
        } else {
            panel.innerHTML = `<div class="prop-group"><div class="prop-group-title">Propriedades</div><p style="font-size:12px;color:var(--text-muted)">Selecione um elemento para editar suas propriedades</p></div>`;
        }
    }

    buildPropertyHTML(s) {
        return `
        <div class="prop-group"><div class="prop-group-title">Posição & Tamanho</div>
            <div class="prop-row"><span class="prop-label">X</span><input class="prop-input" id="prop-x" type="number" value="${Math.round(s.x)}"></div>
            <div class="prop-row"><span class="prop-label">Y</span><input class="prop-input" id="prop-y" type="number" value="${Math.round(s.y)}"></div>
            <div class="prop-row"><span class="prop-label">Larg.</span><input class="prop-input" id="prop-w" type="number" value="${Math.round(s.width)}"></div>
            <div class="prop-row"><span class="prop-label">Alt.</span><input class="prop-input" id="prop-h" type="number" value="${Math.round(s.height)}"></div>
            <div class="prop-row"><span class="prop-label">Rotação</span><input class="prop-input" id="prop-rot" type="number" value="${Math.round(s.rotation)}">°</div>
        </div>
        <div class="prop-group"><div class="prop-group-title">Estilo</div>
            <div class="prop-row"><span class="prop-label">Fundo</span><input class="prop-color-input" id="prop-fill" type="color" value="${s.style.fillColor}"></div>
            <div class="prop-row"><span class="prop-label">Borda</span><input class="prop-color-input" id="prop-stroke" type="color" value="${s.style.strokeColor}"></div>
            <div class="prop-row"><span class="prop-label">Espessura</span><input class="prop-input" id="prop-sw" type="number" value="${s.style.strokeWidth}" min="0" max="20"></div>
            <div class="prop-row"><span class="prop-label">Opacidade</span><input class="prop-input" id="prop-opacity" type="number" value="${s.style.opacity}" min="0" max="1" step="0.1"></div>
        </div>
        <div class="prop-group"><div class="prop-group-title">Texto</div>
            <div class="prop-row"><span class="prop-label">Cor</span><input class="prop-color-input" id="prop-tc" type="color" value="${s.style.textColor}"></div>
            <div class="prop-row"><span class="prop-label">Tamanho</span><input class="prop-input" id="prop-fs" type="number" value="${s.style.fontSize}" min="8" max="72"></div>
        </div>`;
    }

    bindPropertyEvents(s) {
        const bind = (id, prop, parser, isStyle) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('change', () => {
                const snap = StateSnapshot.capture(this);
                if (isStyle) s.style[prop] = parser(el.value);
                else s[prop] = parser(el.value);
                if (['x', 'y', 'width', 'height'].includes(prop)) s.ports = s.calculatePorts();
                this.history.push({ type: 'edit', description: 'Editar propriedade', before: snap, after: StateSnapshot.capture(this) });
                this.render();
            });
        };
        bind('prop-x', 'x', Number, false);
        bind('prop-y', 'y', Number, false);
        bind('prop-w', 'width', Number, false);
        bind('prop-h', 'height', Number, false);
        bind('prop-rot', 'rotation', Number, false);
        bind('prop-fill', 'fillColor', String, true);
        bind('prop-stroke', 'strokeColor', String, true);
        bind('prop-sw', 'strokeWidth', Number, true);
        bind('prop-opacity', 'opacity', Number, true);
        bind('prop-tc', 'textColor', String, true);
        bind('prop-fs', 'fontSize', Number, true);
    }

    updateCursorPosition(world) {
        const el = document.getElementById('cursor-pos');
        if (el) el.textContent = `${Math.round(world.x)}, ${Math.round(world.y)}`;
    }

    updateCursorForHandle(world) {
        const handle = this.selection.getHandleAtPoint(world.x, world.y);
        if (handle) {
            const cursors = { nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize', e: 'e-resize', se: 'se-resize', s: 's-resize', sw: 'sw-resize', w: 'w-resize', rotate: 'grab' };
            this.canvas.style.cursor = cursors[handle.id] || 'default';
        } else {
            const shape = this.getShapeAtPoint(world.x, world.y);
            this.canvas.style.cursor = shape ? 'move' : 'default';
        }
    }

    // === MENUS ===
    showContextMenu(x, y) {
        const menu = document.getElementById('context-menu');
        const hasSel = this.selection.selectedShapes.length > 0;
        menu.innerHTML = `
            <button class="dropdown-item" onclick="app.clipboard.copy()" ${!hasSel ? 'disabled' : ''}>📋 Copiar<span class="shortcut">Ctrl+C</span></button>
            <button class="dropdown-item" onclick="app.clipboard.cut()" ${!hasSel ? 'disabled' : ''}>✂️ Recortar<span class="shortcut">Ctrl+X</span></button>
            <button class="dropdown-item" onclick="app.clipboard.paste()">📌 Colar<span class="shortcut">Ctrl+V</span></button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" onclick="app.duplicateSelected()" ${!hasSel ? 'disabled' : ''}>📑 Duplicar<span class="shortcut">Ctrl+D</span></button>
            <button class="dropdown-item" onclick="app.selection.deleteSelected()" ${!hasSel ? 'disabled' : ''}>🗑️ Excluir<span class="shortcut">Del</span></button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" onclick="app.bringToFront()" ${!hasSel ? 'disabled' : ''}>⬆️ Para Frente</button>
            <button class="dropdown-item" onclick="app.sendToBack()" ${!hasSel ? 'disabled' : ''}>⬇️ Para Trás</button>`;
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.display = 'block';
    }

    closeContextMenu() {
        const menu = document.getElementById('context-menu');
        if (menu) menu.style.display = 'none';
    }

    closeAllDropdowns() {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
    }

    closeAllDialogs() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
    }

    showTemplateDialog() {
        const modal = document.getElementById('template-modal');
        if (modal) modal.classList.add('open');
    }

    applyTemplate(id) {
        TemplateManager.applyTemplate(this, id);
        this.closeAllDialogs();
    }

    toggleDropdown(menuId) {
        const menu = document.getElementById(menuId);
        const isOpen = menu.classList.contains('open');
        this.closeAllDropdowns();
        if (!isOpen) menu.classList.add('open');
    }

    // === SHAPE LIBRARY ===
    buildShapeLibrary() {
        const container = document.getElementById('shape-library');
        if (!container) return;
        const svgIcons = this.getShapeSVGIcons();

        Object.entries(ShapeCategories).forEach(([cat, types]) => {
            const catDiv = document.createElement('div');
            catDiv.className = 'shape-category';
            catDiv.innerHTML = `<div class="shape-category-label">${cat}</div>`;
            const grid = document.createElement('div');
            grid.className = 'shape-grid';

            types.forEach(type => {
                const item = document.createElement('div');
                item.className = 'shape-item';
                item.draggable = true;
                item.dataset.type = type;
                item.innerHTML = `${svgIcons[type] || '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'}<span>${ShapeNames[type] || type}</span>`;
                item.addEventListener('dragstart', (e) => { e.dataTransfer.setData('shape-type', type); });
                item.addEventListener('click', () => {
                    this.setTool('shape:' + type);
                    this.clipboard.showToast('Clique no canvas para inserir');
                });
                grid.appendChild(item);
            });

            catDiv.appendChild(grid);
            container.appendChild(catDiv);
        });
    }

    getShapeSVGIcons() {
        const s = 'fill="none" stroke="currentColor" stroke-width="1.5"';
        return {
            'rectangle': `<svg viewBox="0 0 28 28"><rect x="3" y="5" width="22" height="18" ${s}/></svg>`,
            'roundedRect': `<svg viewBox="0 0 28 28"><rect x="3" y="5" width="22" height="18" rx="4" ${s}/></svg>`,
            'circle': `<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" ${s}/></svg>`,
            'ellipse': `<svg viewBox="0 0 28 28"><ellipse cx="14" cy="14" rx="11" ry="8" ${s}/></svg>`,
            'diamond': `<svg viewBox="0 0 28 28"><polygon points="14,2 26,14 14,26 2,14" ${s}/></svg>`,
            'triangle': `<svg viewBox="0 0 28 28"><polygon points="14,3 25,25 3,25" ${s}/></svg>`,
            'parallelogram': `<svg viewBox="0 0 28 28"><polygon points="7,5 26,5 21,23 2,23" ${s}/></svg>`,
            'hexagon': `<svg viewBox="0 0 28 28"><polygon points="7,3 21,3 27,14 21,25 7,25 1,14" ${s}/></svg>`,
            'star': `<svg viewBox="0 0 28 28"><polygon points="14,2 17,10 26,10 19,16 21,25 14,20 7,25 9,16 2,10 11,10" ${s}/></svg>`,
            'process': `<svg viewBox="0 0 28 28"><rect x="3" y="5" width="22" height="18" ${s}/></svg>`,
            'decision': `<svg viewBox="0 0 28 28"><polygon points="14,2 26,14 14,26 2,14" ${s}/></svg>`,
            'terminator': `<svg viewBox="0 0 28 28"><rect x="3" y="7" width="22" height="14" rx="7" ${s}/></svg>`,
            'data': `<svg viewBox="0 0 28 28"><polygon points="7,5 26,5 21,23 2,23" ${s}/></svg>`,
            'document': `<svg viewBox="0 0 28 28"><path d="M3,4 L25,4 L25,20 Q18,17 14,22 Q10,27 3,20 Z" ${s}/></svg>`,
            'database': `<svg viewBox="0 0 28 28"><ellipse cx="14" cy="7" rx="10" ry="4" ${s}/><path d="M4,7 L4,21" ${s}/><path d="M24,7 L24,21" ${s}/><ellipse cx="14" cy="21" rx="10" ry="4" ${s}/></svg>`,
            'cylinder': `<svg viewBox="0 0 28 28"><ellipse cx="14" cy="7" rx="10" ry="4" ${s}/><path d="M4,7 L4,21" ${s}/><path d="M24,7 L24,21" ${s}/><ellipse cx="14" cy="21" rx="10" ry="4" ${s}/></svg>`,
            'note': `<svg viewBox="0 0 28 28"><path d="M3,3 L20,3 L25,8 L25,25 L3,25 Z" ${s}/><path d="M20,3 L20,8 L25,8" ${s}/></svg>`,
            'text': `<svg viewBox="0 0 28 28"><text x="14" y="20" text-anchor="middle" font-size="18" fill="currentColor" stroke="none">T</text></svg>`,
            'cloud': `<svg viewBox="0 0 28 28"><path d="M7,20 Q1,20 2,14 Q1,8 7,9 Q8,3 14,5 Q18,2 22,7 Q27,7 26,13 Q28,18 22,20 Z" ${s}/></svg>`,
            'callout': `<svg viewBox="0 0 28 28"><path d="M3,3 L25,3 L25,18 L12,18 L8,24 L9,18 L3,18 Z" rx="2" ${s}/></svg>`,
            'arrowRight': `<svg viewBox="0 0 28 28"><polygon points="2,8 17,8 17,3 26,14 17,25 17,20 2,20" ${s}/></svg>`,
            'plus': `<svg viewBox="0 0 28 28"><polygon points="10,2 18,2 18,10 26,10 26,18 18,18 18,26 10,26 10,18 2,18 2,10 10,10" ${s}/></svg>`,
            'predefinedProcess': `<svg viewBox="0 0 28 28"><rect x="3" y="5" width="22" height="18" ${s}/><line x1="7" y1="5" x2="7" y2="23" ${s}/><line x1="21" y1="5" x2="21" y2="23" ${s}/></svg>`,
            'delay': `<svg viewBox="0 0 28 28"><path d="M3,5 L18,5 A9,9 0 0 1 18,23 L3,23 Z" ${s}/></svg>`,
            'display': `<svg viewBox="0 0 28 28"><path d="M7,5 L20,5 Q26,14 20,23 L7,23 L3,14 Z" ${s}/></svg>`,
            'manualInput': `<svg viewBox="0 0 28 28"><polygon points="3,10 25,5 25,23 3,23" ${s}/></svg>`,
            'preparation': `<svg viewBox="0 0 28 28"><polygon points="7,3 21,3 27,14 21,25 7,25 1,14" ${s}/></svg>`,
            'storedData': `<svg viewBox="0 0 28 28"><path d="M7,4 L25,4 Q21,14 25,24 L7,24 Q3,14 7,4 Z" ${s}/></svg>`,
            'internalStorage': `<svg viewBox="0 0 28 28"><rect x="3" y="3" width="22" height="22" ${s}/><line x1="9" y1="3" x2="9" y2="25" ${s}/><line x1="3" y1="9" x2="25" y2="9" ${s}/></svg>`,
            'manualOperation': `<svg viewBox="0 0 28 28"><polygon points="2,5 26,5 21,23 7,23" ${s}/></svg>`,
            'merge': `<svg viewBox="0 0 28 28"><polygon points="3,5 25,5 14,23" ${s}/></svg>`,
            'connectorShape': `<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="8" ${s}/></svg>`,
            'or': `<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" ${s}/><line x1="14" y1="4" x2="14" y2="24" ${s}/><line x1="4" y1="14" x2="24" y2="14" ${s}/></svg>`,
            'summingJunction': `<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" ${s}/><line x1="7" y1="7" x2="21" y2="21" ${s}/><line x1="21" y1="7" x2="7" y2="21" ${s}/></svg>`,
            'swimlaneH': `<svg viewBox="0 0 28 28"><rect x="3" y="3" width="22" height="22" ${s}/><line x1="9" y1="3" x2="9" y2="25" ${s}/></svg>`,
            'swimlaneV': `<svg viewBox="0 0 28 28"><rect x="3" y="3" width="22" height="22" ${s}/><line x1="3" y1="9" x2="25" y2="9" ${s}/></svg>`,
        };
    }

    // === RENDER ===
    render() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._rafId = requestAnimationFrame(() => this._render());
    }

    _render() {
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;
        const w = this.viewport.width;
        const h = this.viewport.height;

        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, w, h);

        // Apply viewport transform
        ctx.save();
        ctx.translate(-this.viewport.x * this.viewport.zoom, -this.viewport.y * this.viewport.zoom);
        ctx.scale(this.viewport.zoom, this.viewport.zoom);

        // Grid
        this.grid.draw(ctx, this.viewport);

        // Smart guides
        if (this.smartGuides) {
            this.grid.drawSmartGuides(ctx, this.smartGuides, this.viewport);
        }

        // Connectors
        this.connectors.forEach(c => { if (c.visible) c.draw(ctx, this.shapes); });

        // Drawing connector
        if (this.drawingConnector) {
            this.drawingConnector.draw(ctx, this.shapes);
        }

        // Shapes
        this.shapes.forEach(s => { if (s.visible) s.draw(ctx); });

        // Drawing shape
        if (this.drawingShape && this.drawingShape.width > 0) {
            this.drawingShape.draw(ctx);
        }

        // Selection
        this.selection.drawSelection(ctx);

        ctx.restore();

        // Rulers (screen space)
        this.grid.drawRulers(ctx, this.viewport, w, h);

        ctx.restore();

        // Minimap
        this.minimap.render();
    }
}

// Initialize
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new FluxoModApp();
    app.init();
});
