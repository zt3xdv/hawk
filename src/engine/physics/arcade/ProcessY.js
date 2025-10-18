var body1;
var body2;
var body1Pushable;
var body2Pushable;
var body1MassImpact;
var body2MassImpact;
var body1FullImpact;
var body2FullImpact;
var body1MovingUp;
var body1MovingDown;
var body1Stationary;
var body2MovingUp;
var body2MovingDown;
var body2Stationary;
var body1OnTop;
var body2OnTop;
var overlap;

var Set = function (b1, b2, ov)
{
    body1 = b1;
    body2 = b2;

    var v1 = body1.velocity.y;
    var v2 = body2.velocity.y;

    body1Pushable = body1.pushable;
    body1MovingUp = body1._dy < 0;
    body1MovingDown = body1._dy > 0;
    body1Stationary = body1._dy === 0;
    body1OnTop = Math.abs(body1.bottom - body2.y) <= Math.abs(body2.bottom - body1.y);
    body1FullImpact = v2 - v1 * body1.bounce.y;

    body2Pushable = body2.pushable;
    body2MovingUp = body2._dy < 0;
    body2MovingDown = body2._dy > 0;
    body2Stationary = body2._dy === 0;
    body2OnTop = !body1OnTop;
    body2FullImpact = v1 - v2 * body2.bounce.y;

    overlap = Math.abs(ov);

    return BlockCheck();
};

var BlockCheck = function ()
{

    if (body1MovingDown && body1OnTop && body2.blocked.down)
    {
        body1.processY(-overlap, body1FullImpact, false, true);

        return 1;
    }

    if (body1MovingUp && body2OnTop && body2.blocked.up)
    {
        body1.processY(overlap, body1FullImpact, true);

        return 1;
    }

    if (body2MovingDown && body2OnTop && body1.blocked.down)
    {
        body2.processY(-overlap, body2FullImpact, false, true);

        return 2;
    }

    if (body2MovingUp && body1OnTop && body1.blocked.up)
    {
        body2.processY(overlap, body2FullImpact, true);

        return 2;
    }

    return 0;
};

var Check = function ()
{
    var v1 = body1.velocity.y;
    var v2 = body2.velocity.y;

    var nv1 = Math.sqrt((v2 * v2 * body2.mass) / body1.mass) * ((v2 > 0) ? 1 : -1);
    var nv2 = Math.sqrt((v1 * v1 * body1.mass) / body2.mass) * ((v1 > 0) ? 1 : -1);
    var avg = (nv1 + nv2) * 0.5;

    nv1 -= avg;
    nv2 -= avg;

    body1MassImpact = avg + nv1 * body1.bounce.y;
    body2MassImpact = avg + nv2 * body2.bounce.y;

    if (body1MovingUp && body2OnTop)
    {
        return Run(0);
    }

    if (body2MovingUp && body1OnTop)
    {
        return Run(1);
    }

    if (body1MovingDown && body1OnTop)
    {
        return Run(2);
    }

    if (body2MovingDown && body2OnTop)
    {
        return Run(3);
    }

    return false;
};

var Run = function (side)
{
    if (body1Pushable && body2Pushable)
    {

        overlap *= 0.5;

        if (side === 0 || side === 3)
        {

            body1.processY(overlap, body1MassImpact);
            body2.processY(-overlap, body2MassImpact);
        }
        else
        {

            body1.processY(-overlap, body1MassImpact);
            body2.processY(overlap, body2MassImpact);
        }
    }
    else if (body1Pushable && !body2Pushable)
    {

        if (side === 0 || side === 3)
        {

            body1.processY(overlap, body1FullImpact, true);
        }
        else
        {

            body1.processY(-overlap, body1FullImpact, false, true);
        }
    }
    else if (!body1Pushable && body2Pushable)
    {

        if (side === 0 || side === 3)
        {

            body2.processY(-overlap, body2FullImpact, false, true);
        }
        else
        {

            body2.processY(overlap, body2FullImpact, true);
        }
    }
    else
    {

        var halfOverlap = overlap * 0.5;

        if (side === 0)
        {

            if (body2Stationary)
            {
                body1.processY(overlap, 0, true);
                body2.processY(0, null, false, true);
            }
            else if (body2MovingDown)
            {
                body1.processY(halfOverlap, 0, true);
                body2.processY(-halfOverlap, 0, false, true);
            }
            else
            {

                body1.processY(halfOverlap, body2.velocity.y, true);
                body2.processY(-halfOverlap, null, false, true);
            }
        }
        else if (side === 1)
        {

            if (body1Stationary)
            {
                body1.processY(0, null, false, true);
                body2.processY(overlap, 0, true);
            }
            else if (body1MovingDown)
            {
                body1.processY(-halfOverlap, 0, false, true);
                body2.processY(halfOverlap, 0, true);
            }
            else
            {

                body1.processY(-halfOverlap, null, false, true);
                body2.processY(halfOverlap, body1.velocity.y, true);
            }
        }
        else if (side === 2)
        {

            if (body2Stationary)
            {
                body1.processY(-overlap, 0, false, true);
                body2.processY(0, null, true);
            }
            else if (body2MovingUp)
            {
                body1.processY(-halfOverlap, 0, false, true);
                body2.processY(halfOverlap, 0, true);
            }
            else
            {

                body1.processY(-halfOverlap, body2.velocity.y, false, true);
                body2.processY(halfOverlap, null, true);
            }
        }
        else if (side === 3)
        {

            if (body1Stationary)
            {
                body1.processY(0, null, true);
                body2.processY(-overlap, 0, false, true);
            }
            else if (body1MovingUp)
            {
                body1.processY(halfOverlap, 0, true);
                body2.processY(-halfOverlap, 0, false, true);
            }
            else
            {

                body1.processY(halfOverlap, body2.velocity.y, true);
                body2.processY(-halfOverlap, null, false, true);
            }
        }
    }

    return true;
};

var RunImmovableBody1 = function (blockedState)
{
    if (blockedState === 1)
    {

        body2.velocity.y = 0;
    }
    else if (body1OnTop)
    {
        body2.processY(overlap, body2FullImpact, true);
    }
    else
    {
        body2.processY(-overlap, body2FullImpact, false, true);
    }

    if (body1.moves)
    {
        var body1Distance = body1.directControl ? (body1.x - body1.autoFrame.x) : (body1.x - body1.prev.x);

        body2.x += body1Distance * body1.friction.x;
        body2._dx = body2.x - body2.prev.x;
    }
};

var RunImmovableBody2 = function (blockedState)
{
    if (blockedState === 2)
    {

        body1.velocity.y = 0;
    }
    else if (body2OnTop)
    {
        body1.processY(overlap, body1FullImpact, true);
    }
    else
    {
        body1.processY(-overlap, body1FullImpact, false, true);
    }

    if (body2.moves)
    {
        var body2Distance = body2.directControl ? (body2.x - body2.autoFrame.x) : (body2.x - body2.prev.x);

        body1.x += body2Distance * body2.friction.x;
        body1._dx = body1.x - body1.prev.x;
    }
};

module.exports = {
    BlockCheck: BlockCheck,
    Check: Check,
    Set: Set,
    Run: Run,
    RunImmovableBody1: RunImmovableBody1,
    RunImmovableBody2: RunImmovableBody2
};
