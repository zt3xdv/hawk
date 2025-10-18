var GetCalcMatrix = require('../../GetCalcMatrix');
var StrokePathWebGL = require('../StrokePathWebGL');
var Utils = require('../../../renderer/webgl/Utils');

var TriangleWebGLRenderer = function (renderer, src, camera, parentMatrix)
{
    camera.addToRenderList(src);

    var pipeline = renderer.pipelines.set(src.pipeline);

    var result = GetCalcMatrix(src, camera, parentMatrix);

    pipeline.calcMatrix.copyFrom(result.calc);

    var dx = src._displayOriginX;
    var dy = src._displayOriginY;
    var alpha = camera.alpha * src.alpha;

    renderer.pipelines.preBatch(src);

    if (src.isFilled)
    {
        var fillTint = pipeline.fillTint;
        var fillTintColor = Utils.getTintAppendFloatAlpha(src.fillColor, src.fillAlpha * alpha);

        fillTint.TL = fillTintColor;
        fillTint.TR = fillTintColor;
        fillTint.BL = fillTintColor;
        fillTint.BR = fillTintColor;

        var x1 = src.geom.x1 - dx;
        var y1 = src.geom.y1 - dy;
        var x2 = src.geom.x2 - dx;
        var y2 = src.geom.y2 - dy;
        var x3 = src.geom.x3 - dx;
        var y3 = src.geom.y3 - dy;

        pipeline.batchFillTriangle(
            x1,
            y1,
            x2,
            y2,
            x3,
            y3,
            result.sprite,
            result.camera
        );
    }

    if (src.isStroked)
    {
        StrokePathWebGL(pipeline, src, alpha, dx, dy);
    }

    renderer.pipelines.postBatch(src);
};

module.exports = TriangleWebGLRenderer;
