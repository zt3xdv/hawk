var AlignIn = require('../display/align/in/QuickSet');
var CONST = require('../display/align/const');
var GetFastValue = require('../utils/object/GetFastValue');
var NOOP = require('../utils/NOOP');
var Zone = require('../gameobjects/zone/Zone');

var tempZone = new Zone({ sys: { queueDepthSort: NOOP, events: { once: NOOP } } }, 0, 0, 1, 1).setOrigin(0, 0);

var GridAlign = function (items, options)
{
    if (options === undefined) { options = {}; }

    var widthSet = options.hasOwnProperty('width');
    var heightSet = options.hasOwnProperty('height');

    var width = GetFastValue(options, 'width', -1);
    var height = GetFastValue(options, 'height', -1);

    var cellWidth = GetFastValue(options, 'cellWidth', 1);
    var cellHeight = GetFastValue(options, 'cellHeight', cellWidth);

    var position = GetFastValue(options, 'position', CONST.TOP_LEFT);
    var x = GetFastValue(options, 'x', 0);
    var y = GetFastValue(options, 'y', 0);

    var cx = 0;
    var cy = 0;
    var w = (width * cellWidth);
    var h = (height * cellHeight);

    tempZone.setPosition(x, y);
    tempZone.setSize(cellWidth, cellHeight);

    for (var i = 0; i < items.length; i++)
    {
        AlignIn(items[i], tempZone, position);

        if (widthSet && width === -1)
        {

            tempZone.x += cellWidth;
        }
        else if (heightSet && height === -1)
        {

            tempZone.y += cellHeight;
        }
        else if (heightSet && !widthSet)
        {

            cy += cellHeight;
            tempZone.y += cellHeight;

            if (cy === h)
            {
                cy = 0;
                cx += cellWidth;
                tempZone.y = y;
                tempZone.x += cellWidth;

                if (cx === w)
                {

                    break;
                }
            }
        }
        else
        {

            cx += cellWidth;
            tempZone.x += cellWidth;

            if (cx === w)
            {
                cx = 0;
                cy += cellHeight;
                tempZone.x = x;
                tempZone.y += cellHeight;

                if (cy === h)
                {

                    break;
                }
            }
        }
    }

    return items;
};

module.exports = GridAlign;
