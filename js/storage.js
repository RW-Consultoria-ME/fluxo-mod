// FluxoMod - Storage Manager (LocalStorage auto-save)
'use strict';

class StorageManager {
    constructor(app) {
        this.app = app;
        this.autoSaveKey = 'fluxomod_autosave';
        this.projectsKey = 'fluxomod_projects';
        this.settingsKey = 'fluxomod_settings';
        this.autoSaveInterval = null;
    }

    startAutoSave(intervalMs = 30000) {
        this.stopAutoSave();
        this.autoSaveInterval = setInterval(() => {
            this.autoSave();
        }, intervalMs);
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    autoSave() {
        try {
            const data = {
                version: '1.0',
                name: this.app.projectName,
                timestamp: Date.now(),
                shapes: this.app.shapes.map(s => s.toJSON()),
                connectors: this.app.connectors.map(c => c.toJSON()),
                viewport: { ...this.app.viewport },
                grid: {
                    size: this.app.grid.size,
                    visible: this.app.grid.visible,
                    snapEnabled: this.app.grid.snapEnabled,
                    type: this.app.grid.type
                }
            };
            localStorage.setItem(this.autoSaveKey, JSON.stringify(data));
            this.showSaveIndicator();
        } catch (e) {
            console.warn('Auto-save failed:', e);
        }
    }

    loadAutoSave() {
        try {
            const raw = localStorage.getItem(this.autoSaveKey);
            if (!raw) return false;
            const data = JSON.parse(raw);
            this.app.shapes = (data.shapes || []).map(s => Shape.fromJSON(s));
            this.app.connectors = (data.connectors || []).map(c => Connector.fromJSON(c));
            this.app.projectName = data.name || 'Sem título';
            if (data.viewport) {
                Object.assign(this.app.viewport, data.viewport);
            }
            if (data.grid) {
                Object.assign(this.app.grid, data.grid);
            }
            return true;
        } catch (e) {
            console.warn('Auto-save load failed:', e);
            return false;
        }
    }

    hasAutoSave() {
        return !!localStorage.getItem(this.autoSaveKey);
    }

    clearAutoSave() {
        localStorage.removeItem(this.autoSaveKey);
    }

    saveProject(name) {
        const projects = this.getProjectList();
        const data = {
            id: Utils.generateId(),
            name: name || this.app.projectName,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            shapes: this.app.shapes.map(s => s.toJSON()),
            connectors: this.app.connectors.map(c => c.toJSON())
        };

        const existing = projects.findIndex(p => p.name === data.name);
        if (existing >= 0) {
            data.id = projects[existing].id;
            data.created = projects[existing].created;
            projects[existing] = { id: data.id, name: data.name, created: data.created, modified: data.modified };
        } else {
            projects.push({ id: data.id, name: data.name, created: data.created, modified: data.modified });
        }

        localStorage.setItem(this.projectsKey, JSON.stringify(projects));
        localStorage.setItem('fluxomod_project_' + data.id, JSON.stringify(data));
        this.app.projectName = data.name;
        this.app.updateTitle();
    }

    loadProject(id) {
        try {
            const raw = localStorage.getItem('fluxomod_project_' + id);
            if (!raw) return false;
            const data = JSON.parse(raw);
            this.app.shapes = (data.shapes || []).map(s => Shape.fromJSON(s));
            this.app.connectors = (data.connectors || []).map(c => Connector.fromJSON(c));
            this.app.projectName = data.name;
            this.app.history.clear();
            this.app.selection.clearSelection();
            this.app.render();
            this.app.updateTitle();
            return true;
        } catch (e) {
            console.warn('Project load failed:', e);
            return false;
        }
    }

    deleteProject(id) {
        const projects = this.getProjectList().filter(p => p.id !== id);
        localStorage.setItem(this.projectsKey, JSON.stringify(projects));
        localStorage.removeItem('fluxomod_project_' + id);
    }

    getProjectList() {
        try {
            const raw = localStorage.getItem(this.projectsKey);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    saveSettings(settings) {
        localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    }

    loadSettings() {
        try {
            const raw = localStorage.getItem(this.settingsKey);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    showSaveIndicator() {
        const indicator = document.getElementById('save-indicator');
        if (indicator) {
            indicator.classList.add('visible');
            setTimeout(() => indicator.classList.remove('visible'), 2000);
        }
    }
}
