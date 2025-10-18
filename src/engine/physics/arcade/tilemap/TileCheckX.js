var ProcessTileSeparationX = require('./ProcessTileSeparationX');

var TileCheckX = function (body, tile, tileLeft, tileRight, tileBias, isLayer)
{
    var ox = 0;

    var faceLeft = tile.faceLeft;
    var faceRight = tile.faceRight;
    var collideLeft = tile.collideLeft;
    var collideRight = tile.collideRight;

    if (!isLayer)
    {
        faceLeft = true;
        faceRight = true;
        collideLeft = true;
        collideRight = true;
    }

    if (body.deltaX() < 0 && collideRight && body.checkCollision.left)
    {

        if (faceRight && body.x < tileRight)
        {
            ox = body.x - tileRight;

            if (ox < -tileBias)
            {
                ox = 0;
            }
        }
    }
    else if (body.deltaX() > 0 && collideLeft && body.checkCollision.right)
    {

        if (faceLeft && body.right > tileLeft)
        {
            ox = body.right - tileLeft;

            if (ox > tileBias)
            {
                ox = 0;
            }
        }
    }

    if (ox !== 0)
    {
        if (body.customSeparateX)
        {
            body.overlapX = ox;
        }
        else
        {
            ProcessTileSeparationX(body, ox);
        }
    }

    return ox;
};

module.exports = TileCheckX;
