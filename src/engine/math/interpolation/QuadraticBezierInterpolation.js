function P0 (t, p)
{
    var k = 1 - t;

    return k * k * p;
}

function P1 (t, p)
{
    return 2 * (1 - t) * t * p;
}

function P2 (t, p)
{
    return t * t * p;
}

var QuadraticBezierInterpolation = function (t, p0, p1, p2)
{
    return P0(t, p0) + P1(t, p1) + P2(t, p2);
};

module.exports = QuadraticBezierInterpolation;
