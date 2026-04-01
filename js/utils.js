// FluxoMod - Utility Functions
'use strict';

const Utils = {
    generateId() {
        return 'fm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    },

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    pointInCircle(px, py, cx, cy, r) {
        return Utils.distance(px, py, cx, cy) <= r;
    },

    pointInEllipse(px, py, cx, cy, rx, ry) {
        return ((px - cx) ** 2) / (rx ** 2) + ((py - cy) ** 2) / (ry ** 2) <= 1;
    },

    pointInPolygon(px, py, vertices) {
        let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i].x, yi = vertices[i].y;
            const xj = vertices[j].x, yj = vertices[j].y;
            if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
                inside = !inside;
            }
        }
        return inside;
    },

    rectIntersectsRect(r1, r2) {
        return !(r1.x + r1.width < r2.x || r2.x + r2.width < r1.x ||
                 r1.y + r1.height < r2.y || r2.y + r2.height < r1.y);
    },

    snapToGrid(value, gridSize) {
        return Math.round(value / gridSize) * gridSize;
    },

    degToRad(deg) {
        return deg * Math.PI / 180;
    },

    radToDeg(rad) {
        return rad * 180 / Math.PI;
    },

    rotatePoint(px, py, cx, cy, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = px - cx;
        const dy = py - cy;
        return {
            x: cx + dx * cos - dy * sin,
            y: cy + dx * sin + dy * cos
        };
    },

    getBoundingBox(shapes) {
        if (!shapes.length) return { x: 0, y: 0, width: 0, height: 0 };
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        shapes.forEach(s => {
            minX = Math.min(minX, s.x);
            minY = Math.min(minY, s.y);
            maxX = Math.max(maxX, s.x + s.width);
            maxY = Math.max(maxY, s.y + s.height);
        });
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    },

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    throttle(fn, delay) {
        let last = 0;
        return function (...args) {
            const now = Date.now();
            if (now - last >= delay) {
                last = now;
                fn.apply(this, args);
            }
        };
    },

    debounce(fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    },

    downloadFile(data, filename, type) {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    getLineIntersection(p1, p2, p3, p4) {
        const d1x = p2.x - p1.x, d1y = p2.y - p1.y;
        const d2x = p4.x - p3.x, d2y = p4.y - p3.y;
        const cross = d1x * d2y - d1y * d2x;
        if (Math.abs(cross) < 1e-10) return null;
        const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / cross;
        const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / cross;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return { x: p1.x + t * d1x, y: p1.y + t * d1y };
        }
        return null;
    },

    getConnectionPoint(shape, targetX, targetY) {
        const cx = shape.x + shape.width / 2;
        const cy = shape.y + shape.height / 2;
        const angle = Math.atan2(targetY - cy, targetX - cx);
        const hw = shape.width / 2;
        const hh = shape.height / 2;

        if (shape.type === 'circle' || shape.type === 'ellipse') {
            const rx = hw, ry = hh;
            return {
                x: cx + rx * Math.cos(angle),
                y: cy + ry * Math.sin(angle)
            };
        }

        if (shape.type === 'diamond') {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const t = 1 / (Math.abs(cos) / hw + Math.abs(sin) / hh);
            return { x: cx + t * cos, y: cy + t * sin };
        }

        // Default rectangle
        const tanAngle = Math.tan(angle);
        let px, py;
        if (Math.abs(Math.cos(angle)) * hh > Math.abs(Math.sin(angle)) * hw) {
            px = Math.cos(angle) > 0 ? hw : -hw;
            py = px * tanAngle;
        } else {
            py = Math.sin(angle) > 0 ? hh : -hh;
            px = py / tanAngle;
        }
        return { x: cx + px, y: cy + py };
    }
};
