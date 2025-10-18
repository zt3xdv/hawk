var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

var lookup = new Uint8Array(256);

for (var i = 0; i < chars.length; i++)
{
    lookup[chars.charCodeAt(i)] = i;
}

var Base64ToArrayBuffer = function (base64)
{

    base64 = base64.substr(base64.indexOf(',') + 1);

    var len = base64.length;
    var bufferLength = len * 0.75;
    var p = 0;
    var encoded1;
    var encoded2;
    var encoded3;
    var encoded4;

    if (base64[len - 1] === '=')
    {
        bufferLength--;

        if (base64[len - 2] === '=')
        {
            bufferLength--;
        }
    }

    var arrayBuffer = new ArrayBuffer(bufferLength);
    var bytes = new Uint8Array(arrayBuffer);

    for (var i = 0; i < len; i += 4)
    {
        encoded1 = lookup[base64.charCodeAt(i)];
        encoded2 = lookup[base64.charCodeAt(i + 1)];
        encoded3 = lookup[base64.charCodeAt(i + 2)];
        encoded4 = lookup[base64.charCodeAt(i + 3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arrayBuffer;
};

module.exports = Base64ToArrayBuffer;
