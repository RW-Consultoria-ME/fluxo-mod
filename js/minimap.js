// FluxoMod - Minimap Widget
'use strict';

class Minimap {
    constructor(app) {
        this.app = app;
        this.visible = true;
        this.width = 180;
        this.height = 120;
        this.padding = 10;
        this.canvas = null;
        this.ctx = null;
    }

    init() {
        this.canvas = document.getElementById('minimap-canvas');
        if (this.canvas) {
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.ctx = this.canvas.getContext('2d');
            this.canvas.addEventListener('click', (e) => this.onClick(e));
        }
    }

    render() {
        if (!this.visible || !this.ctx) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Background
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, this.width, this.height);

        if (this.app.shapes.length === 0) return;

        const bounds = Utils.getBoundingBox(this.app.shapes);
        const margin = 50;
        bounds.x -= margin;
        bounds.y -= margin;
        bounds.width += margin * 2;
        bounds.height += margin * 2;

        const scaleX = this.width / bounds.width;
        const scaleY = this.height / bounds.height;
        const scale = Math.min(scaleX, scaleY) * 0.9;

        const offsetX = (this.width - bounds.width * scale) / 2;
        const offsetY = (this.height - bounds.height * scale) / 2;

        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        ctx.translate(-bounds.x, -bounds.y);

        // Draw shapes
        this.app.shapes.forEach(shape => {
            ctx.fillStyle = shape.style.fillColor === '#ffffff' ? '#94a3b8' : shape.style.fillColor;
            ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
        });

        // Draw connectors
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1 / scale;
        this.app.connectors.forEach(conn => {
            const points = conn.getPoints(this.app.shapes);
            if (points.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach((p, i) => { if (i > 0) ctx.lineTo(p.x, p.y); });
            ctx.stroke();
        });

        // Viewport rectangle
        const vp = this.app.viewport;
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([4 / scale, 4 / scale]);
        ctx.strokeRect(vp.x, vp.y, vp.width / vp.zoom, vp.height / vp.zoom);
        ctx.setLineDash([]);

        ctx.restore();
    }

    onClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const bounds = Utils.getBoundingBox(this.app.shapes);
        if (bounds.width === 0) return;

        const margin = 50;
        bounds.x -= margin;
        bounds.y -= margin;
        bounds.width += margin * 2;
        bounds.height += margin * 2;

        const scaleX = this.width / bounds.width;
        const scaleY = this.height / bounds.height;
        const scale = Math.min(scaleX, scaleY) * 0.9;

        const offsetX = (this.width - bounds.width * scale) / 2;
        const offsetY = (this.height - bounds.height * scale) / 2;

        const worldX = (mx - offsetX) / scale + bounds.x;
        const worldY = (my - offsetY) / scale + bounds.y;

        this.app.viewport.x = worldX - this.app.viewport.width / this.app.viewport.zoom / 2;
        this.app.viewport.y = worldY - this.app.viewport.height / this.app.viewport.zoom / 2;
        this.app.render();
    }
}
