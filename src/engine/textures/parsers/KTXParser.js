var KTXParser = function (data)
{
    var idCheck = [ 0xab, 0x4b, 0x54, 0x58, 0x20, 0x31, 0x31, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a ];

    var i;
    var id = new Uint8Array(data, 0, 12);

    for (i = 0; i < id.length; i++)
    {
        if (id[i] !== idCheck[i])
        {
            console.warn('KTXParser - Invalid file format');

            return;
        }
    }

    var size = Uint32Array.BYTES_PER_ELEMENT;

    var head = new DataView(data, 12, 13 * size);

    var littleEndian = (head.getUint32(0, true) === 0x04030201);

    var glType = head.getUint32(1 * size, littleEndian);

    if (glType !== 0)
    {
        console.warn('KTXParser - Only compressed formats supported');

        return;
    }

    var internalFormat = head.getUint32(4 * size, littleEndian);
    var width = head.getUint32(6 * size, littleEndian);
    var height = head.getUint32(7 * size, littleEndian);

    var mipmapLevels = Math.max(1, head.getUint32(11 * size, littleEndian));

    var bytesOfKeyValueData = head.getUint32(12 * size, littleEndian);

    var mipmaps = new Array(mipmapLevels);

    var offset = 12 + 13 * 4 + bytesOfKeyValueData;
    var levelWidth = width;
    var levelHeight = height;

    for (i = 0; i < mipmapLevels; i++)
    {
        var levelSize = new Int32Array(data, offset, 1)[0];

        offset += 4;

        mipmaps[i] = {
            data: new Uint8Array(data, offset, levelSize),
            width: levelWidth,
            height: levelHeight
        };

        levelWidth = Math.max(1, levelWidth >> 1);
        levelHeight = Math.max(1, levelHeight >> 1);

        offset += levelSize;
    }

    return {
        mipmaps: mipmaps,
        width: width,
        height: height,
        internalFormat: internalFormat,
        compressed: true,
        generateMipmap: false
    };
};

module.exports = KTXParser;
