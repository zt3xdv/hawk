var CheckMatrix = require('./CheckMatrix');
var TransposeMatrix = require('./TransposeMatrix');

var RotateMatrix = function (matrix, direction)
{
    if (direction === undefined) { direction = 90; }

    if (!CheckMatrix(matrix))
    {
        return null;
    }

    if (typeof direction !== 'string')
    {
        direction = ((direction % 360) + 360) % 360;
    }

    if (direction === 90 || direction === -270 || direction === 'rotateLeft')
    {
        matrix = TransposeMatrix(matrix);
        matrix.reverse();
    }
    else if (direction === -90 || direction === 270 || direction === 'rotateRight')
    {
        matrix.reverse();
        matrix = TransposeMatrix(matrix);
    }
    else if (Math.abs(direction) === 180 || direction === 'rotate180')
    {
        for (var i = 0; i < matrix.length; i++)
        {
            matrix[i].reverse();
        }

        matrix.reverse();
    }

    return matrix;
};

module.exports = RotateMatrix;
