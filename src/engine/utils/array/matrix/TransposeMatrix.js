var TransposeMatrix = function (array)
{
    var sourceRowCount = array.length;
    var sourceColCount = array[0].length;

    var result = new Array(sourceColCount);

    for (var i = 0; i < sourceColCount; i++)
    {
        result[i] = new Array(sourceRowCount);

        for (var j = sourceRowCount - 1; j > -1; j--)
        {
            result[i][j] = array[j][i];
        }
    }

    return result;
};

module.exports = TransposeMatrix;
