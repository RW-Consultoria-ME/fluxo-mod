// FluxoMod - Export System
'use strict';

class ExportManager {
    static exportPNG(app, options = {}) {
        const scale = options.scale || 2;
        const padding = options.padding || 40;
        const background = options.background || '#ffffff';
        const transparent = options.transparent || false;

        const bounds = Utils.getBoundingBox(app.shapes);
        if (bounds.width === 0 || bounds.height === 0) {
            alert('Nenhum elemento para exportar.');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = (bounds.width + padding * 2) * scale;
        canvas.height = (bounds.height + padding * 2) * scale;
        const ctx = canvas.getContext('2d');

        ctx.scale(scale, scale);

        if (!transparent) {
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
        }

        ctx.translate(-bounds.x + padding, -bounds.y + padding);

        // Draw connectors first
        app.connectors.forEach(c => {
            if (c.visible) c.draw(ctx, app.shapes);
        });

        // Draw shapes
        app.shapes.forEach(s => {
            if (s.visible) s.draw(ctx);
        });

        canvas.toBlob(blob => {
            const filename = (app.projectName || 'diagrama') + '.png';
            Utils.downloadFile(blob, filename, 'image/png');
        }, 'image/png');
    }

    static exportSVG(app, options = {}) {
        const padding = options.padding || 40;
        const bounds = Utils.getBoundingBox(app.shapes);
        if (bounds.width === 0 || bounds.height === 0) {
            alert('Nenhum elemento para exportar.');
            return;
        }

        const width = bounds.width + padding * 2;
        const height = bounds.height + padding * 2;
        const ox = bounds.x - padding;
        const oy = bounds.y - padding;

        let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${ox} ${oy} ${width} ${height}">\n`;
        svg += `  <rect x="${ox}" y="${oy}" width="${width}" height="${height}" fill="white"/>\n`;

        // Export shapes
        app.shapes.forEach(shape => {
            if (!shape.visible) return;
            svg += this.shapeToSVG(shape);
        });

        // Export connectors
        app.connectors.forEach(conn => {
            if (!conn.visible) return;
            svg += this.connectorToSVG(conn, app.shapes);
        });

        svg += `</svg>`;

        const filename = (app.projectName || 'diagrama') + '.svg';
        Utils.downloadFile(svg, filename, 'image/svg+xml');
    }

    static shapeToSVG(shape) {
        let svg = '';
        const s = shape.style;
        const commonAttrs = `fill="${s.fillColor}" stroke="${s.strokeColor}" stroke-width="${s.strokeWidth}" opacity="${s.opacity}"`;

        switch (shape.type) {
            case ShapeTypes.RECTANGLE:
            case ShapeTypes.PROCESS:
                svg += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" ${commonAttrs}/>\n`;
                break;
            case ShapeTypes.ROUNDED_RECT:
                const r = s.cornerRadius || 12;
                svg += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="${r}" ry="${r}" ${commonAttrs}/>\n`;
                break;
            case ShapeTypes.CIRCLE:
                const cr = Math.min(shape.width, shape.height) / 2;
                svg += `  <circle cx="${shape.x + shape.width / 2}" cy="${shape.y + shape.height / 2}" r="${cr}" ${commonAttrs}/>\n`;
                break;
            case ShapeTypes.ELLIPSE:
                svg += `  <ellipse cx="${shape.x + shape.width / 2}" cy="${shape.y + shape.height / 2}" rx="${shape.width / 2}" ry="${shape.height / 2}" ${commonAttrs}/>\n`;
                break;
            case ShapeTypes.DIAMOND:
            case ShapeTypes.DECISION:
                const cx = shape.x + shape.width / 2;
                const cy = shape.y + shape.height / 2;
                svg += `  <polygon points="${cx},${shape.y} ${shape.x + shape.width},${cy} ${cx},${shape.y + shape.height} ${shape.x},${cy}" ${commonAttrs}/>\n`;
                break;
            default:
                svg += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" ${commonAttrs}/>\n`;
        }

        if (shape.text) {
            const tx = shape.x + shape.width / 2;
            const ty = shape.y + shape.height / 2;
            svg += `  <text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="central" font-size="${s.fontSize}" font-family="${s.fontFamily}" fill="${s.textColor}">${this.escapeXml(shape.text)}</text>\n`;
        }

        return svg;
    }

    static connectorToSVG(conn, shapes) {
        const points = conn.getPoints(shapes);
        if (points.length < 2) return '';

        const s = conn.style;
        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            pathD += ` L ${points[i].x} ${points[i].y}`;
        }

        let dasharray = '';
        if (s.strokeStyle === 'dashed') dasharray = ' stroke-dasharray="8,4"';
        if (s.strokeStyle === 'dotted') dasharray = ' stroke-dasharray="2,4"';

        let markerId = `marker_${conn.id}`;
        let svg = '';

        if (s.endArrow !== ArrowTypes.NONE) {
            svg += `  <defs><marker id="${markerId}" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="${s.strokeColor}"/></marker></defs>\n`;
        }

        svg += `  <path d="${pathD}" fill="none" stroke="${s.strokeColor}" stroke-width="${s.strokeWidth}"${dasharray}`;
        if (s.endArrow !== ArrowTypes.NONE) {
            svg += ` marker-end="url(#${markerId})"`;
        }
        svg += `/>\n`;

        return svg;
    }

    static escapeXml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    static exportJSON(app) {
        const data = {
            version: '1.0',
            name: app.projectName,
            created: new Date().toISOString(),
            shapes: app.shapes.map(s => s.toJSON()),
            connectors: app.connectors.map(c => c.toJSON()),
            viewport: { ...app.viewport },
            grid: {
                size: app.grid.size,
                visible: app.grid.visible,
                snapEnabled: app.grid.snapEnabled,
                type: app.grid.type
            },
            pages: app.pages || []
        };

        const json = JSON.stringify(data, null, 2);
        const filename = (app.projectName || 'diagrama') + '.fluxo';
        Utils.downloadFile(json, filename, 'application/json');
    }

    static importJSON(app, jsonString) {
        try {
            const data = JSON.parse(jsonString);
            app.shapes = (data.shapes || []).map(s => Shape.fromJSON(s));
            app.connectors = (data.connectors || []).map(c => Connector.fromJSON(c));
            app.projectName = data.name || 'Sem título';

            if (data.viewport) {
                app.viewport = { ...app.viewport, ...data.viewport };
            }
            if (data.grid) {
                Object.assign(app.grid, data.grid);
            }

            app.history.clear();
            app.selection.clearSelection();
            app.render();
            app.updateTitle();
            return true;
        } catch (e) {
            alert('Erro ao importar arquivo: ' + e.message);
            return false;
        }
    }
}
