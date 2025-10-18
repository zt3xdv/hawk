var GetOverlapY = require('./GetOverlapY');
var ProcessY = require('./ProcessY');

var SeparateY = function (body1, body2, overlapOnly, bias, overlap)
{
    if (overlap === undefined) { overlap = GetOverlapY(body1, body2, overlapOnly, bias); }

    var body1Immovable = body1.immovable;
    var body2Immovable = body2.immovable;

    if (overlapOnly || overlap === 0 || (body1Immovable && body2Immovable) || body1.customSeparateY || body2.customSeparateY)
    {

        return (overlap !== 0) || (body1.embedded && body2.embedded);
    }

    var blockedState = ProcessY.Set(body1, body2, overlap);

    if (!body1Immovable && !body2Immovable)
    {
        if (blockedState > 0)
        {
            return true;
        }

        return ProcessY.Check();
    }
    else if (body1Immovable)
    {
        ProcessY.RunImmovableBody1(blockedState);
    }
    else if (body2Immovable)
    {
        ProcessY.RunImmovableBody2(blockedState);
    }

    return true;
};

module.exports = SeparateY;
