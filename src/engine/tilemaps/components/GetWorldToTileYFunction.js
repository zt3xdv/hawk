var CONST = require('../const/ORIENTATION_CONST');
var NULL = require('../../utils/NULL');
var StaggeredWorldToTileY = require('./StaggeredWorldToTileY');
var WorldToTileY = require('./WorldToTileY');

var GetWorldToTileYFunction = function (orientation)
{
    if (orientation === CONST.ORTHOGONAL)
    {
        return WorldToTileY;
    }
    else if (orientation === CONST.STAGGERED)
    {
        return StaggeredWorldToTileY;
    }
    else
    {
        return NULL;
    }
};

module.exports = GetWorldToTileYFunction;
