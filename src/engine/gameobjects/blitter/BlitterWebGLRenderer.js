var TransformMatrix = require('../components/TransformMatrix');
var Utils = require('../../renderer/webgl/Utils');

var tempMatrix = new TransformMatrix();

var BlitterWebGLRenderer = function (renderer, src, camera, parentMatrix)
{
    var list = src.getRenderList();
    var alpha = camera.alpha * src.alpha;

    if (list.length === 0 || alpha === 0)
    {

        return;
    }

    camera.addToRenderList(src);

    var pipeline = renderer.pipelines.set(this.pipeline, src);

    var cameraScrollX = camera.scrollX * src.scrollFactorX;
    var cameraScrollY = camera.scrollY * src.scrollFactorY;

    var calcMatrix = tempMatrix.copyFrom(camera.matrix);

    if (parentMatrix)
    {
        calcMatrix.multiplyWithOffset(parentMatrix, -cameraScrollX, -cameraScrollY);

        cameraScrollX = 0;
        cameraScrollY = 0;
    }

    var blitterX = src.x - cameraScrollX;
    var blitterY = src.y - cameraScrollY;
    var prevTextureSourceIndex = -1;
    var tintEffect = false;
    var roundPixels = camera.roundPixels;

    renderer.pipelines.preBatch(src);

    for (var i = 0; i < list.length; i++)
    {
        var bob = list[i];
        var frame = bob.frame;
        var bobAlpha = bob.alpha * alpha;

        if (bobAlpha === 0)
        {
            continue;
        }

        var width = frame.width;
        var height = frame.height;

        var x = blitterX + bob.x + frame.x;
        var y = blitterY + bob.y + frame.y;

        if (bob.flipX)
        {
            width *= -1;
            x += frame.width;
        }

        if (bob.flipY)
        {
            height *= -1;
            y += frame.height;
        }

        var quad = calcMatrix.setQuad(x, y, x + width, y + height, roundPixels);

        var tint = Utils.getTintAppendFloatAlpha(bob.tint, bobAlpha);

        if (frame.sourceIndex !== prevTextureSourceIndex)
        {
            var textureUnit = pipeline.setGameObject(src, frame);

            prevTextureSourceIndex = frame.sourceIndex;
        }

        if (pipeline.batchQuad(src, quad[0], quad[1], quad[2], quad[3], quad[4], quad[5], quad[6], quad[7], frame.u0, frame.v0, frame.u1, frame.v1, tint, tint, tint, tint, tintEffect, frame.glTexture, textureUnit))
        {
            prevTextureSourceIndex = -1;
        }
    }

    renderer.pipelines.postBatch(src);
};

module.exports = BlitterWebGLRenderer;
