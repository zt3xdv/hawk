var GetCalcMatrix = require('../../../gameobjects/GetCalcMatrix');

var SetTransform = function (renderer, ctx, src, camera, parentMatrix)
{
    var alpha = camera.alpha * src.alpha;

    if (alpha <= 0)
    {

        return false;
    }

    var calcMatrix = GetCalcMatrix(src, camera, parentMatrix).calc;

    ctx.globalCompositeOperation = renderer.blendModes[src.blendMode];

    ctx.globalAlpha = alpha;

    ctx.save();

    calcMatrix.setToContext(ctx);

    ctx.imageSmoothingEnabled = src.frame ? !src.frame.source.scaleMode : renderer.antialias;

    return true;
};

module.exports = SetTransform;
