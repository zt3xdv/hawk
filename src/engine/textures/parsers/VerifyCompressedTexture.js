var IsSizePowerOfTwo = require('../../math/pow2/IsSizePowerOfTwo');

var verifyCompressedTexture = function (data)
{

    var mipmaps = data.mipmaps;
    for (var level = 1; level < mipmaps.length; level++)
    {
        var width = mipmaps[level].width;
        var height = mipmaps[level].height;
        if (!IsSizePowerOfTwo(width, height))
        {
            console.warn('Mip level ' + level + ' is not a power-of-two size: ' + width + 'x' + height);
            return false;
        }
    }

    var checker = formatCheckers[data.internalFormat];
    if (!checker)
    {
        console.warn('No format checker found for internal format ' + data.internalFormat + '. Assuming valid.');
        return true;
    }
    return checker(data);
};

function check4x4 (data)
{
    var mipmaps = data.mipmaps;
    for (var level = 0; level < mipmaps.length; level++)
    {
        var width = mipmaps[level].width;
        var height = mipmaps[level].height;
        if ((width << level) % 4 !== 0 || (height << level) % 4 !== 0)
        {
            console.warn('BPTC, RGTC, and S3TC dimensions must be a multiple of 4 pixels, and each successive mip level must be half the size of the previous level, rounded down. Mip level ' + level + ' is ' + width + 'x' + height);
            return false;
        }
    }
    return true;
}

function checkAlways ()
{

    return true;
}

function checkPVRTC (data)
{

    var mipmaps = data.mipmaps;
    var baseLevel = mipmaps[0];
    if (!IsSizePowerOfTwo(baseLevel.width, baseLevel.height))
    {
        console.warn('PVRTC base dimensions must be power of two. Base level is ' + baseLevel.width + 'x' + baseLevel.height);
        return false;
    }

    return true;
}

function checkS3TCSRGB (data)
{

    var mipmaps = data.mipmaps;
    var baseLevel = mipmaps[0];
    if (baseLevel.width % 4 !== 0 || baseLevel.height % 4 !== 0)
    {
        console.warn('S3TC SRGB base dimensions must be a multiple of 4 pixels. Base level is ' + baseLevel.width + 'x' + baseLevel.height + ' pixels');
        return false;
    }

    return true;
}

var formatCheckers = {

    0x9270: checkAlways,

    0x9271: checkAlways,

    0x9272: checkAlways,

    0x9273: checkAlways,

    0x9274: checkAlways,

    0x9275: checkAlways,

    0x9276: checkAlways,

    0x9277: checkAlways,

    0x9278: checkAlways,

    0x9279: checkAlways,

    0x8D64: checkAlways,

    0x93B0: checkAlways,

    0x93B1: checkAlways,

    0x93B2: checkAlways,

    0x93B3: checkAlways,

    0x93B4: checkAlways,

    0x93B5: checkAlways,

    0x93B6: checkAlways,

    0x93B7: checkAlways,

    0x93B8: checkAlways,

    0x93B9: checkAlways,

    0x93BA: checkAlways,

    0x93BB: checkAlways,

    0x93BC: checkAlways,

    0x93BD: checkAlways,

    0x93D0: checkAlways,

    0x93D1: checkAlways,

    0x93D2: checkAlways,

    0x93D3: checkAlways,

    0x93D4: checkAlways,

    0x93D5: checkAlways,

    0x93D6: checkAlways,

    0x93D7: checkAlways,

    0x93D8: checkAlways,

    0x93D9: checkAlways,

    0x93DA: checkAlways,

    0x93DB: checkAlways,

    0x93DC: checkAlways,

    0x93DD: checkAlways,

    0x8E8C: check4x4,

    0x8E8D: check4x4,

    0x8E8E: check4x4,

    0x8E8F: check4x4,

    0x8DBB: check4x4,

    0x8DBC: check4x4,

    0x8DBD: check4x4,

    0x8DBE: check4x4,

    0x8C00: checkPVRTC,

    0x8C01: checkPVRTC,

    0x8C02: checkPVRTC,

    0x8C03: checkPVRTC,

    0x83F0: check4x4,

    0x83F1: check4x4,

    0x83F2: check4x4,

    0x83F3: check4x4,

    0x8C4C: checkS3TCSRGB,

    0x8C4D: checkS3TCSRGB,

    0x8C4E: checkS3TCSRGB,

    0x8C4F: checkS3TCSRGB
};

module.exports = verifyCompressedTexture;
