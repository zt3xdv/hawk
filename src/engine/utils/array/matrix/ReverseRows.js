var ReverseRows = function (matrix)
{
    for (var i = 0; i < matrix.length; i++)
    {
        matrix[i].reverse();
    }

    return matrix;
};

module.exports = ReverseRows;
