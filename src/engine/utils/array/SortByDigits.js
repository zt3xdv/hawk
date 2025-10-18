var SortByDigits = function (array)
{
    var re = /\D/g;

    array.sort(function (a, b)
    {
        return (parseInt(a.replace(re, ''), 10) - parseInt(b.replace(re, ''), 10));
    });

    return array;
};

module.exports = SortByDigits;
