var Pad = function (str, len, pad, dir)
{
    if (len === undefined) { len = 0; }
    if (pad === undefined) { pad = ' '; }
    if (dir === undefined) { dir = 3; }

    str = str.toString();

    var padlen = 0;

    if (len + 1 >= str.length)
    {
        switch (dir)
        {
            case 1:
                str = new Array(len + 1 - str.length).join(pad) + str;
                break;

            case 3:
                var right = Math.ceil((padlen = len - str.length) / 2);
                var left = padlen - right;
                str = new Array(left + 1).join(pad) + str + new Array(right + 1).join(pad);
                break;

            default:
                str = str + new Array(len + 1 - str.length).join(pad);
                break;
        }
    }

    return str;
};

module.exports = Pad;
