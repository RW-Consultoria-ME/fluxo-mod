// FluxoMod - Alignment & Distribution
'use strict';

class AlignManager {
    static align(shapes, direction) {
        if (shapes.length < 2) return;

        const bounds = Utils.getBoundingBox(shapes);

        shapes.forEach(shape => {
            switch (direction) {
                case 'left':
                    shape.x = bounds.x;
                    break;
                case 'right':
                    shape.x = bounds.x + bounds.width - shape.width;
                    break;
                case 'top':
                    shape.y = bounds.y;
                    break;
                case 'bottom':
                    shape.y = bounds.y + bounds.height - shape.height;
                    break;
                case 'centerH':
                    shape.x = bounds.x + (bounds.width - shape.width) / 2;
                    break;
                case 'centerV':
                    shape.y = bounds.y + (bounds.height - shape.height) / 2;
                    break;
            }
            shape.ports = shape.calculatePorts();
        });
    }

    static distribute(shapes, direction) {
        if (shapes.length < 3) return;

        const sorted = [...shapes].sort((a, b) => {
            return direction === 'horizontal' ? a.x - b.x : a.y - b.y;
        });

        if (direction === 'horizontal') {
            const totalWidth = sorted.reduce((sum, s) => sum + s.width, 0);
            const bounds = Utils.getBoundingBox(shapes);
            const gap = (bounds.width - totalWidth) / (shapes.length - 1);
            let currentX = sorted[0].x;

            sorted.forEach((shape, i) => {
                if (i === 0) return;
                currentX += sorted[i - 1].width + gap;
                shape.x = currentX;
                shape.ports = shape.calculatePorts();
            });
        } else {
            const totalHeight = sorted.reduce((sum, s) => sum + s.height, 0);
            const bounds = Utils.getBoundingBox(shapes);
            const gap = (bounds.height - totalHeight) / (shapes.length - 1);
            let currentY = sorted[0].y;

            sorted.forEach((shape, i) => {
                if (i === 0) return;
                currentY += sorted[i - 1].height + gap;
                shape.y = currentY;
                shape.ports = shape.calculatePorts();
            });
        }
    }

    static matchSize(shapes, dimension) {
        if (shapes.length < 2) return;
        const first = shapes[0];

        shapes.forEach((shape, i) => {
            if (i === 0) return;
            if (dimension === 'width' || dimension === 'both') {
                shape.width = first.width;
            }
            if (dimension === 'height' || dimension === 'both') {
                shape.height = first.height;
            }
            shape.ports = shape.calculatePorts();
        });
    }
}
