var GetCalcMatrix = require('../../GetCalcMatrix');
var Utils = require('../../../renderer/webgl/Utils');

var LineWebGLRenderer = function (renderer, src, camera, parentMatrix)
{
    camera.addToRenderList(src);

    var pipeline = renderer.pipelines.set(src.pipeline);

    var result = GetCalcMatrix(src, camera, parentMatrix);

    pipeline.calcMatrix.copyFrom(result.calc);

    var dx = src._displayOriginX;
    var dy = src._displayOriginY;
    var alpha = camera.alpha * src.alpha;

    renderer.pipelines.preBatch(src);

    if (src.isStroked)
    {
        var strokeTint = pipeline.strokeTint;
        var color = Utils.getTintAppendFloatAlpha(src.strokeColor, src.strokeAlpha * alpha);

        strokeTint.TL = color;
        strokeTint.TR = color;
        strokeTint.BL = color;
        strokeTint.BR = color;

        pipeline.batchLine(
            src.geom.x1 - dx,
            src.geom.y1 - dy,
            src.geom.x2 - dx,
            src.geom.y2 - dy,
            src._startWidth / 2,
            src._endWidth / 2,
            1,
            0,
            false,
            result.sprite,
            result.camera
        );
    }

    renderer.pipelines.postBatch(src);
};

module.exports = LineWebGLRenderer;
