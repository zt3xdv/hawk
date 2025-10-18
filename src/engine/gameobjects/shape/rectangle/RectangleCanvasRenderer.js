var FillStyleCanvas = require('../FillStyleCanvas');
var LineStyleCanvas = require('../LineStyleCanvas');
var SetTransform = require('../../../renderer/canvas/utils/SetTransform');

var DrawRoundedRect = function (ctx, x, y, width, height, radius)
{

    var maxRadius = Math.min(width / 2, height / 2);
    var r = Math.min(radius, maxRadius);

    if (r === 0)
    {

        ctx.rect(x, y, width, height);
        return;
    }

    ctx.moveTo(x + r, y);

    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + r, r);

    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);

    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);

    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);

    ctx.closePath();
};

var RectangleCanvasRenderer = function (renderer, src, camera, parentMatrix)
{
    camera.addToRenderList(src);

    var ctx = renderer.currentContext;

    if (SetTransform(renderer, ctx, src, camera, parentMatrix))
    {
        var dx = src._displayOriginX;
        var dy = src._displayOriginY;

        if (src.isFilled)
        {
            FillStyleCanvas(ctx, src);

            if (src.isRounded)
            {
                ctx.beginPath();
                DrawRoundedRect(ctx, -dx, -dy, src.width, src.height, src.radius);
                ctx.fill();
            }
            else
            {
                ctx.fillRect(
                    -dx,
                    -dy,
                    src.width,
                    src.height
                );
            }
        }

        if (src.isStroked)
        {
            LineStyleCanvas(ctx, src);

            ctx.beginPath();

            if (src.isRounded)
            {
                DrawRoundedRect(ctx, -dx, -dy, src.width, src.height, src.radius);
            }
            else
            {
                ctx.rect(
                    -dx,
                    -dy,
                    src.width,
                    src.height
                );
            }

            ctx.stroke();
        }

        ctx.restore();
    }
};

module.exports = RectangleCanvasRenderer;
