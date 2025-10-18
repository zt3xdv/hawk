var GetCenterY = require('../../bounds/GetCenterY');
var GetLeft = require('../../bounds/GetLeft');
var SetCenterY = require('../../bounds/SetCenterY');
var SetRight = require('../../bounds/SetRight');

var LeftCenter = function (gameObject, alignTo, offsetX, offsetY)
{
    if (offsetX === undefined) { offsetX = 0; }
    if (offsetY === undefined) { offsetY = 0; }

    SetRight(gameObject, GetLeft(alignTo) - offsetX);
    SetCenterY(gameObject, GetCenterY(alignTo) + offsetY);

    return gameObject;
};

module.exports = LeftCenter;
