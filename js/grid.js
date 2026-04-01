// FluxoMod - Grid & Snapping System
'use strict';

class Grid {
    constructor() {
        this.visible = true;
        this.size = 20;
        this.snapEnabled = true;
        this.snapThreshold = 10;
        this.color = '#e2e8f0';
        this.majorColor = '#cbd5e1';
        this.majorInterval = 5;
        this.type = 'lines'; // lines, dots
        this.showRulers = true;
        this.rulerSize = 24;
    }

    draw(ctx, viewport) {
        if (!this.visible) return;

        const startX = Math.floor((viewport.x) / this.size) * this.size;
        const startY = Math.floor((viewport.y) / this.size) * this.size;
        const endX = viewport.x + viewport.width / viewport.zoom;
        const endY = viewport.y + viewport.height / viewport.zoom;

        if (this.type === 'dots') {
            this.drawDots(ctx, startX, startY, endX, endY, viewport);
        } else {
            this.drawLines(ctx, startX, startY, endX, endY, viewport);
        }
    }

    drawLines(ctx, startX, startY, endX, endY, viewport) {
        ctx.save();
        ctx.lineWidth = 0.5 / viewport.zoom;

        for (let x = startX; x <= endX; x += this.size) {
            const isMajor = Math.round(x / this.size) % this.majorInterval === 0;
            ctx.strokeStyle = isMajor ? this.majorColor : this.color;
            ctx.lineWidth = isMajor ? 0.8 / viewport.zoom : 0.4 / viewport.zoom;
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
        }

        for (let y = startY; y <= endY; y += this.size) {
            const isMajor = Math.round(y / this.size) % this.majorInterval === 0;
            ctx.strokeStyle = isMajor ? this.majorColor : this.color;
            ctx.lineWidth = isMajor ? 0.8 / viewport.zoom : 0.4 / viewport.zoom;
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawDots(ctx, startX, startY, endX, endY, viewport) {
        ctx.save();
        const dotSize = 1.5 / viewport.zoom;

        for (let x = startX; x <= endX; x += this.size) {
            for (let y = startY; y <= endY; y += this.size) {
                const isMajor = Math.round(x / this.size) % this.majorInterval === 0 &&
                                Math.round(y / this.size) % this.majorInterval === 0;
                ctx.fillStyle = isMajor ? this.majorColor : this.color;
                ctx.beginPath();
                ctx.arc(x, y, isMajor ? dotSize * 1.5 : dotSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    drawRulers(ctx, viewport, canvasWidth, canvasHeight) {
        if (!this.showRulers) return;

        const rs = this.rulerSize;
        const zoom = viewport.zoom;

        // Horizontal ruler
        ctx.save();
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, canvasWidth, rs);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, rs);
        ctx.lineTo(canvasWidth, rs);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        const step = this.size;
        const startX = Math.floor(viewport.x / step) * step;
        const endX = viewport.x + canvasWidth / zoom;

        for (let x = startX; x <= endX; x += step) {
            const sx = (x - viewport.x) * zoom;
            const idx = Math.round(x / step);
            const isMajor = idx % this.majorInterval === 0;
            
            if (isMajor) {
                ctx.beginPath();
                ctx.moveTo(sx, rs);
                ctx.lineTo(sx, rs - 10);
                ctx.stroke();
                ctx.fillText(Math.round(x), sx, rs - 11);
            } else {
                ctx.beginPath();
                ctx.moveTo(sx, rs);
                ctx.lineTo(sx, rs - 5);
                ctx.stroke();
            }
        }

        // Vertical ruler
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, rs, canvasHeight);
        ctx.beginPath();
        ctx.moveTo(rs, 0);
        ctx.lineTo(rs, canvasHeight);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        const startY = Math.floor(viewport.y / step) * step;
        const endY = viewport.y + canvasHeight / zoom;

        for (let y = startY; y <= endY; y += step) {
            const sy = (y - viewport.y) * zoom;
            const idx = Math.round(y / step);
            const isMajor = idx % this.majorInterval === 0;

            if (isMajor) {
                ctx.beginPath();
                ctx.moveTo(rs, sy);
                ctx.lineTo(rs - 10, sy);
                ctx.stroke();

                ctx.save();
                ctx.translate(rs - 12, sy);
                ctx.rotate(-Math.PI / 2);
                ctx.textAlign = 'center';
                ctx.fillText(Math.round(y), 0, 0);
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.moveTo(rs, sy);
                ctx.lineTo(rs - 5, sy);
                ctx.stroke();
            }
        }

        // Corner square
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 0, rs, rs);
        ctx.strokeRect(0, 0, rs, rs);

        ctx.restore();
    }

    snap(value) {
        if (!this.snapEnabled) return value;
        return Utils.snapToGrid(value, this.size);
    }

    snapPoint(x, y) {
        return {
            x: this.snap(x),
            y: this.snap(y)
        };
    }

    getSmartGuides(shape, allShapes, threshold = 5) {
        const guides = { vertical: [], horizontal: [] };
        const sc = shape.getCenter();
        const sb = shape.getBounds();

        allShapes.forEach(other => {
            if (other.id === shape.id) return;
            const oc = other.getCenter();
            const ob = other.getBounds();

            // Center-center alignment
            if (Math.abs(sc.x - oc.x) < threshold) {
                guides.vertical.push({ x: oc.x, type: 'center' });
            }
            if (Math.abs(sc.y - oc.y) < threshold) {
                guides.horizontal.push({ y: oc.y, type: 'center' });
            }

            // Edge alignment
            if (Math.abs(sb.x - ob.x) < threshold) {
                guides.vertical.push({ x: ob.x, type: 'edge' });
            }
            if (Math.abs(sb.x + sb.width - (ob.x + ob.width)) < threshold) {
                guides.vertical.push({ x: ob.x + ob.width, type: 'edge' });
            }
            if (Math.abs(sb.y - ob.y) < threshold) {
                guides.horizontal.push({ y: ob.y, type: 'edge' });
            }
            if (Math.abs(sb.y + sb.height - (ob.y + ob.height)) < threshold) {
                guides.horizontal.push({ y: ob.y + ob.height, type: 'edge' });
            }
        });

        return guides;
    }

    drawSmartGuides(ctx, guides, viewport) {
        ctx.save();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1 / viewport.zoom;
        ctx.setLineDash([4 / viewport.zoom, 4 / viewport.zoom]);

        const extendLen = 10000;

        guides.vertical.forEach(g => {
            ctx.beginPath();
            ctx.moveTo(g.x, -extendLen);
            ctx.lineTo(g.x, extendLen);
            ctx.stroke();
        });

        guides.horizontal.forEach(g => {
            ctx.beginPath();
            ctx.moveTo(-extendLen, g.y);
            ctx.lineTo(extendLen, g.y);
            ctx.stroke();
        });

        ctx.restore();
    }
}
