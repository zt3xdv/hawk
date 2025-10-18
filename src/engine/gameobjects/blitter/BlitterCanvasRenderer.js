var BlitterCanvasRenderer = function (renderer, src, camera, parentMatrix)
{
    var list = src.getRenderList();

    if (list.length === 0)
    {
        return;
    }

    var ctx = renderer.currentContext;

    var alpha = camera.alpha * src.alpha;

    if (alpha === 0)
    {

        return;
    }

    camera.addToRenderList(src);

    ctx.globalCompositeOperation = renderer.blendModes[src.blendMode];

    ctx.imageSmoothingEnabled = !src.frame.source.scaleMode;

    var cameraScrollX = src.x - camera.scrollX * src.scrollFactorX;
    var cameraScrollY = src.y - camera.scrollY * src.scrollFactorY;

    ctx.save();

    if (parentMatrix)
    {
        parentMatrix.copyToContext(ctx);
    }

    var roundPixels = camera.roundPixels;

    for (var i = 0; i < list.length; i++)
    {
        var bob = list[i];
        var flip = (bob.flipX || bob.flipY);
        var frame = bob.frame;
        var cd = frame.canvasData;
        var dx = frame.x;
        var dy = frame.y;
        var fx = 1;
        var fy = 1;

        var bobAlpha = bob.alpha * alpha;

        if (bobAlpha === 0)
        {
            continue;
        }

        ctx.globalAlpha = bobAlpha;

        if (!flip)
        {
            if (roundPixels)
            {
                dx = Math.round(dx);
                dy = Math.round(dy);
            }

            if (cd.width > 0 && cd.height > 0)
            {
                ctx.drawImage(
                    frame.source.image,
                    cd.x,
                    cd.y,
                    cd.width,
                    cd.height,
                    dx + bob.x + cameraScrollX,
                    dy + bob.y + cameraScrollY,
                    cd.width,
                    cd.height
                );
            }
        }
        else
        {
            if (bob.flipX)
            {
                fx = -1;
                dx -= cd.width;
            }

            if (bob.flipY)
            {
                fy = -1;
                dy -= cd.height;
            }

            if (cd.width > 0 && cd.height > 0)
            {
                ctx.save();
                ctx.translate(bob.x + cameraScrollX, bob.y + cameraScrollY);
                ctx.scale(fx, fy);
                ctx.drawImage(frame.source.image, cd.x, cd.y, cd.width, cd.height, dx, dy, cd.width, cd.height);
                ctx.restore();
            }
        }
    }

    ctx.restore();
};

module.exports = BlitterCanvasRenderer;
