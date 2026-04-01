// FluxoMod - Keyboard Shortcuts
'use strict';

class ShortcutManager {
    constructor(app) {
        this.app = app;
        this.shortcuts = new Map();
        this.registerDefaults();
    }

    registerDefaults() {
        // File operations
        this.register('ctrl+n', 'Novo diagrama', () => this.app.newProject());
        this.register('ctrl+s', 'Salvar', () => this.app.saveProject());
        this.register('ctrl+shift+s', 'Salvar como', () => this.app.saveProjectAs());
        this.register('ctrl+o', 'Abrir', () => this.app.openProject());
        this.register('ctrl+e', 'Exportar PNG', () => ExportManager.exportPNG(this.app));
        this.register('ctrl+shift+e', 'Exportar SVG', () => ExportManager.exportSVG(this.app));

        // Edit operations
        this.register('ctrl+z', 'Desfazer', () => this.app.undo());
        this.register('ctrl+y', 'Refazer', () => this.app.redo());
        this.register('ctrl+shift+z', 'Refazer', () => this.app.redo());
        this.register('ctrl+c', 'Copiar', () => this.app.clipboard.copy());
        this.register('ctrl+v', 'Colar', () => this.app.clipboard.paste());
        this.register('ctrl+x', 'Recortar', () => this.app.clipboard.cut());
        this.register('ctrl+d', 'Duplicar', () => this.app.duplicateSelected());
        this.register('ctrl+a', 'Selecionar tudo', () => this.app.selection.selectAll());
        this.register('delete', 'Excluir', () => this.app.selection.deleteSelected());
        this.register('backspace', 'Excluir', () => this.app.selection.deleteSelected());

        // View
        this.register('ctrl+=', 'Zoom in', () => this.app.zoomIn());
        this.register('ctrl+-', 'Zoom out', () => this.app.zoomOut());
        this.register('ctrl+0', 'Zoom 100%', () => this.app.zoomReset());
        this.register('ctrl+shift+f', 'Ajustar à tela', () => this.app.zoomToFit());
        this.register('ctrl+g', 'Mostrar/ocultar grade', () => this.app.toggleGrid());
        this.register('ctrl+r', 'Mostrar/ocultar réguas', () => this.app.toggleRulers());

        // Tools
        this.register('v', 'Seleção', () => this.app.setTool('select'));
        this.register('h', 'Mão', () => this.app.setTool('pan'));
        this.register('r', 'Retângulo', () => this.app.setTool('rectangle'));
        this.register('o', 'Círculo', () => this.app.setTool('circle'));
        this.register('d', 'Losango', () => this.app.setTool('diamond'));
        this.register('l', 'Linha', () => this.app.setTool('connector'));
        this.register('t', 'Texto', () => this.app.setTool('text'));

        // Alignment
        this.register('alt+a', 'Alinhar esquerda', () => this.app.alignShapes('left'));
        this.register('alt+d', 'Alinhar direita', () => this.app.alignShapes('right'));
        this.register('alt+w', 'Alinhar topo', () => this.app.alignShapes('top'));
        this.register('alt+s', 'Alinhar base', () => this.app.alignShapes('bottom'));
        this.register('alt+h', 'Alinhar centro H', () => this.app.alignShapes('centerH'));
        this.register('alt+v', 'Alinhar centro V', () => this.app.alignShapes('centerV'));

        // Order
        this.register('ctrl+]', 'Trazer frente', () => this.app.bringForward());
        this.register('ctrl+[', 'Enviar trás', () => this.app.sendBackward());
        this.register('ctrl+shift+]', 'Para frente', () => this.app.bringToFront());
        this.register('ctrl+shift+[', 'Para trás', () => this.app.sendToBack());

        // Escape
        this.register('escape', 'Cancelar', () => {
            this.app.selection.clearSelection();
            this.app.setTool('select');
            this.app.closeAllDialogs();
        });
    }

    register(combo, description, callback) {
        this.shortcuts.set(combo.toLowerCase(), { description, callback });
    }

    handleKeyDown(e) {
        // Don't handle shortcuts when typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            if (e.key === 'Escape') {
                e.target.blur();
            }
            return;
        }

        const combo = this.getCombo(e);
        const shortcut = this.shortcuts.get(combo);
        
        if (shortcut) {
            e.preventDefault();
            e.stopPropagation();
            shortcut.callback();
        }
    }

    getCombo(e) {
        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');

        let key = e.key.toLowerCase();
        if (key === ' ') key = 'space';
        if (key === '+' || key === '=') key = '=';
        if (key === '-' || key === '_') key = '-';

        if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
            parts.push(key);
        }

        return parts.join('+');
    }

    getShortcutList() {
        const list = [];
        this.shortcuts.forEach((value, key) => {
            list.push({ combo: key, description: value.description });
        });
        return list;
    }
}
