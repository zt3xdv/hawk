var GetEaseFunction = require('./GetEaseFunction');
var GetValue = require('../../utils/object/GetValue');
var MATH_CONST = require('../../math/const');

var StaggerBuilder = function (value, options)
{
    if (options === undefined) { options = {}; }

    var result;

    var start = GetValue(options, 'start', 0);
    var ease = GetValue(options, 'ease', null);
    var grid = GetValue(options, 'grid', null);

    var from = GetValue(options, 'from', 0);

    var fromFirst = (from === 'first');
    var fromCenter = (from === 'center');
    var fromLast = (from === 'last');
    var fromValue = (typeof(from) === 'number');

    var isRange = (Array.isArray(value));
    var value1 = (isRange) ? parseFloat(value[0]) : parseFloat(value);
    var value2 = (isRange) ? parseFloat(value[1]) : 0;
    var maxValue = Math.max(value1, value2);

    if (isRange)
    {
        start += value1;
    }

    if (grid)
    {

        var gridWidth = grid[0];
        var gridHeight = grid[1];

        var fromX = 0;
        var fromY = 0;

        var distanceX = 0;
        var distanceY = 0;

        var gridValues = [];

        if (fromLast)
        {
            fromX = gridWidth - 1;
            fromY = gridHeight - 1;
        }
        else if (fromValue)
        {
            fromX = from % gridWidth;
            fromY = Math.floor(from / gridWidth);
        }
        else if (fromCenter)
        {
            fromX = (gridWidth - 1) / 2;
            fromY = (gridHeight - 1) / 2;
        }

        var gridMax = MATH_CONST.MIN_SAFE_INTEGER;

        for (var toY = 0; toY < gridHeight; toY++)
        {
            gridValues[toY] = [];

            for (var toX = 0; toX < gridWidth; toX++)
            {
                distanceX = fromX - toX;
                distanceY = fromY - toY;

                var dist = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                if (dist > gridMax)
                {
                    gridMax = dist;
                }

                gridValues[toY][toX] = dist;
            }
        }
    }

    var easeFunction = (ease) ? GetEaseFunction(ease) : null;

    if (grid)
    {
        result = function (target, key, value, index)
        {
            var gridSpace = 0;
            var toX = index % gridWidth;
            var toY = Math.floor(index / gridWidth);

            if (toX >= 0 && toX < gridWidth && toY >= 0 && toY < gridHeight)
            {
                gridSpace = gridValues[toY][toX];
            }

            var output;

            if (isRange)
            {
                var diff = (value2 - value1);

                if (easeFunction)
                {
                    output = ((gridSpace / gridMax) * diff) * easeFunction(gridSpace / gridMax);
                }
                else
                {
                    output = (gridSpace / gridMax) * diff;
                }
            }
            else if (easeFunction)
            {
                output = (gridSpace * value1) * easeFunction(gridSpace / gridMax);
            }
            else
            {
                output = gridSpace * value1;
            }

            return output + start;
        };
    }
    else
    {
        result = function (target, key, value, index, total)
        {

            total--;

            var fromIndex;

            if (fromFirst)
            {
                fromIndex = index;
            }
            else if (fromCenter)
            {
                fromIndex = Math.abs((total / 2) - index);
            }
            else if (fromLast)
            {
                fromIndex = total - index;
            }
            else if (fromValue)
            {
                fromIndex = Math.abs(from - index);
            }

            var output;

            if (isRange)
            {
                var spacing;

                if (fromCenter)
                {
                    spacing = ((value2 - value1) / total) * (fromIndex * 2);
                }
                else
                {
                    spacing = ((value2 - value1) / total) * fromIndex;
                }

                if (easeFunction)
                {
                    output = spacing * easeFunction(fromIndex / total);
                }
                else
                {
                    output = spacing;
                }
            }
            else if (easeFunction)
            {
                output = (total * maxValue) * easeFunction(fromIndex / total);
            }
            else
            {
                output = fromIndex * value1;
            }

            return output + start;
        };
    }

    return result;
};

module.exports = StaggerBuilder;
