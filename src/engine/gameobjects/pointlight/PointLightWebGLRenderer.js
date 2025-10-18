var GetCalcMatrix = require('../GetCalcMatrix');

var PointLightWebGLRenderer = function (renderer, src, camera, parentMatrix)
{
    camera.addToRenderList(src);

    var pipeline = renderer.pipelines.set(src.pipeline);

    var calcMatrix = GetCalcMatrix(src, camera, parentMatrix).calc;

    var width = src.width;
    var height = src.height;

    var x = -src._radius;
    var y = -src._radius;

    var xw = x + width;
    var yh = y + height;

    var lightX = calcMatrix.getX(0, 0);
    var lightY = calcMatrix.getY(0, 0);

    var tx0 = calcMatrix.getX(x, y);
    var ty0 = calcMatrix.getY(x, y);

    var tx1 = calcMatrix.getX(x, yh);
    var ty1 = calcMatrix.getY(x, yh);

    var tx2 = calcMatrix.getX(xw, yh);
    var ty2 = calcMatrix.getY(xw, yh);

    var tx3 = calcMatrix.getX(xw, y);
    var ty3 = calcMatrix.getY(xw, y);

    renderer.pipelines.preBatch(src);

    pipeline.batchPointLight(src, camera, tx0, ty0, tx1, ty1, tx2, ty2, tx3, ty3, lightX, lightY);

    renderer.pipelines.postBatch(src);
};

module.exports = PointLightWebGLRenderer;
