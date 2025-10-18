var GetOverlapX = require('./GetOverlapX');
var ProcessX = require('./ProcessX');

var SeparateX = function (body1, body2, overlapOnly, bias, overlap)
{
    if (overlap === undefined) { overlap = GetOverlapX(body1, body2, overlapOnly, bias); }

    var body1Immovable = body1.immovable;
    var body2Immovable = body2.immovable;

    if (overlapOnly || overlap === 0 || (body1Immovable && body2Immovable) || body1.customSeparateX || body2.customSeparateX)
    {

        return (overlap !== 0) || (body1.embedded && body2.embedded);
    }

    var blockedState = ProcessX.Set(body1, body2, overlap);

    if (!body1Immovable && !body2Immovable)
    {
        if (blockedState > 0)
        {
            return true;
        }

        return ProcessX.Check();
    }
    else if (body1Immovable)
    {
        ProcessX.RunImmovableBody1(blockedState);
    }
    else if (body2Immovable)
    {
        ProcessX.RunImmovableBody2(blockedState);
    }

    return true;
};

module.exports = SeparateX;
