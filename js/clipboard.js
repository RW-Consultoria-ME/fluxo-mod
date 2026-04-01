// FluxoMod - Clipboard Manager
'use strict';

class ClipboardManager {
    constructor(app) {
        this.app = app;
        this.buffer = [];
        this.offset = 0;
    }

    copy() {
        if (this.app.selection.selectedShapes.length === 0) return;
        this.buffer = this.app.selection.selectedShapes.map(s => s.toJSON());
        this.offset = 0;
        this.showToast('Copiado!');
    }

    cut() {
        this.copy();
        this.app.selection.deleteSelected();
    }

    paste() {
        if (this.buffer.length === 0) return;

        this.offset += 20;
        const snapshot = StateSnapshot.capture(this.app);

        const newShapes = [];
        const idMap = {};

        this.buffer.forEach(data => {
            const newData = Utils.deepClone(data);
            const newId = Utils.generateId();
            idMap[newData.id] = newId;
            newData.id = newId;
            newData.x += this.offset;
            newData.y += this.offset;
            newData.name = newData.name.replace(' (cópia)', '') + ' (cópia)';
            const shape = Shape.fromJSON(newData);
            newShapes.push(shape);
            this.app.shapes.push(shape);
        });

        this.app.history.push({
            type: 'paste',
            description: 'Colar elementos',
            before: snapshot,
            after: StateSnapshot.capture(this.app)
        });

        this.app.selection.clearSelection();
        newShapes.forEach(s => this.app.selection.selectShape(s, true));
        this.app.render();
        this.showToast('Colado!');
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.classList.add('visible');
            setTimeout(() => toast.classList.remove('visible'), 1500);
        }
    }
}
