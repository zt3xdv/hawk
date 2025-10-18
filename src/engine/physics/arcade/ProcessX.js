var body1;
var body2;
var body1Pushable;
var body2Pushable;
var body1MassImpact;
var body2MassImpact;
var body1FullImpact;
var body2FullImpact;
var body1MovingLeft;
var body1MovingRight;
var body1Stationary;
var body2MovingLeft;
var body2MovingRight;
var body2Stationary;
var body1OnLeft;
var body2OnLeft;
var overlap;

var Set = function (b1, b2, ov)
{
    body1 = b1;
    body2 = b2;

    var v1 = body1.velocity.x;
    var v2 = body2.velocity.x;

    body1Pushable = body1.pushable;
    body1MovingLeft = body1._dx < 0;
    body1MovingRight = body1._dx > 0;
    body1Stationary = body1._dx === 0;
    body1OnLeft = Math.abs(body1.right - body2.x) <= Math.abs(body2.right - body1.x);
    body1FullImpact = v2 - v1 * body1.bounce.x;

    body2Pushable = body2.pushable;
    body2MovingLeft = body2._dx < 0;
    body2MovingRight = body2._dx > 0;
    body2Stationary = body2._dx === 0;
    body2OnLeft = !body1OnLeft;
    body2FullImpact = v1 - v2 * body2.bounce.x;

    overlap = Math.abs(ov);

    return BlockCheck();
};

var BlockCheck = function ()
{

    if (body1MovingRight && body1OnLeft && body2.blocked.right)
    {
        body1.processX(-overlap, body1FullImpact, false, true);

        return 1;
    }

    if (body1MovingLeft && body2OnLeft && body2.blocked.left)
    {
        body1.processX(overlap, body1FullImpact, true);

        return 1;
    }

    if (body2MovingRight && body2OnLeft && body1.blocked.right)
    {
        body2.processX(-overlap, body2FullImpact, false, true);

        return 2;
    }

    if (body2MovingLeft && body1OnLeft && body1.blocked.left)
    {
        body2.processX(overlap, body2FullImpact, true);

        return 2;
    }

    return 0;
};

var Check = function ()
{
    var v1 = body1.velocity.x;
    var v2 = body2.velocity.x;

    var nv1 = Math.sqrt((v2 * v2 * body2.mass) / body1.mass) * ((v2 > 0) ? 1 : -1);
    var nv2 = Math.sqrt((v1 * v1 * body1.mass) / body2.mass) * ((v1 > 0) ? 1 : -1);
    var avg = (nv1 + nv2) * 0.5;

    nv1 -= avg;
    nv2 -= avg;

    body1MassImpact = avg + nv1 * body1.bounce.x;
    body2MassImpact = avg + nv2 * body2.bounce.x;

    if (body1MovingLeft && body2OnLeft)
    {
        return Run(0);
    }

    if (body2MovingLeft && body1OnLeft)
    {
        return Run(1);
    }

    if (body1MovingRight && body1OnLeft)
    {
        return Run(2);
    }

    if (body2MovingRight && body2OnLeft)
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

            body1.processX(overlap, body1MassImpact);
            body2.processX(-overlap, body2MassImpact);
        }
        else
        {

            body1.processX(-overlap, body1MassImpact);
            body2.processX(overlap, body2MassImpact);
        }
    }
    else if (body1Pushable && !body2Pushable)
    {

        if (side === 0 || side === 3)
        {

            body1.processX(overlap, body1FullImpact, true);
        }
        else
        {

            body1.processX(-overlap, body1FullImpact, false, true);
        }
    }
    else if (!body1Pushable && body2Pushable)
    {

        if (side === 0 || side === 3)
        {

            body2.processX(-overlap, body2FullImpact, false, true);
        }
        else
        {

            body2.processX(overlap, body2FullImpact, true);
        }
    }
    else
    {

        var halfOverlap = overlap * 0.5;

        if (side === 0)
        {

            if (body2Stationary)
            {
                body1.processX(overlap, 0, true);
                body2.processX(0, null, false, true);
            }
            else if (body2MovingRight)
            {
                body1.processX(halfOverlap, 0, true);
                body2.processX(-halfOverlap, 0, false, true);
            }
            else
            {

                body1.processX(halfOverlap, body2.velocity.x, true);
                body2.processX(-halfOverlap, null, false, true);
            }
        }
        else if (side === 1)
        {

            if (body1Stationary)
            {
                body1.processX(0, null, false, true);
                body2.processX(overlap, 0, true);
            }
            else if (body1MovingRight)
            {
                body1.processX(-halfOverlap, 0, false, true);
                body2.processX(halfOverlap, 0, true);
            }
            else
            {

                body1.processX(-halfOverlap, null, false, true);
                body2.processX(halfOverlap, body1.velocity.x, true);
            }
        }
        else if (side === 2)
        {

            if (body2Stationary)
            {
                body1.processX(-overlap, 0, false, true);
                body2.processX(0, null, true);
            }
            else if (body2MovingLeft)
            {
                body1.processX(-halfOverlap, 0, false, true);
                body2.processX(halfOverlap, 0, true);
            }
            else
            {

                body1.processX(-halfOverlap, body2.velocity.x, false, true);
                body2.processX(halfOverlap, null, true);
            }
        }
        else if (side === 3)
        {

            if (body1Stationary)
            {
                body1.processX(0, null, true);
                body2.processX(-overlap, 0, false, true);
            }
            else if (body1MovingLeft)
            {
                body1.processX(halfOverlap, 0, true);
                body2.processX(-halfOverlap, 0, false, true);
            }
            else
            {

                body1.processX(halfOverlap, body2.velocity.y, true);
                body2.processX(-halfOverlap, null, false, true);
            }
        }
    }

    return true;
};

var RunImmovableBody1 = function (blockedState)
{
    if (blockedState === 1)
    {

        body2.velocity.x = 0;
    }
    else if (body1OnLeft)
    {
        body2.processX(overlap, body2FullImpact, true);
    }
    else
    {
        body2.processX(-overlap, body2FullImpact, false, true);
    }

    if (body1.moves)
    {
        var body1Distance = body1.directControl ? (body1.y - body1.autoFrame.y) : (body1.y - body1.prev.y);

        body2.y += body1Distance * body1.friction.y;
        body2._dy = body2.y - body2.prev.y;
    }
};

var RunImmovableBody2 = function (blockedState)
{
    if (blockedState === 2)
    {

        body1.velocity.x = 0;
    }
    else if (body2OnLeft)
    {
        body1.processX(overlap, body1FullImpact, true);
    }
    else
    {
        body1.processX(-overlap, body1FullImpact, false, true);
    }

    if (body2.moves)
    {
        var body2Distance = body2.directControl ? (body2.y - body2.autoFrame.y) : (body2.y - body2.prev.y);

        body1.y += body2Distance * body2.friction.y;
        body1._dy = body1.y - body1.prev.y;
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
