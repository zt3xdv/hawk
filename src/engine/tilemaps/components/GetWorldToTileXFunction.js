var CONST = require('../const/ORIENTATION_CONST');
var NULL = require('../../utils/NULL');
var WorldToTileX = require('./WorldToTileX');

var GetWorldToTileXFunction = function (orientation)
{
    if (orientation === CONST.ORTHOGONAL)
    {
        return WorldToTileX;
    }
    else
    {
        return NULL;
    }
};

module.exports = GetWorldToTileXFunction;
