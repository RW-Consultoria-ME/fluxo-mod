// FluxoMod - Shape Definitions & Factory
'use strict';

const ShapeTypes = {
    RECTANGLE: 'rectangle',
    ROUNDED_RECT: 'roundedRect',
    CIRCLE: 'circle',
    ELLIPSE: 'ellipse',
    DIAMOND: 'diamond',
    TRIANGLE: 'triangle',
    PARALLELOGRAM: 'parallelogram',
    HEXAGON: 'hexagon',
    STAR: 'star',
    CYLINDER: 'cylinder',
    ARROW_RIGHT: 'arrowRight',
    PLUS: 'plus',
    CLOUD: 'cloud',
    CALLOUT: 'callout',
    DOCUMENT: 'document',
    DATABASE: 'database',
    PROCESS: 'process',
    DECISION: 'decision',
    TERMINATOR: 'terminator',
    DATA: 'data',
    DELAY: 'delay',
    DISPLAY: 'display',
    MANUAL_INPUT: 'manualInput',
    PREPARATION: 'preparation',
    STORED_DATA: 'storedData',
    INTERNAL_STORAGE: 'internalStorage',
    MANUAL_OPERATION: 'manualOperation',
    MERGE: 'merge',
    CONNECTOR_SHAPE: 'connectorShape',
    OR: 'or',
    SUMMING_JUNCTION: 'summingJunction',
    PREDEFINED_PROCESS: 'predefinedProcess',
    NOTE: 'note',
    TEXT: 'text',
    IMAGE: 'image',
    SWIMLANE_H: 'swimlaneH',
    SWIMLANE_V: 'swimlaneV'
};

const ShapeCategories = {
    'Básico': [
        ShapeTypes.RECTANGLE, ShapeTypes.ROUNDED_RECT, ShapeTypes.CIRCLE,
        ShapeTypes.ELLIPSE, ShapeTypes.DIAMOND, ShapeTypes.TRIANGLE,
        ShapeTypes.PARALLELOGRAM, ShapeTypes.HEXAGON, ShapeTypes.STAR,
        ShapeTypes.PLUS, ShapeTypes.ARROW_RIGHT, ShapeTypes.NOTE, ShapeTypes.TEXT
    ],
    'Fluxograma': [
        ShapeTypes.PROCESS, ShapeTypes.DECISION, ShapeTypes.TERMINATOR,
        ShapeTypes.DATA, ShapeTypes.PREDEFINED_PROCESS, ShapeTypes.DOCUMENT,
        ShapeTypes.DATABASE, ShapeTypes.DELAY, ShapeTypes.DISPLAY,
        ShapeTypes.MANUAL_INPUT, ShapeTypes.PREPARATION, ShapeTypes.STORED_DATA,
        ShapeTypes.INTERNAL_STORAGE, ShapeTypes.MANUAL_OPERATION, ShapeTypes.MERGE,
        ShapeTypes.CONNECTOR_SHAPE, ShapeTypes.OR, ShapeTypes.SUMMING_JUNCTION
    ],
    'Containers': [
        ShapeTypes.CYLINDER, ShapeTypes.CLOUD, ShapeTypes.CALLOUT,
        ShapeTypes.SWIMLANE_H, ShapeTypes.SWIMLANE_V
    ]
};

const ShapeNames = {
    [ShapeTypes.RECTANGLE]: 'Retângulo',
    [ShapeTypes.ROUNDED_RECT]: 'Retângulo Arredondado',
    [ShapeTypes.CIRCLE]: 'Círculo',
    [ShapeTypes.ELLIPSE]: 'Elipse',
    [ShapeTypes.DIAMOND]: 'Losango',
    [ShapeTypes.TRIANGLE]: 'Triângulo',
    [ShapeTypes.PARALLELOGRAM]: 'Paralelogramo',
    [ShapeTypes.HEXAGON]: 'Hexágono',
    [ShapeTypes.STAR]: 'Estrela',
    [ShapeTypes.CYLINDER]: 'Cilindro',
    [ShapeTypes.ARROW_RIGHT]: 'Seta',
    [ShapeTypes.PLUS]: 'Cruz',
    [ShapeTypes.CLOUD]: 'Nuvem',
    [ShapeTypes.CALLOUT]: 'Balão',
    [ShapeTypes.DOCUMENT]: 'Documento',
    [ShapeTypes.DATABASE]: 'Banco de Dados',
    [ShapeTypes.PROCESS]: 'Processo',
    [ShapeTypes.DECISION]: 'Decisão',
    [ShapeTypes.TERMINATOR]: 'Terminador',
    [ShapeTypes.DATA]: 'Dados',
    [ShapeTypes.DELAY]: 'Atraso',
    [ShapeTypes.DISPLAY]: 'Exibição',
    [ShapeTypes.MANUAL_INPUT]: 'Entrada Manual',
    [ShapeTypes.PREPARATION]: 'Preparação',
    [ShapeTypes.STORED_DATA]: 'Dados Armazenados',
    [ShapeTypes.INTERNAL_STORAGE]: 'Armazenamento Interno',
    [ShapeTypes.MANUAL_OPERATION]: 'Operação Manual',
    [ShapeTypes.MERGE]: 'Junção',
    [ShapeTypes.CONNECTOR_SHAPE]: 'Conector',
    [ShapeTypes.OR]: 'OU',
    [ShapeTypes.SUMMING_JUNCTION]: 'Junção Soma',
    [ShapeTypes.PREDEFINED_PROCESS]: 'Processo Predefinido',
    [ShapeTypes.NOTE]: 'Nota',
    [ShapeTypes.TEXT]: 'Texto',
    [ShapeTypes.IMAGE]: 'Imagem',
    [ShapeTypes.SWIMLANE_H]: 'Swimlane Horizontal',
    [ShapeTypes.SWIMLANE_V]: 'Swimlane Vertical'
};

const DefaultShapeStyle = {
    fillColor: '#ffffff',
    strokeColor: '#2d3436',
    strokeWidth: 2,
    strokeStyle: 'solid', // solid, dashed, dotted
    opacity: 1,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    cornerRadius: 0,
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textColor: '#2d3436',
    textAlign: 'center',
    textVerticalAlign: 'middle',
    lineHeight: 1.4,
    padding: 8
};

class Shape {
    constructor(type, x, y, width, height, options = {}) {
        this.id = options.id || Utils.generateId();
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = width || this.getDefaultWidth();
        this.height = height || this.getDefaultHeight();
        this.rotation = options.rotation || 0;
        this.text = options.text || '';
        this.style = { ...DefaultShapeStyle, ...options.style };
        this.locked = options.locked || false;
        this.visible = options.visible !== undefined ? options.visible : true;
        this.name = options.name || ShapeNames[type] || type;
        this.groupId = options.groupId || null;
        this.zIndex = options.zIndex || 0;
        this.connections = options.connections || [];
        this.data = options.data || {};
        this.ports = this.calculatePorts();
    }

    getDefaultWidth() {
        const defaults = {
            [ShapeTypes.CIRCLE]: 80,
            [ShapeTypes.CONNECTOR_SHAPE]: 40,
            [ShapeTypes.TEXT]: 150,
            [ShapeTypes.SWIMLANE_H]: 600,
            [ShapeTypes.SWIMLANE_V]: 200,
        };
        return defaults[this.type] || 140;
    }

    getDefaultHeight() {
        const defaults = {
            [ShapeTypes.CIRCLE]: 80,
            [ShapeTypes.CONNECTOR_SHAPE]: 40,
            [ShapeTypes.TEXT]: 40,
            [ShapeTypes.SWIMLANE_H]: 200,
            [ShapeTypes.SWIMLANE_V]: 600,
        };
        return defaults[this.type] || 80;
    }

    calculatePorts() {
        const cx = this.width / 2;
        const cy = this.height / 2;
        return [
            { id: 'top', x: cx, y: 0, side: 'top' },
            { id: 'right', x: this.width, y: cy, side: 'right' },
            { id: 'bottom', x: cx, y: this.height, side: 'bottom' },
            { id: 'left', x: 0, y: cy, side: 'left' }
        ];
    }

    getAbsolutePort(portId) {
        const port = this.ports.find(p => p.id === portId);
        if (!port) return null;
        return { x: this.x + port.x, y: this.y + port.y };
    }

    getCenter() {
        return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    containsPoint(px, py) {
        if (this.rotation !== 0) {
            const center = this.getCenter();
            const rotated = Utils.rotatePoint(px, py, center.x, center.y, -Utils.degToRad(this.rotation));
            px = rotated.x;
            py = rotated.y;
        }

        switch (this.type) {
            case ShapeTypes.CIRCLE:
                return Utils.pointInCircle(px, py, this.x + this.width / 2, this.y + this.height / 2, this.width / 2);
            case ShapeTypes.ELLIPSE:
            case ShapeTypes.TERMINATOR:
                return Utils.pointInEllipse(px, py, this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2);
            case ShapeTypes.DIAMOND:
            case ShapeTypes.DECISION:
                return Utils.pointInPolygon(px, py, this.getDiamondVertices());
            case ShapeTypes.TRIANGLE:
            case ShapeTypes.MERGE:
                return Utils.pointInPolygon(px, py, this.getTriangleVertices());
            default:
                return Utils.pointInRect(px, py, this.x, this.y, this.width, this.height);
        }
    }

    getDiamondVertices() {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        return [
            { x: cx, y: this.y },
            { x: this.x + this.width, y: cy },
            { x: cx, y: this.y + this.height },
            { x: this.x, y: cy }
        ];
    }

    getTriangleVertices() {
        return [
            { x: this.x + this.width / 2, y: this.y },
            { x: this.x + this.width, y: this.y + this.height },
            { x: this.x, y: this.y + this.height }
        ];
    }

    getNearestPort(px, py) {
        let nearest = null;
        let minDist = Infinity;
        this.ports.forEach(port => {
            const ax = this.x + port.x;
            const ay = this.y + port.y;
            const d = Utils.distance(px, py, ax, ay);
            if (d < minDist) {
                minDist = d;
                nearest = port;
            }
        });
        return { port: nearest, distance: minDist };
    }

    clone() {
        const cloned = new Shape(this.type, this.x + 20, this.y + 20, this.width, this.height, {
            rotation: this.rotation,
            text: this.text,
            style: { ...this.style },
            name: this.name + ' (cópia)',
            data: Utils.deepClone(this.data)
        });
        return cloned;
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            rotation: this.rotation,
            text: this.text,
            style: { ...this.style },
            locked: this.locked,
            visible: this.visible,
            name: this.name,
            groupId: this.groupId,
            zIndex: this.zIndex,
            connections: [...this.connections],
            data: Utils.deepClone(this.data)
        };
    }

    static fromJSON(json) {
        return new Shape(json.type, json.x, json.y, json.width, json.height, {
            id: json.id,
            rotation: json.rotation,
            text: json.text,
            style: json.style,
            locked: json.locked,
            visible: json.visible,
            name: json.name,
            groupId: json.groupId,
            zIndex: json.zIndex,
            connections: json.connections,
            data: json.data
        });
    }

    draw(ctx) {
        ctx.save();

        if (this.rotation !== 0) {
            const center = this.getCenter();
            ctx.translate(center.x, center.y);
            ctx.rotate(Utils.degToRad(this.rotation));
            ctx.translate(-center.x, -center.y);
        }

        ctx.globalAlpha = this.style.opacity;

        if (this.style.shadowBlur > 0) {
            ctx.shadowColor = this.style.shadowColor;
            ctx.shadowBlur = this.style.shadowBlur;
            ctx.shadowOffsetX = this.style.shadowOffsetX;
            ctx.shadowOffsetY = this.style.shadowOffsetY;
        }

        this.drawShape(ctx);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        if (this.text) {
            this.drawText(ctx);
        }

        ctx.restore();
    }

    drawShape(ctx) {
        ctx.fillStyle = this.style.fillColor;
        ctx.strokeStyle = this.style.strokeColor;
        ctx.lineWidth = this.style.strokeWidth;

        if (this.style.strokeStyle === 'dashed') {
            ctx.setLineDash([8, 4]);
        } else if (this.style.strokeStyle === 'dotted') {
            ctx.setLineDash([2, 4]);
        } else {
            ctx.setLineDash([]);
        }

        switch (this.type) {
            case ShapeTypes.RECTANGLE:
            case ShapeTypes.PROCESS:
                this.drawRect(ctx);
                break;
            case ShapeTypes.ROUNDED_RECT:
                this.drawRoundedRect(ctx, this.style.cornerRadius || 12);
                break;
            case ShapeTypes.CIRCLE:
                this.drawCircle(ctx);
                break;
            case ShapeTypes.ELLIPSE:
                this.drawEllipse(ctx);
                break;
            case ShapeTypes.DIAMOND:
            case ShapeTypes.DECISION:
                this.drawDiamond(ctx);
                break;
            case ShapeTypes.TRIANGLE:
                this.drawTriangle(ctx);
                break;
            case ShapeTypes.PARALLELOGRAM:
            case ShapeTypes.DATA:
                this.drawParallelogram(ctx);
                break;
            case ShapeTypes.HEXAGON:
            case ShapeTypes.PREPARATION:
                this.drawHexagon(ctx);
                break;
            case ShapeTypes.STAR:
                this.drawStar(ctx);
                break;
            case ShapeTypes.CYLINDER:
            case ShapeTypes.DATABASE:
                this.drawCylinder(ctx);
                break;
            case ShapeTypes.ARROW_RIGHT:
                this.drawArrowRight(ctx);
                break;
            case ShapeTypes.PLUS:
                this.drawPlus(ctx);
                break;
            case ShapeTypes.CLOUD:
                this.drawCloud(ctx);
                break;
            case ShapeTypes.CALLOUT:
                this.drawCallout(ctx);
                break;
            case ShapeTypes.DOCUMENT:
                this.drawDocument(ctx);
                break;
            case ShapeTypes.TERMINATOR:
                this.drawTerminator(ctx);
                break;
            case ShapeTypes.DELAY:
                this.drawDelay(ctx);
                break;
            case ShapeTypes.DISPLAY:
                this.drawDisplay(ctx);
                break;
            case ShapeTypes.MANUAL_INPUT:
                this.drawManualInput(ctx);
                break;
            case ShapeTypes.STORED_DATA:
                this.drawStoredData(ctx);
                break;
            case ShapeTypes.INTERNAL_STORAGE:
                this.drawInternalStorage(ctx);
                break;
            case ShapeTypes.MANUAL_OPERATION:
                this.drawManualOperation(ctx);
                break;
            case ShapeTypes.MERGE:
                this.drawMerge(ctx);
                break;
            case ShapeTypes.CONNECTOR_SHAPE:
                this.drawConnectorShape(ctx);
                break;
            case ShapeTypes.OR:
                this.drawOr(ctx);
                break;
            case ShapeTypes.SUMMING_JUNCTION:
                this.drawSummingJunction(ctx);
                break;
            case ShapeTypes.PREDEFINED_PROCESS:
                this.drawPredefinedProcess(ctx);
                break;
            case ShapeTypes.NOTE:
                this.drawNote(ctx);
                break;
            case ShapeTypes.TEXT:
                break;
            case ShapeTypes.SWIMLANE_H:
                this.drawSwimlaneH(ctx);
                break;
            case ShapeTypes.SWIMLANE_V:
                this.drawSwimlaneV(ctx);
                break;
            default:
                this.drawRect(ctx);
        }

        ctx.setLineDash([]);
    }

    drawRect(ctx) {
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    drawRoundedRect(ctx, r) {
        r = Math.min(r, this.width / 2, this.height / 2);
        ctx.beginPath();
        ctx.moveTo(this.x + r, this.y);
        ctx.lineTo(this.x + this.width - r, this.y);
        ctx.arcTo(this.x + this.width, this.y, this.x + this.width, this.y + r, r);
        ctx.lineTo(this.x + this.width, this.y + this.height - r);
        ctx.arcTo(this.x + this.width, this.y + this.height, this.x + this.width - r, this.y + this.height, r);
        ctx.lineTo(this.x + r, this.y + this.height);
        ctx.arcTo(this.x, this.y + this.height, this.x, this.y + this.height - r, r);
        ctx.lineTo(this.x, this.y + r);
        ctx.arcTo(this.x, this.y, this.x + r, this.y, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawCircle(ctx) {
        const r = Math.min(this.width, this.height) / 2;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    drawEllipse(ctx) {
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    drawDiamond(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        ctx.beginPath();
        ctx.moveTo(cx, this.y);
        ctx.lineTo(this.x + this.width, cy);
        ctx.lineTo(cx, this.y + this.height);
        ctx.lineTo(this.x, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawTriangle(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawParallelogram(ctx) {
        const offset = this.width * 0.2;
        ctx.beginPath();
        ctx.moveTo(this.x + offset, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width - offset, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawHexagon(ctx) {
        const offset = this.width * 0.2;
        const cy = this.y + this.height / 2;
        ctx.beginPath();
        ctx.moveTo(this.x + offset, this.y);
        ctx.lineTo(this.x + this.width - offset, this.y);
        ctx.lineTo(this.x + this.width, cy);
        ctx.lineTo(this.x + this.width - offset, this.y + this.height);
        ctx.lineTo(this.x + offset, this.y + this.height);
        ctx.lineTo(this.x, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawStar(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const outerR = Math.min(this.width, this.height) / 2;
        const innerR = outerR * 0.4;
        const points = 5;
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI / points) - Math.PI / 2;
            const method = i === 0 ? 'moveTo' : 'lineTo';
            ctx[method](cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawCylinder(ctx) {
        const ry = this.height * 0.12;
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + ry, this.width / 2, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.x, this.y + ry);
        ctx.lineTo(this.x, this.y + this.height - ry);
        ctx.ellipse(this.x + this.width / 2, this.y + this.height - ry, this.width / 2, ry, 0, Math.PI, 0, true);
        ctx.lineTo(this.x + this.width, this.y + ry);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + ry, this.width / 2, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    drawArrowRight(ctx) {
        const notchX = this.width * 0.65;
        const notchY = this.height * 0.25;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + notchY);
        ctx.lineTo(this.x + notchX, this.y + notchY);
        ctx.lineTo(this.x + notchX, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height / 2);
        ctx.lineTo(this.x + notchX, this.y + this.height);
        ctx.lineTo(this.x + notchX, this.y + this.height - notchY);
        ctx.lineTo(this.x, this.y + this.height - notchY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawPlus(ctx) {
        const t = Math.min(this.width, this.height) * 0.3;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        ctx.beginPath();
        ctx.moveTo(cx - t / 2, this.y);
        ctx.lineTo(cx + t / 2, this.y);
        ctx.lineTo(cx + t / 2, cy - t / 2);
        ctx.lineTo(this.x + this.width, cy - t / 2);
        ctx.lineTo(this.x + this.width, cy + t / 2);
        ctx.lineTo(cx + t / 2, cy + t / 2);
        ctx.lineTo(cx + t / 2, this.y + this.height);
        ctx.lineTo(cx - t / 2, this.y + this.height);
        ctx.lineTo(cx - t / 2, cy + t / 2);
        ctx.lineTo(this.x, cy + t / 2);
        ctx.lineTo(this.x, cy - t / 2);
        ctx.lineTo(cx - t / 2, cy - t / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawCloud(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.25, this.y + this.height * 0.8);
        ctx.bezierCurveTo(this.x - this.width * 0.05, this.y + this.height * 0.8, this.x - this.width * 0.05, this.y + this.height * 0.35, this.x + this.width * 0.2, this.y + this.height * 0.35);
        ctx.bezierCurveTo(this.x + this.width * 0.15, this.y + this.height * 0.05, this.x + this.width * 0.45, this.y + this.height * 0.05, this.x + this.width * 0.5, this.y + this.height * 0.2);
        ctx.bezierCurveTo(this.x + this.width * 0.55, this.y + this.height * 0.05, this.x + this.width * 0.85, this.y + this.height * 0.1, this.x + this.width * 0.85, this.y + this.height * 0.35);
        ctx.bezierCurveTo(this.x + this.width * 1.05, this.y + this.height * 0.35, this.x + this.width * 1.05, this.y + this.height * 0.75, this.x + this.width * 0.75, this.y + this.height * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawCallout(ctx) {
        const r = 10;
        const tailH = this.height * 0.2;
        const bodyH = this.height - tailH;
        const tailW = this.width * 0.1;
        const tailX = this.x + this.width * 0.25;

        ctx.beginPath();
        ctx.moveTo(this.x + r, this.y);
        ctx.lineTo(this.x + this.width - r, this.y);
        ctx.arcTo(this.x + this.width, this.y, this.x + this.width, this.y + r, r);
        ctx.lineTo(this.x + this.width, this.y + bodyH - r);
        ctx.arcTo(this.x + this.width, this.y + bodyH, this.x + this.width - r, this.y + bodyH, r);
        ctx.lineTo(tailX + tailW, this.y + bodyH);
        ctx.lineTo(tailX, this.y + this.height);
        ctx.lineTo(tailX - tailW * 0.5, this.y + bodyH);
        ctx.lineTo(this.x + r, this.y + bodyH);
        ctx.arcTo(this.x, this.y + bodyH, this.x, this.y + bodyH - r, r);
        ctx.lineTo(this.x, this.y + r);
        ctx.arcTo(this.x, this.y, this.x + r, this.y, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawDocument(ctx) {
        const waveH = this.height * 0.15;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height - waveH);
        ctx.bezierCurveTo(
            this.x + this.width * 0.75, this.y + this.height - waveH * 2.5,
            this.x + this.width * 0.25, this.y + this.height + waveH * 0.5,
            this.x, this.y + this.height - waveH
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawTerminator(ctx) {
        const r = this.height / 2;
        ctx.beginPath();
        ctx.moveTo(this.x + r, this.y);
        ctx.lineTo(this.x + this.width - r, this.y);
        ctx.arc(this.x + this.width - r, this.y + r, r, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(this.x + r, this.y + this.height);
        ctx.arc(this.x + r, this.y + r, r, Math.PI / 2, -Math.PI / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawDelay(ctx) {
        const r = this.height / 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width - r, this.y);
        ctx.arc(this.x + this.width - r, this.y + r, r, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawDisplay(ctx) {
        const curveW = this.width * 0.2;
        ctx.beginPath();
        ctx.moveTo(this.x + curveW, this.y);
        ctx.lineTo(this.x + this.width - curveW, this.y);
        ctx.quadraticCurveTo(this.x + this.width, this.y + this.height / 2, this.x + this.width - curveW, this.y + this.height);
        ctx.lineTo(this.x + curveW, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawManualInput(ctx) {
        const slopeH = this.height * 0.25;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + slopeH);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawStoredData(ctx) {
        const curveW = this.width * 0.15;
        ctx.beginPath();
        ctx.moveTo(this.x + curveW, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.bezierCurveTo(this.x + this.width - curveW * 2, this.y + this.height * 0.33, this.x + this.width - curveW * 2, this.y + this.height * 0.67, this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x + curveW, this.y + this.height);
        ctx.bezierCurveTo(this.x - curveW, this.y + this.height * 0.67, this.x - curveW, this.y + this.height * 0.33, this.x + curveW, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawInternalStorage(ctx) {
        this.drawRect(ctx);
        const offset = 15;
        ctx.beginPath();
        ctx.moveTo(this.x + offset, this.y);
        ctx.lineTo(this.x + offset, this.y + this.height);
        ctx.moveTo(this.x, this.y + offset);
        ctx.lineTo(this.x + this.width, this.y + offset);
        ctx.stroke();
    }

    drawManualOperation(ctx) {
        const inset = this.width * 0.2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width - inset, this.y + this.height);
        ctx.lineTo(this.x + inset, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawMerge(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawConnectorShape(ctx) {
        const r = Math.min(this.width, this.height) / 2;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    drawOr(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const r = Math.min(this.width, this.height) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, this.y);
        ctx.lineTo(cx, this.y + this.height);
        ctx.moveTo(this.x, cy);
        ctx.lineTo(this.x + this.width, cy);
        ctx.stroke();
    }

    drawSummingJunction(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const r = Math.min(this.width, this.height) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const d = r * 0.707;
        ctx.beginPath();
        ctx.moveTo(cx - d, cy - d);
        ctx.lineTo(cx + d, cy + d);
        ctx.moveTo(cx + d, cy - d);
        ctx.lineTo(cx - d, cy + d);
        ctx.stroke();
    }

    drawPredefinedProcess(ctx) {
        this.drawRect(ctx);
        const inset = this.width * 0.1;
        ctx.beginPath();
        ctx.moveTo(this.x + inset, this.y);
        ctx.lineTo(this.x + inset, this.y + this.height);
        ctx.moveTo(this.x + this.width - inset, this.y);
        ctx.lineTo(this.x + this.width - inset, this.y + this.height);
        ctx.stroke();
    }

    drawNote(ctx) {
        const fold = 15;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width - fold, this.y);
        ctx.lineTo(this.x + this.width, this.y + fold);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + this.width - fold, this.y);
        ctx.lineTo(this.x + this.width - fold, this.y + fold);
        ctx.lineTo(this.x + this.width, this.y + fold);
        ctx.stroke();
    }

    drawSwimlaneH(ctx) {
        const headerW = 80;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.beginPath();
        ctx.moveTo(this.x + headerW, this.y);
        ctx.lineTo(this.x + headerW, this.y + this.height);
        ctx.stroke();
    }

    drawSwimlaneV(ctx) {
        const headerH = 40;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + headerH);
        ctx.lineTo(this.x + this.width, this.y + headerH);
        ctx.stroke();
    }

    drawText(ctx) {
        const padding = this.style.padding;
        const maxWidth = this.width - padding * 2;
        const fontSize = this.style.fontSize;
        const lineHeight = fontSize * this.style.lineHeight;

        ctx.fillStyle = this.style.textColor;
        ctx.font = `${this.style.fontStyle} ${this.style.fontWeight} ${fontSize}px ${this.style.fontFamily}`;
        ctx.textAlign = this.style.textAlign;
        ctx.textBaseline = 'top';

        const lines = this.wrapText(ctx, this.text, maxWidth);
        const totalH = lines.length * lineHeight;

        let startY;
        if (this.style.textVerticalAlign === 'top') {
            startY = this.y + padding;
        } else if (this.style.textVerticalAlign === 'bottom') {
            startY = this.y + this.height - totalH - padding;
        } else {
            startY = this.y + (this.height - totalH) / 2;
        }

        let textX;
        if (this.style.textAlign === 'left') {
            textX = this.x + padding;
        } else if (this.style.textAlign === 'right') {
            textX = this.x + this.width - padding;
        } else {
            textX = this.x + this.width / 2;
        }

        lines.forEach((line, i) => {
            ctx.fillText(line, textX, startY + i * lineHeight);
        });
    }

    wrapText(ctx, text, maxWidth) {
        if (!text) return [];
        const paragraphs = text.split('\n');
        const lines = [];
        paragraphs.forEach(para => {
            if (!para) { lines.push(''); return; }
            const words = para.split(' ');
            let currentLine = words[0];
            for (let i = 1; i < words.length; i++) {
                const testLine = currentLine + ' ' + words[i];
                if (ctx.measureText(testLine).width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = words[i];
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);
        });
        return lines;
    }
}
