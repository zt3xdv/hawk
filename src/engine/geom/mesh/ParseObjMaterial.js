var GetColor = require('../../display/color/GetColor');

var ParseObjMaterial = function (mtl)
{
    var output = {};

    var lines = mtl.split('\n');

    var currentMaterial = '';

    for (var i = 0; i < lines.length; i++)
    {
        var line = lines[i].trim();

        if (line.indexOf('#') === 0 || line === '')
        {
            continue;
        }

        var lineItems = line.replace(/\s\s+/g, ' ').trim().split(' ');

        switch (lineItems[0].toLowerCase())
        {
            case 'newmtl':
            {
                currentMaterial = lineItems[1];
                break;
            }

            case 'kd':
            {
                var r = Math.floor(lineItems[1] * 255);
                var g = (lineItems.length >= 2) ? Math.floor(lineItems[2] * 255) : r;
                var b = (lineItems.length >= 3) ? Math.floor(lineItems[3] * 255) : r;

                output[currentMaterial] = GetColor(r, g, b);

                break;
            }
        }
    }

    return output;
};

module.exports = ParseObjMaterial;
