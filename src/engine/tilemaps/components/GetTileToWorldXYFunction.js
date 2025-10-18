var CONST = require('../const/ORIENTATION_CONST');
var HexagonalTileToWorldXY = require('./HexagonalTileToWorldXY');
var IsometricTileToWorldXY = require('./IsometricTileToWorldXY');
var NOOP = require('../../utils/NOOP');
var StaggeredTileToWorldXY = require('./StaggeredTileToWorldXY');
var TileToWorldXY = require('./TileToWorldXY');

var GetTileToWorldXYFunction = function (orientation)
{
    if (orientation === CONST.ORTHOGONAL)
    {
        return TileToWorldXY;
    }
    else if (orientation === CONST.ISOMETRIC)
    {
        return IsometricTileToWorldXY;
    }
    else if (orientation === CONST.HEXAGONAL)
    {
        return HexagonalTileToWorldXY;
    }
    else if (orientation === CONST.STAGGERED)
    {
        return StaggeredTileToWorldXY;
    }
    else
    {
        return NOOP;
    }
};

module.exports = GetTileToWorldXYFunction;
