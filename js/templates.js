// FluxoMod - Templates
'use strict';

class TemplateManager {
    static getTemplates() {
        return [
            { id: 'flowchart', name: 'Fluxograma', icon: '📊', description: 'Fluxo de processo com decisões' },
            { id: 'orgchart', name: 'Organograma', icon: '🏢', description: 'Hierarquia organizacional' },
            { id: 'mindmap', name: 'Mapa Mental', icon: '🧠', description: 'Organização de ideias' },
            { id: 'swimlane', name: 'Swimlane', icon: '🏊', description: 'Processos por responsáveis' },
            { id: 'network', name: 'Diagrama de Rede', icon: '🌐', description: 'Topologia de rede' },
            { id: 'sequence', name: 'Diagrama de Sequência', icon: '🔄', description: 'Fluxo de comunicação' },
            { id: 'er', name: 'Diagrama ER', icon: '🗃️', description: 'Entidade Relacionamento' },
            { id: 'blank', name: 'Em Branco', icon: '📄', description: 'Começar do zero' }
        ];
    }

    static applyTemplate(app, templateId) {
        app.shapes = [];
        app.connectors = [];
        app.selection.clearSelection();
        app.history.clear();

        const colors = {
            primary: '#6366f1',
            primaryLight: '#818cf8',
            secondary: '#10b981',
            accent: '#f59e0b',
            danger: '#ef4444',
            info: '#3b82f6',
            bg: '#ffffff',
            text: '#1e293b'
        };

        switch (templateId) {
            case 'flowchart':
                this.createFlowchart(app, colors);
                break;
            case 'orgchart':
                this.createOrgChart(app, colors);
                break;
            case 'mindmap':
                this.createMindMap(app, colors);
                break;
            case 'swimlane':
                this.createSwimlane(app, colors);
                break;
            case 'network':
                this.createNetwork(app, colors);
                break;
            case 'er':
                this.createER(app, colors);
                break;
            case 'blank':
            default:
                break;
        }

        app.projectName = TemplateManager.getTemplates().find(t => t.id === templateId)?.name || 'Novo Diagrama';
        app.updateTitle();
        app.zoomToFit();
        app.render();
    }

    static createFlowchart(app, c) {
        const shapes = [
            new Shape('terminator', 300, 50, 160, 50, { text: 'Início', style: { fillColor: c.primary, textColor: '#fff', strokeColor: c.primary } }),
            new Shape('process', 300, 150, 160, 70, { text: 'Processo 1', style: { fillColor: '#eef2ff', strokeColor: c.primary } }),
            new Shape('decision', 280, 270, 200, 120, { text: 'Condição?', style: { fillColor: '#fef3c7', strokeColor: c.accent } }),
            new Shape('process', 100, 440, 160, 70, { text: 'Processo A', style: { fillColor: '#dcfce7', strokeColor: c.secondary } }),
            new Shape('process', 500, 440, 160, 70, { text: 'Processo B', style: { fillColor: '#fee2e2', strokeColor: c.danger } }),
            new Shape('terminator', 300, 560, 160, 50, { text: 'Fim', style: { fillColor: c.primary, textColor: '#fff', strokeColor: c.primary } }),
        ];

        shapes.forEach(s => app.shapes.push(s));

        const conns = [
            new Connector({ sourceId: shapes[0].id, targetId: shapes[1].id }),
            new Connector({ sourceId: shapes[1].id, targetId: shapes[2].id }),
            new Connector({ sourceId: shapes[2].id, targetId: shapes[3].id, label: 'Sim' }),
            new Connector({ sourceId: shapes[2].id, targetId: shapes[4].id, label: 'Não' }),
            new Connector({ sourceId: shapes[3].id, targetId: shapes[5].id }),
            new Connector({ sourceId: shapes[4].id, targetId: shapes[5].id }),
        ];

        conns.forEach(c => app.connectors.push(c));
    }

    static createOrgChart(app, c) {
        const shapes = [
            new Shape('roundedRect', 350, 50, 180, 60, { text: 'CEO', style: { fillColor: c.primary, textColor: '#fff', strokeColor: c.primary, cornerRadius: 12 } }),
            new Shape('roundedRect', 100, 170, 160, 55, { text: 'VP Marketing', style: { fillColor: '#eef2ff', strokeColor: c.primary, cornerRadius: 10 } }),
            new Shape('roundedRect', 360, 170, 160, 55, { text: 'VP Tecnologia', style: { fillColor: '#eef2ff', strokeColor: c.primary, cornerRadius: 10 } }),
            new Shape('roundedRect', 620, 170, 160, 55, { text: 'VP Financeiro', style: { fillColor: '#eef2ff', strokeColor: c.primary, cornerRadius: 10 } }),
            new Shape('roundedRect', 40, 290, 130, 50, { text: 'Designer', style: { fillColor: '#f8fafc', strokeColor: '#94a3b8', cornerRadius: 8 } }),
            new Shape('roundedRect', 190, 290, 130, 50, { text: 'Analista', style: { fillColor: '#f8fafc', strokeColor: '#94a3b8', cornerRadius: 8 } }),
            new Shape('roundedRect', 340, 290, 130, 50, { text: 'Dev Front', style: { fillColor: '#f8fafc', strokeColor: '#94a3b8', cornerRadius: 8 } }),
            new Shape('roundedRect', 490, 290, 130, 50, { text: 'Dev Back', style: { fillColor: '#f8fafc', strokeColor: '#94a3b8', cornerRadius: 8 } }),
        ];

        shapes.forEach(s => app.shapes.push(s));

        const conns = [
            new Connector({ sourceId: shapes[0].id, targetId: shapes[1].id, style: { endArrow: 'none' } }),
            new Connector({ sourceId: shapes[0].id, targetId: shapes[2].id, style: { endArrow: 'none' } }),
            new Connector({ sourceId: shapes[0].id, targetId: shapes[3].id, style: { endArrow: 'none' } }),
            new Connector({ sourceId: shapes[1].id, targetId: shapes[4].id, style: { endArrow: 'none' } }),
            new Connector({ sourceId: shapes[1].id, targetId: shapes[5].id, style: { endArrow: 'none' } }),
            new Connector({ sourceId: shapes[2].id, targetId: shapes[6].id, style: { endArrow: 'none' } }),
            new Connector({ sourceId: shapes[2].id, targetId: shapes[7].id, style: { endArrow: 'none' } }),
        ];

        conns.forEach(c => app.connectors.push(c));
    }

    static createMindMap(app, c) {
        const shapes = [
            new Shape('roundedRect', 350, 250, 180, 60, { text: 'Ideia Central', style: { fillColor: c.primary, textColor: '#fff', strokeColor: c.primary, cornerRadius: 30 } }),
            new Shape('roundedRect', 100, 100, 150, 45, { text: 'Tópico 1', style: { fillColor: '#dcfce7', strokeColor: c.secondary, cornerRadius: 20 } }),
            new Shape('roundedRect', 600, 100, 150, 45, { text: 'Tópico 2', style: { fillColor: '#fef3c7', strokeColor: c.accent, cornerRadius: 20 } }),
            new Shape('roundedRect', 100, 400, 150, 45, { text: 'Tópico 3', style: { fillColor: '#fee2e2', strokeColor: c.danger, cornerRadius: 20 } }),
            new Shape('roundedRect', 600, 400, 150, 45, { text: 'Tópico 4', style: { fillColor: '#dbeafe', strokeColor: c.info, cornerRadius: 20 } }),
        ];

        shapes.forEach(s => app.shapes.push(s));

        const conns = [
            new Connector({ sourceId: shapes[0].id, targetId: shapes[1].id, type: 'curved', style: { strokeColor: c.secondary, endArrow: 'none' } }),
            new Connector({ sourceId: shapes[0].id, targetId: shapes[2].id, type: 'curved', style: { strokeColor: c.accent, endArrow: 'none' } }),
            new Connector({ sourceId: shapes[0].id, targetId: shapes[3].id, type: 'curved', style: { strokeColor: c.danger, endArrow: 'none' } }),
            new Connector({ sourceId: shapes[0].id, targetId: shapes[4].id, type: 'curved', style: { strokeColor: c.info, endArrow: 'none' } }),
        ];

        conns.forEach(c => app.connectors.push(c));
    }

    static createSwimlane(app, c) {
        const shapes = [
            new Shape('swimlaneH', 100, 50, 700, 150, { text: 'Cliente', style: { fillColor: '#eef2ff', strokeColor: c.primary } }),
            new Shape('swimlaneH', 100, 200, 700, 150, { text: 'Vendas', style: { fillColor: '#dcfce7', strokeColor: c.secondary } }),
            new Shape('swimlaneH', 100, 350, 700, 150, { text: 'Logística', style: { fillColor: '#fef3c7', strokeColor: c.accent } }),
            new Shape('terminator', 200, 100, 120, 40, { text: 'Pedido', style: { fillColor: c.primary, textColor: '#fff', strokeColor: c.primary } }),
            new Shape('process', 400, 245, 130, 50, { text: 'Processar', style: { fillColor: '#fff', strokeColor: c.secondary } }),
            new Shape('process', 600, 395, 130, 50, { text: 'Enviar', style: { fillColor: '#fff', strokeColor: c.accent } }),
        ];

        shapes.forEach(s => app.shapes.push(s));

        const conns = [
            new Connector({ sourceId: shapes[3].id, targetId: shapes[4].id }),
            new Connector({ sourceId: shapes[4].id, targetId: shapes[5].id }),
        ];

        conns.forEach(c => app.connectors.push(c));
    }

    static createNetwork(app, c) {
        const shapes = [
            new Shape('cloud', 320, 30, 180, 100, { text: 'Internet', style: { fillColor: '#dbeafe', strokeColor: c.info } }),
            new Shape('rectangle', 360, 190, 100, 60, { text: 'Firewall', style: { fillColor: '#fee2e2', strokeColor: c.danger } }),
            new Shape('rectangle', 360, 310, 100, 60, { text: 'Switch', style: { fillColor: '#fef3c7', strokeColor: c.accent } }),
            new Shape('rectangle', 140, 430, 110, 60, { text: 'Servidor 1', style: { fillColor: '#dcfce7', strokeColor: c.secondary } }),
            new Shape('rectangle', 360, 430, 110, 60, { text: 'Servidor 2', style: { fillColor: '#dcfce7', strokeColor: c.secondary } }),
            new Shape('rectangle', 580, 430, 110, 60, { text: 'Servidor 3', style: { fillColor: '#dcfce7', strokeColor: c.secondary } }),
        ];

        shapes.forEach(s => app.shapes.push(s));

        const conns = [
            new Connector({ sourceId: shapes[0].id, targetId: shapes[1].id }),
            new Connector({ sourceId: shapes[1].id, targetId: shapes[2].id }),
            new Connector({ sourceId: shapes[2].id, targetId: shapes[3].id }),
            new Connector({ sourceId: shapes[2].id, targetId: shapes[4].id }),
            new Connector({ sourceId: shapes[2].id, targetId: shapes[5].id }),
        ];

        conns.forEach(c => app.connectors.push(c));
    }

    static createER(app, c) {
        const shapes = [
            new Shape('rectangle', 100, 100, 160, 120, { text: 'Usuário\n─────────\nid (PK)\nnome\nemail', style: { fillColor: '#eef2ff', strokeColor: c.primary, textAlign: 'left', fontSize: 12 } }),
            new Shape('rectangle', 400, 100, 160, 120, { text: 'Pedido\n─────────\nid (PK)\ndata\nstatus', style: { fillColor: '#dcfce7', strokeColor: c.secondary, textAlign: 'left', fontSize: 12 } }),
            new Shape('rectangle', 400, 300, 160, 120, { text: 'Produto\n─────────\nid (PK)\nnome\npreço', style: { fillColor: '#fef3c7', strokeColor: c.accent, textAlign: 'left', fontSize: 12 } }),
        ];

        shapes.forEach(s => app.shapes.push(s));

        const conns = [
            new Connector({ sourceId: shapes[0].id, targetId: shapes[1].id, label: '1:N' }),
            new Connector({ sourceId: shapes[1].id, targetId: shapes[2].id, label: 'N:M' }),
        ];

        conns.forEach(c => app.connectors.push(c));
    }
}
