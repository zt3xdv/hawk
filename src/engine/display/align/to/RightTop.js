var GetRight = require('../../bounds/GetRight');
var GetTop = require('../../bounds/GetTop');
var SetLeft = require('../../bounds/SetLeft');
var SetTop = require('../../bounds/SetTop');

var RightTop = function (gameObject, alignTo, offsetX, offsetY)
{
    if (offsetX === undefined) { offsetX = 0; }
    if (offsetY === undefined) { offsetY = 0; }

    SetLeft(gameObject, GetRight(alignTo) + offsetX);
    SetTop(gameObject, GetTop(alignTo) - offsetY);

    return gameObject;
};

module.exports = RightTop;
