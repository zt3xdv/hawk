var RotateFace = function (face, angle, cx, cy)
{
    var x;
    var y;

    if (cx === undefined && cy === undefined)
    {
        var inCenter = face.getInCenter();

        x = inCenter.x;
        y = inCenter.y;
    }

    var c = Math.cos(angle);
    var s = Math.sin(angle);

    var v1 = face.vertex1;
    var v2 = face.vertex2;
    var v3 = face.vertex3;

    var tx = v1.x - x;
    var ty = v1.y - y;

    v1.set(tx * c - ty * s + x, tx * s + ty * c + y);

    tx = v2.x - x;
    ty = v2.y - y;

    v2.set(tx * c - ty * s + x, tx * s + ty * c + y);

    tx = v3.x - x;
    ty = v3.y - y;

    v3.set(tx * c - ty * s + x, tx * s + ty * c + y);
};

module.exports = RotateFace;
