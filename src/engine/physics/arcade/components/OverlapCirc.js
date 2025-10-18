var OverlapRect = require('./OverlapRect');
var Circle = require('../../../geom/circle/Circle');
var CircleToCircle = require('../../../geom/intersects/CircleToCircle');
var CircleToRectangle = require('../../../geom/intersects/CircleToRectangle');

var OverlapCirc = function (world, x, y, radius, includeDynamic, includeStatic)
{
    var bodiesInRect = OverlapRect(world, x - radius, y - radius, 2 * radius, 2 * radius, includeDynamic, includeStatic);

    if (bodiesInRect.length === 0)
    {
        return bodiesInRect;
    }

    var area = new Circle(x, y, radius);
    var circFromBody = new Circle();
    var bodiesInArea = [];

    for (var i = 0; i < bodiesInRect.length; i++)
    {
        var body = bodiesInRect[i];

        if (body.isCircle)
        {
            circFromBody.setTo(body.center.x, body.center.y, body.halfWidth);

            if (CircleToCircle(area, circFromBody))
            {
                bodiesInArea.push(body);
            }
        }
        else if (CircleToRectangle(area, body))
        {
            bodiesInArea.push(body);
        }
    }

    return bodiesInArea;
};

module.exports = OverlapCirc;
