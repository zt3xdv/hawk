var LinearXY = function (vector1, vector2, t)
{
    if (t === undefined) { t = 0; }

    return vector1.clone().lerp(vector2, t);
};

module.exports = LinearXY;
