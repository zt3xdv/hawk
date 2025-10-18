var DegToRad = require('../../../math/DegToRad');
var FillStyleCanvas = require('../FillStyleCanvas');
var LineStyleCanvas = require('../LineStyleCanvas');
var SetTransform = require('../../../renderer/canvas/utils/SetTransform');

var ArcCanvasRenderer = function (renderer, src, camera, parentMatrix)
{
    camera.addToRenderList(src);

    var ctx = renderer.currentContext;

    if (SetTransform(renderer, ctx, src, camera, parentMatrix))
    {
        var radius = src.radius;

        ctx.beginPath();

        ctx.arc(
            (radius) - src.originX * (radius * 2),
            (radius) - src.originY * (radius * 2),
            radius,
            DegToRad(src._startAngle),
            DegToRad(src._endAngle),
            src.anticlockwise
        );

        if (src.closePath)
        {
            ctx.closePath();
        }

        if (src.isFilled)
        {
            FillStyleCanvas(ctx, src);

            ctx.fill();
        }

        if (src.isStroked)
        {
            LineStyleCanvas(ctx, src);

            ctx.stroke();
        }

        ctx.restore();
    }
};

module.exports = ArcCanvasRenderer;
