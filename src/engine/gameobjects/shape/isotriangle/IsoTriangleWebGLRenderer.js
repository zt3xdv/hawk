var GetCalcMatrix = require('../../GetCalcMatrix');
var Utils = require('../../../renderer/webgl/Utils');

var IsoTriangleWebGLRenderer = function (renderer, src, camera, parentMatrix)
{
    camera.addToRenderList(src);

    var pipeline = renderer.pipelines.set(src.pipeline);

    var result = GetCalcMatrix(src, camera, parentMatrix);

    var calcMatrix = pipeline.calcMatrix.copyFrom(result.calc);

    var size = src.width;
    var height = src.height;

    var sizeA = size / 2;
    var sizeB = size / src.projection;

    var reversed = src.isReversed;

    var alpha = camera.alpha * src.alpha;

    if (!src.isFilled)
    {
        return;
    }

    renderer.pipelines.preBatch(src);

    var tint;

    var x0;
    var y0;

    var x1;
    var y1;

    var x2;
    var y2;

    if (src.showTop && reversed)
    {
        tint = Utils.getTintAppendFloatAlpha(src.fillTop, alpha);

        x0 = calcMatrix.getX(-sizeA, -height);
        y0 = calcMatrix.getY(-sizeA, -height);

        x1 = calcMatrix.getX(0, -sizeB - height);
        y1 = calcMatrix.getY(0, -sizeB - height);

        x2 = calcMatrix.getX(sizeA, -height);
        y2 = calcMatrix.getY(sizeA, -height);

        var x3 = calcMatrix.getX(0, sizeB - height);
        var y3 = calcMatrix.getY(0, sizeB - height);

        pipeline.batchQuad(src, x0, y0, x1, y1, x2, y2, x3, y3, 0, 0, 1, 1, tint, tint, tint, tint, 2);
    }

    if (src.showLeft)
    {
        tint = Utils.getTintAppendFloatAlpha(src.fillLeft, alpha);

        if (reversed)
        {
            x0 = calcMatrix.getX(-sizeA, -height);
            y0 = calcMatrix.getY(-sizeA, -height);

            x1 = calcMatrix.getX(0, sizeB);
            y1 = calcMatrix.getY(0, sizeB);

            x2 = calcMatrix.getX(0, sizeB - height);
            y2 = calcMatrix.getY(0, sizeB - height);
        }
        else
        {
            x0 = calcMatrix.getX(-sizeA, 0);
            y0 = calcMatrix.getY(-sizeA, 0);

            x1 = calcMatrix.getX(0, sizeB);
            y1 = calcMatrix.getY(0, sizeB);

            x2 = calcMatrix.getX(0, sizeB - height);
            y2 = calcMatrix.getY(0, sizeB - height);
        }

        pipeline.batchTri(src, x0, y0, x1, y1, x2, y2, 0, 0, 1, 1, tint, tint, tint, 2);
    }

    if (src.showRight)
    {
        tint = Utils.getTintAppendFloatAlpha(src.fillRight, alpha);

        if (reversed)
        {
            x0 = calcMatrix.getX(sizeA, -height);
            y0 = calcMatrix.getY(sizeA, -height);

            x1 = calcMatrix.getX(0, sizeB);
            y1 = calcMatrix.getY(0, sizeB);

            x2 = calcMatrix.getX(0, sizeB - height);
            y2 = calcMatrix.getY(0, sizeB - height);
        }
        else
        {
            x0 = calcMatrix.getX(sizeA, 0);
            y0 = calcMatrix.getY(sizeA, 0);

            x1 = calcMatrix.getX(0, sizeB);
            y1 = calcMatrix.getY(0, sizeB);

            x2 = calcMatrix.getX(0, sizeB - height);
            y2 = calcMatrix.getY(0, sizeB - height);
        }

        pipeline.batchTri(src, x0, y0, x1, y1, x2, y2, 0, 0, 1, 1, tint, tint, tint, 2);
    }

    renderer.pipelines.postBatch(src);
};

module.exports = IsoTriangleWebGLRenderer;
