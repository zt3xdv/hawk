var CONST = require('../const/ORIENTATION_CONST');
var CullTiles = require('./CullTiles');
var HexagonalCullTiles = require('./HexagonalCullTiles');
var IsometricCullTiles = require('./IsometricCullTiles');
var NOOP = require('../../utils/NOOP');
var StaggeredCullTiles = require('./StaggeredCullTiles');

var GetCullTilesFunction = function (orientation)
{
    if (orientation === CONST.ORTHOGONAL)
    {
        return CullTiles;
    }
    else if (orientation === CONST.HEXAGONAL)
    {
        return HexagonalCullTiles;
    }
    else if (orientation === CONST.STAGGERED)
    {
        return StaggeredCullTiles;
    }
    else if (orientation === CONST.ISOMETRIC)
    {
        return IsometricCullTiles;
    }
    else
    {
        return NOOP;
    }
};

module.exports = GetCullTilesFunction;
