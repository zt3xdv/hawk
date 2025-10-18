var TileCheckX = require('./TileCheckX');
var TileCheckY = require('./TileCheckY');
var TileIntersectsBody = require('./TileIntersectsBody');

var SeparateTile = function (i, body, tile, tileWorldRect, tilemapLayer, tileBias, isLayer)
{
    var tileLeft = tileWorldRect.left;
    var tileTop = tileWorldRect.top;
    var tileRight = tileWorldRect.right;
    var tileBottom = tileWorldRect.bottom;
    var faceHorizontal = tile.faceLeft || tile.faceRight;
    var faceVertical = tile.faceTop || tile.faceBottom;

    if (!isLayer)
    {
        faceHorizontal = true;
        faceVertical = true;
    }

    if (!faceHorizontal && !faceVertical)
    {
        return false;
    }

    var ox = 0;
    var oy = 0;
    var minX = 0;
    var minY = 1;

    if (body.deltaAbsX() > body.deltaAbsY())
    {

        minX = -1;
    }
    else if (body.deltaAbsX() < body.deltaAbsY())
    {

        minY = -1;
    }

    if (body.deltaX() !== 0 && body.deltaY() !== 0 && faceHorizontal && faceVertical)
    {

        minX = Math.min(Math.abs(body.position.x - tileRight), Math.abs(body.right - tileLeft));
        minY = Math.min(Math.abs(body.position.y - tileBottom), Math.abs(body.bottom - tileTop));
    }

    if (minX < minY)
    {
        if (faceHorizontal)
        {
            ox = TileCheckX(body, tile, tileLeft, tileRight, tileBias, isLayer);

            if (ox !== 0 && !TileIntersectsBody(tileWorldRect, body))
            {
                return true;
            }
        }

        if (faceVertical)
        {
            oy = TileCheckY(body, tile, tileTop, tileBottom, tileBias, isLayer);
        }
    }
    else
    {
        if (faceVertical)
        {
            oy = TileCheckY(body, tile, tileTop, tileBottom, tileBias, isLayer);

            if (oy !== 0 && !TileIntersectsBody(tileWorldRect, body))
            {
                return true;
            }
        }

        if (faceHorizontal)
        {
            ox = TileCheckX(body, tile, tileLeft, tileRight, tileBias, isLayer);
        }
    }

    return (ox !== 0 || oy !== 0);
};

module.exports = SeparateTile;
