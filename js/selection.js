// FluxoMod - Selection Manager
'use strict';

class SelectionManager {
    constructor(app) {
        this.app = app;
        this.selectedShapes = [];
        this.selectedConnectors = [];
        this.selectionRect = null;
        this.resizeHandle = null;
        this.rotateHandle = false;
        this.dragStart = null;
        this.isMoving = false;
        this.isResizing = false;
        this.isRotating = false;
        this.isEditingConnector = false;
        this.connectorHandle = null;
        this.handleSize = 8;
    }

    selectShape(shape, addToSelection = false) {
        if (!addToSelection) {
            this.clearSelection();
        }
        if (!this.selectedShapes.includes(shape)) {
            this.selectedShapes.push(shape);
        }
        this.selectedConnectors = [];
        this.app.updatePropertyPanel();
    }

    selectConnector(connector, addToSelection = false) {
        if (!addToSelection) {
            this.clearSelection();
        }
        if (!this.selectedConnectors.includes(connector)) {
            this.selectedConnectors.push(connector);
        }
        this.selectedShapes = [];
        this.app.updatePropertyPanel();
    }

    clearSelection() {
        this.selectedShapes = [];
        this.selectedConnectors = [];
        this.app.updatePropertyPanel();
    }

    selectAll() {
        this.selectedShapes = [...this.app.shapes.filter(s => !s.locked)];
        this.selectedConnectors = [];
        this.app.updatePropertyPanel();
    }

    deleteSelected() {
        if (this.selectedShapes.length === 0 && this.selectedConnectors.length === 0) return;

        const snapshot = StateSnapshot.capture(this.app);

        const shapeIds = new Set(this.selectedShapes.map(s => s.id));
        
        // Remove connectors attached to deleted shapes
        this.app.connectors = this.app.connectors.filter(c => {
            if (this.selectedConnectors.includes(c)) return false;
            if (shapeIds.has(c.sourceId) || shapeIds.has(c.targetId)) return false;
            return true;
        });

        this.app.shapes = this.app.shapes.filter(s => !shapeIds.has(s.id));

        this.app.history.push({
            type: 'delete',
            description: 'Excluir elementos',
            before: snapshot,
            after: StateSnapshot.capture(this.app)
        });

        this.clearSelection();
        this.app.render();
    }

    getSelectionBounds() {
        if (this.selectedShapes.length === 0) return null;
        return Utils.getBoundingBox(this.selectedShapes);
    }

    getHandleAtPoint(px, py) {
        if (this.selectedShapes.length !== 1) return null;
        const shape = this.selectedShapes[0];
        if (shape.locked) return null;

        const b = shape.getBounds();
        const s = this.handleSize / this.app.viewport.zoom;
        const handles = [
            { id: 'nw', x: b.x, y: b.y },
            { id: 'n', x: b.x + b.width / 2, y: b.y },
            { id: 'ne', x: b.x + b.width, y: b.y },
            { id: 'e', x: b.x + b.width, y: b.y + b.height / 2 },
            { id: 'se', x: b.x + b.width, y: b.y + b.height },
            { id: 's', x: b.x + b.width / 2, y: b.y + b.height },
            { id: 'sw', x: b.x, y: b.y + b.height },
            { id: 'w', x: b.x, y: b.y + b.height / 2 }
        ];

        // Rotation handle
        const rotHandle = {
            id: 'rotate',
            x: b.x + b.width / 2,
            y: b.y - 30 / this.app.viewport.zoom
        };
        if (Utils.distance(px, py, rotHandle.x, rotHandle.y) <= s * 2) {
            return rotHandle;
        }

        for (const h of handles) {
            if (Utils.distance(px, py, h.x, h.y) <= s * 1.5) {
                return h;
            }
        }

        return null;
    }

    getPortAtPoint(px, py) {
        const threshold = 12 / this.app.viewport.zoom;
        for (const shape of this.app.shapes) {
            for (const port of shape.ports) {
                const ax = shape.x + port.x;
                const ay = shape.y + port.y;
                if (Utils.distance(px, py, ax, ay) <= threshold) {
                    return { shape, port };
                }
            }
        }
        return null;
    }

    getConnectorHandleAtPoint(px, py) {
        if (this.selectedConnectors.length !== 1) return null;
        const conn = this.selectedConnectors[0];
        const points = conn.getPoints(this.app.shapes);
        const s = this.handleSize / this.app.viewport.zoom;

        // Existing points
        for (let i = 0; i < points.length; i++) {
            if (Utils.distance(px, py, points[i].x, points[i].y) <= s * 1.5) {
                return { connector: conn, type: 'point', index: i, point: points[i], pointsLength: points.length };
            }
        }
        // Midpoints to create waypoints
        for (let i = 0; i < points.length - 1; i++) {
            const mx = (points[i].x + points[i+1].x)/2;
            const my = (points[i].y + points[i+1].y)/2;
            if (Utils.distance(px, py, mx, my) <= s * 1.5) {
                return { connector: conn, type: 'midpoint', index: i, point: {x: mx, y: my} };
            }
        }
        return null;
    }

    drawSelection(ctx) {
        if (this.selectedShapes.length === 0 && this.selectedConnectors.length === 0) return;

        ctx.save();
        const zoom = this.app.viewport.zoom;

        // Selection box for shapes
        this.selectedShapes.forEach(shape => {
            const b = shape.getBounds();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 1.5 / zoom;
            ctx.setLineDash([5 / zoom, 3 / zoom]);
            ctx.strokeRect(b.x - 3 / zoom, b.y - 3 / zoom, b.width + 6 / zoom, b.height + 6 / zoom);
            ctx.setLineDash([]);
        });

        // Resize handles for single selection
        if (this.selectedShapes.length === 1 && !this.selectedShapes[0].locked) {
            const shape = this.selectedShapes[0];
            const b = shape.getBounds();
            const s = this.handleSize / zoom;

            const handles = [
                { x: b.x, y: b.y, cursor: 'nw-resize' },
                { x: b.x + b.width / 2, y: b.y, cursor: 'n-resize' },
                { x: b.x + b.width, y: b.y, cursor: 'ne-resize' },
                { x: b.x + b.width, y: b.y + b.height / 2, cursor: 'e-resize' },
                { x: b.x + b.width, y: b.y + b.height, cursor: 'se-resize' },
                { x: b.x + b.width / 2, y: b.y + b.height, cursor: 's-resize' },
                { x: b.x, y: b.y + b.height, cursor: 'sw-resize' },
                { x: b.x, y: b.y + b.height / 2, cursor: 'w-resize' }
            ];

            handles.forEach(h => {
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#6366f1';
                ctx.lineWidth = 1.5 / zoom;
                ctx.fillRect(h.x - s / 2, h.y - s / 2, s, s);
                ctx.strokeRect(h.x - s / 2, h.y - s / 2, s, s);
            });

            // Rotation handle
            const rotY = b.y - 30 / zoom;
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 1 / zoom;
            ctx.beginPath();
            ctx.moveTo(b.x + b.width / 2, b.y);
            ctx.lineTo(b.x + b.width / 2, rotY);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#6366f1';
            ctx.beginPath();
            ctx.arc(b.x + b.width / 2, rotY, s * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw rotation icon
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 1 / zoom;
            const rx = b.x + b.width / 2;
            const rr = s * 0.4;
            ctx.beginPath();
            ctx.arc(rx, rotY, rr, -Math.PI * 0.8, Math.PI * 0.3);
            ctx.stroke();

            // Connection ports
            shape.ports.forEach(port => {
                const ax = shape.x + port.x;
                const ay = shape.y + port.y;
                ctx.fillStyle = '#6366f1';
                ctx.beginPath();
                ctx.arc(ax, ay, 4 / zoom, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(ax, ay, 2 / zoom, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Highlight selected connectors
        this.selectedConnectors.forEach(conn => {
            const points = conn.getPoints(this.app.shapes);
            if (points.length < 2) return;
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3 / zoom;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach((p, i) => { if (i > 0) ctx.lineTo(p.x, p.y); });
            ctx.stroke();

            // Endpoints and waypoints
            points.forEach((p, i) => {
                ctx.fillStyle = (i === 0 || i === points.length - 1) ? '#ef4444' : '#6366f1';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5 / zoom, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5 / zoom;
                ctx.stroke();
            });
            // Midpoints
            for(let i=0; i < points.length - 1; i++) {
                 const mx = (points[i].x + points[i+1].x)/2;
                 const my = (points[i].y + points[i+1].y)/2;
                 ctx.fillStyle = '#10b981';
                 ctx.beginPath();
                 ctx.arc(mx, my, 4 / zoom, 0, Math.PI * 2);
                 ctx.fill();
                 ctx.stroke();
            }
        });

        // Selection rectangle
        if (this.selectionRect) {
            ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 1 / zoom;
            ctx.setLineDash([3 / zoom, 3 / zoom]);
            const r = this.selectionRect;
            ctx.fillRect(r.x, r.y, r.width, r.height);
            ctx.strokeRect(r.x, r.y, r.width, r.height);
        }

        ctx.restore();
    }
}
