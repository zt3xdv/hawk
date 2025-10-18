var GetRight = require('../../bounds/GetRight');
var GetTop = require('../../bounds/GetTop');
var SetBottom = require('../../bounds/SetBottom');
var SetRight = require('../../bounds/SetRight');

var TopRight = function (gameObject, alignTo, offsetX, offsetY)
{
    if (offsetX === undefined) { offsetX = 0; }
    if (offsetY === undefined) { offsetY = 0; }

    SetRight(gameObject, GetRight(alignTo) + offsetX);
    SetBottom(gameObject, GetTop(alignTo) - offsetY);

    return gameObject;
};

module.exports = TopRight;
