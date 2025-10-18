var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

var ArrayBufferToBase64 = function (arrayBuffer, mediaType)
{
    var bytes = new Uint8Array(arrayBuffer);
    var len = bytes.length;

    var base64 = (mediaType) ? 'data:' + mediaType + ';base64,' : '';

    for (var i = 0; i < len; i += 3)
    {
        base64 += chars[bytes[i] >> 2];
        base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
        base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
        base64 += chars[bytes[i + 2] & 63];
    }

    if ((len % 3) === 2)
    {
        base64 = base64.substring(0, base64.length - 1) + '=';
    }
    else if (len % 3 === 1)
    {
        base64 = base64.substring(0, base64.length - 2) + '==';
    }

    return base64;
};

module.exports = ArrayBufferToBase64;
