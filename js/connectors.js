// FluxoMod - Connector System
'use strict';

const ConnectorTypes = {
    STRAIGHT: 'straight',
    ELBOW: 'elbow',
    CURVED: 'curved'
};

const ArrowTypes = {
    NONE: 'none',
    ARROW: 'arrow',
    FILLED_ARROW: 'filledArrow',
    DIAMOND: 'diamond',
    CIRCLE: 'circle',
    OPEN_ARROW: 'openArrow'
};

class Connector {
    constructor(options = {}) {
        this.id = options.id || Utils.generateId();
        this.type = options.type || ConnectorTypes.ELBOW;
        this.sourceId = options.sourceId || null;
        this.targetId = options.targetId || null;
        this.sourcePort = options.sourcePort || null;
        this.targetPort = options.targetPort || null;
        this.sourcePoint = options.sourcePoint || null;
        this.targetPoint = options.targetPoint || null;
        this.waypoints = options.waypoints || [];
        this.style = {
            strokeColor: options.style?.strokeColor || '#2d3436',
            strokeWidth: options.style?.strokeWidth || 2,
            strokeStyle: options.style?.strokeStyle || 'solid',
            opacity: options.style?.opacity || 1,
            startArrow: options.style?.startArrow || ArrowTypes.NONE,
            endArrow: options.style?.endArrow || ArrowTypes.FILLED_ARROW,
            arrowSize: options.style?.arrowSize || 10,
            cornerRadius: options.style?.cornerRadius || 8,
            color: options.style?.color || '#2d3436'
        };
        this.label = options.label || '';
        this.labelStyle = {
            fontSize: options.labelStyle?.fontSize || 12,
            fontFamily: options.labelStyle?.fontFamily || 'Inter, sans-serif',
            textColor: options.labelStyle?.textColor || '#2d3436',
            backgroundColor: options.labelStyle?.backgroundColor || '#ffffff',
            padding: options.labelStyle?.padding || 4
        };
        this.zIndex = options.zIndex || 0;
        this.visible = options.visible !== undefined ? options.visible : true;
        this.locked = options.locked || false;
    }

    getPoints(shapes) {
        let startPt = this.sourcePoint;
        let endPt = this.targetPoint;

        if (this.sourceId) {
            const source = shapes.find(s => s.id === this.sourceId);
            if (source) {
                if (this.sourcePort) {
                    startPt = source.getAbsolutePort(this.sourcePort);
                } else {
                    const target = endPt || (this.targetId ? shapes.find(s => s.id === this.targetId)?.getCenter() : null);
                    if (target) {
                        startPt = Utils.getConnectionPoint(source, target.x, target.y);
                    } else {
                        startPt = source.getCenter();
                    }
                }
            }
        }

        if (this.targetId) {
            const target = shapes.find(s => s.id === this.targetId);
            if (target) {
                if (this.targetPort) {
                    endPt = target.getAbsolutePort(this.targetPort);
                } else if (startPt) {
                    endPt = Utils.getConnectionPoint(target, startPt.x, startPt.y);
                } else {
                    endPt = target.getCenter();
                }
            }
        }

        if (!startPt || !endPt) return [];

        if (this.type === ConnectorTypes.ELBOW) {
            return this.getElbowPoints(startPt, endPt);
        }

        return [startPt, ...this.waypoints, endPt];
    }

    getElbowPoints(start, end) {
        const points = [start];
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        const dx = Math.abs(end.x - start.x);
        const dy = Math.abs(end.y - start.y);

        if (dx > dy) {
            points.push({ x: midX, y: start.y });
            points.push({ x: midX, y: end.y });
        } else {
            points.push({ x: start.x, y: midY });
            points.push({ x: end.x, y: midY });
        }

        points.push(end);
        return points;
    }

    draw(ctx, shapes) {
        const points = this.getPoints(shapes);
        if (points.length < 2) return;

        ctx.save();
        ctx.globalAlpha = this.style.opacity;
        ctx.strokeStyle = this.style.strokeColor;
        ctx.lineWidth = this.style.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (this.style.strokeStyle === 'dashed') {
            ctx.setLineDash([8, 4]);
        } else if (this.style.strokeStyle === 'dotted') {
            ctx.setLineDash([2, 4]);
        } else {
            ctx.setLineDash([]);
        }

        if (this.type === ConnectorTypes.CURVED && points.length >= 2) {
            this.drawCurvedPath(ctx, points);
        } else if (this.type === ConnectorTypes.ELBOW) {
            this.drawElbowPath(ctx, points);
        } else {
            this.drawStraightPath(ctx, points);
        }

        ctx.setLineDash([]);

        // Draw arrows
        if (points.length >= 2) {
            if (this.style.startArrow !== ArrowTypes.NONE) {
                this.drawArrow(ctx, points[1], points[0], this.style.startArrow);
            }
            if (this.style.endArrow !== ArrowTypes.NONE) {
                const last = points.length - 1;
                this.drawArrow(ctx, points[last - 1], points[last], this.style.endArrow);
            }
        }

        if (this.label) {
            this.drawLabel(ctx, points);
        }

        ctx.restore();
    }

    drawStraightPath(ctx, points) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    }

    drawElbowPath(ctx, points) {
        const r = this.style.cornerRadius;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];

            const d1 = Utils.distance(prev.x, prev.y, curr.x, curr.y);
            const d2 = Utils.distance(curr.x, curr.y, next.x, next.y);
            const radius = Math.min(r, d1 / 2, d2 / 2);

            const dx1 = curr.x - prev.x;
            const dy1 = curr.y - prev.y;
            const dx2 = next.x - curr.x;
            const dy2 = next.y - curr.y;

            const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

            if (len1 === 0 || len2 === 0) {
                ctx.lineTo(curr.x, curr.y);
                continue;
            }

            const startX = curr.x - (dx1 / len1) * radius;
            const startY = curr.y - (dy1 / len1) * radius;
            const endX = curr.x + (dx2 / len2) * radius;
            const endY = curr.y + (dy2 / len2) * radius;

            ctx.lineTo(startX, startY);
            ctx.quadraticCurveTo(curr.x, curr.y, endX, endY);
        }

        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
    }

    drawCurvedPath(ctx, points) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        if (points.length === 2) {
            const cp1x = points[0].x + (points[1].x - points[0].x) * 0.5;
            const cp1y = points[0].y;
            const cp2x = points[0].x + (points[1].x - points[0].x) * 0.5;
            const cp2y = points[1].y;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[1].x, points[1].y);
        } else {
            for (let i = 1; i < points.length - 1; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            const last = points[points.length - 1];
            ctx.lineTo(last.x, last.y);
        }
        ctx.stroke();
    }

    drawArrow(ctx, from, to, type) {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const size = this.style.arrowSize;
        
        ctx.save();
        ctx.translate(to.x, to.y);
        ctx.rotate(angle);

        switch (type) {
            case ArrowTypes.ARROW:
            case ArrowTypes.OPEN_ARROW:
                ctx.beginPath();
                ctx.moveTo(-size, -size / 2);
                ctx.lineTo(0, 0);
                ctx.lineTo(-size, size / 2);
                ctx.stroke();
                break;
            case ArrowTypes.FILLED_ARROW:
                ctx.fillStyle = this.style.strokeColor;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-size, -size / 2);
                ctx.lineTo(-size * 0.7, 0);
                ctx.lineTo(-size, size / 2);
                ctx.closePath();
                ctx.fill();
                break;
            case ArrowTypes.DIAMOND:
                ctx.fillStyle = this.style.strokeColor;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-size / 2, -size / 3);
                ctx.lineTo(-size, 0);
                ctx.lineTo(-size / 2, size / 3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case ArrowTypes.CIRCLE:
                ctx.fillStyle = this.style.strokeColor;
                ctx.beginPath();
                ctx.arc(-size / 2, 0, size / 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                break;
        }

        ctx.restore();
    }

    drawLabel(ctx, points) {
        const midIdx = Math.floor(points.length / 2);
        let mx, my;
        if (points.length % 2 === 0) {
            mx = (points[midIdx - 1].x + points[midIdx].x) / 2;
            my = (points[midIdx - 1].y + points[midIdx].y) / 2;
        } else {
            mx = points[midIdx].x;
            my = points[midIdx].y;
        }

        ctx.font = `${this.labelStyle.fontSize}px ${this.labelStyle.fontFamily}`;
        const metrics = ctx.measureText(this.label);
        const tw = metrics.width + this.labelStyle.padding * 2;
        const th = this.labelStyle.fontSize + this.labelStyle.padding * 2;

        ctx.fillStyle = this.labelStyle.backgroundColor;
        ctx.fillRect(mx - tw / 2, my - th / 2, tw, th);
        ctx.strokeStyle = this.style.strokeColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(mx - tw / 2, my - th / 2, tw, th);

        ctx.fillStyle = this.labelStyle.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, mx, my);
    }

    containsPoint(px, py, shapes) {
        const points = this.getPoints(shapes);
        if (points.length < 2) return false;

        const threshold = 8;
        for (let i = 0; i < points.length - 1; i++) {
            const dist = this.pointToSegmentDist(px, py, points[i], points[i + 1]);
            if (dist <= threshold) return true;
        }
        return false;
    }

    pointToSegmentDist(px, py, a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Utils.distance(px, py, a.x, a.y);
        let t = ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
        t = Utils.clamp(t, 0, 1);
        return Utils.distance(px, py, a.x + t * dx, a.y + t * dy);
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            sourceId: this.sourceId,
            targetId: this.targetId,
            sourcePort: this.sourcePort,
            targetPort: this.targetPort,
            sourcePoint: this.sourcePoint,
            targetPoint: this.targetPoint,
            waypoints: [...this.waypoints],
            style: { ...this.style },
            label: this.label,
            labelStyle: { ...this.labelStyle },
            zIndex: this.zIndex,
            visible: this.visible,
            locked: this.locked
        };
    }

    static fromJSON(json) {
        return new Connector(json);
    }
}
