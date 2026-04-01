// FluxoMod - History Manager (Undo/Redo)
'use strict';

class HistoryManager {
    constructor(maxSteps = 100) {
        this.maxSteps = maxSteps;
        this.undoStack = [];
        this.redoStack = [];
        this.batchMode = false;
        this.batchActions = [];
        this.onChange = null;
    }

    push(action) {
        if (this.batchMode) {
            this.batchActions.push(action);
            return;
        }

        this.undoStack.push(action);
        if (this.undoStack.length > this.maxSteps) {
            this.undoStack.shift();
        }
        this.redoStack = [];
        this.notifyChange();
    }

    startBatch() {
        this.batchMode = true;
        this.batchActions = [];
    }

    endBatch(description = 'Batch operation') {
        this.batchMode = false;
        if (this.batchActions.length > 0) {
            this.undoStack.push({
                type: 'batch',
                description,
                actions: [...this.batchActions]
            });
            if (this.undoStack.length > this.maxSteps) {
                this.undoStack.shift();
            }
            this.redoStack = [];
            this.batchActions = [];
            this.notifyChange();
        }
    }

    undo() {
        if (!this.canUndo()) return null;
        const action = this.undoStack.pop();
        this.redoStack.push(action);
        this.notifyChange();
        return action;
    }

    redo() {
        if (!this.canRedo()) return null;
        const action = this.redoStack.pop();
        this.undoStack.push(action);
        this.notifyChange();
        return action;
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.notifyChange();
    }

    notifyChange() {
        if (this.onChange) this.onChange();
    }

    getUndoDescription() {
        if (!this.canUndo()) return '';
        const last = this.undoStack[this.undoStack.length - 1];
        return last.description || 'Ação';
    }

    getRedoDescription() {
        if (!this.canRedo()) return '';
        const last = this.redoStack[this.redoStack.length - 1];
        return last.description || 'Ação';
    }
}

class StateSnapshot {
    static capture(app) {
        return {
            shapes: app.shapes.map(s => s.toJSON()),
            connectors: app.connectors.map(c => c.toJSON()),
            timestamp: Date.now()
        };
    }

    static restore(app, snapshot) {
        app.shapes = snapshot.shapes.map(s => Shape.fromJSON(s));
        app.connectors = snapshot.connectors.map(c => Connector.fromJSON(c));
    }
}
