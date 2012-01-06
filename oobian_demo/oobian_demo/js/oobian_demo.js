

function makeCircle(left, top, oLines, tLines) {
    var circle = new fabric.Circle({
        left: left,
        top: top,
        radius: 20,
        fill: 'green',
        stroke: 'blue',
        opacity: 1
    });

    circle.hasControls = false;
    circle.oLines = oLines;
    circle.tLines = tLines

    return circle;
}

function makeLine(coords) {
    var line = new fabric.Line(coords,
				{
				    selectable: false,
				    opacity: 0.5,
				    fill: 'blue',
                    defaultSize: 100
				});

    return line;
}

function initObjs(ctx) {
    ctx.clear();

    var 
    line = makeLine([100, 100, 200, 200]),
    line1 = makeLine([100, 100, 200, 100]),
    line2 = makeLine([100, 100, 100, 200]);

    ctx.add(line, line1, line2);

    ctx.add(
				makeCircle(line.get('x1'), line.get('y1'), [line, line1, line2], null),
				makeCircle(line.get('x2'), line.get('y2'), null, [line]),
				makeCircle(line1.get('x2'), line1.get('y2'), null, [line1]),
				makeCircle(line2.get('x2'), line.get('y2'), null, [line2])
			);

    ctx.observe('object:moving', function (e) {
        var currentCircle = e.memo.target;

        if (currentCircle.oLines != null) {
            for (var i = 0; i < currentCircle.oLines.length; i++) {
                var oLineIterator = currentCircle.oLines[i];
                oLineIterator.set({ 'x1': currentCircle.left, 'y1': currentCircle.top });
            }
        }

        if (currentCircle.tLines != null) {
            for (var i = 0; i < currentCircle.tLines.length; i++) {
                var tLineIterator = currentCircle.tLines[i];

                tLineIterator.set({ 'x2': currentCircle.left, 'y2': currentCircle.top });
            }
        }

        ctx.renderAll();
    });
}