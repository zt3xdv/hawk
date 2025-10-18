var CONST = require('../const/ORIENTATION_CONST');
var NOOP = require('../../utils/NOOP');
var StaggeredTileToWorldY = require('./StaggeredTileToWorldY');
var TileToWorldY = require('./TileToWorldY');

var GetTileToWorldYFunction = function (orientation)
{
    if (orientation === CONST.ORTHOGONAL)
    {
        return TileToWorldY;
    }
    else if (orientation === CONST.STAGGERED)
    {
        return StaggeredTileToWorldY;
    }
    else
    {
        return NOOP;
    }
};

module.exports = GetTileToWorldYFunction;
