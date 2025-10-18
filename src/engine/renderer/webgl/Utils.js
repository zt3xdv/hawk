module.exports = {

    getTintFromFloats: function (r, g, b, a)
    {
        var ur = ((r * 255) | 0) & 0xff;
        var ug = ((g * 255) | 0) & 0xff;
        var ub = ((b * 255) | 0) & 0xff;
        var ua = ((a * 255) | 0) & 0xff;

        return ((ua << 24) | (ur << 16) | (ug << 8) | ub) >>> 0;
    },

    getTintAppendFloatAlpha: function (rgb, a)
    {
        var ua = ((a * 255) | 0) & 0xff;

        return ((ua << 24) | rgb) >>> 0;
    },

    getTintAppendFloatAlphaAndSwap: function (rgb, a)
    {
        var ur = ((rgb >> 16) | 0) & 0xff;
        var ug = ((rgb >> 8) | 0) & 0xff;
        var ub = (rgb | 0) & 0xff;
        var ua = ((a * 255) | 0) & 0xff;

        return ((ua << 24) | (ub << 16) | (ug << 8) | ur) >>> 0;
    },

    getFloatsFromUintRGB: function (rgb)
    {
        var ur = ((rgb >> 16) | 0) & 0xff;
        var ug = ((rgb >> 8) | 0) & 0xff;
        var ub = (rgb | 0) & 0xff;

        return [ ur / 255, ug / 255, ub / 255 ];
    },

    checkShaderMax: function (gl, maxTextures)
    {

        var gpuMax = Math.min(16, gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS));

        if (!maxTextures || maxTextures === -1)
        {
            return gpuMax;
        }
        else
        {
            return Math.min(gpuMax, maxTextures);
        }
    },

    parseFragmentShaderMaxTextures: function (fragmentShaderSource, maxTextures)
    {
        if (!fragmentShaderSource)
        {
            return '';
        }

        var src = '';

        for (var i = 0; i < maxTextures; i++)
        {
            if (i > 0)
            {
                src += '\n\telse ';
            }

            if (i < maxTextures - 1)
            {
                src += 'if (outTexId < ' + i + '.5)';
            }

            src += '\n\t{';
            src += '\n\t\ttexture = texture2D(uMainSampler[' + i + '], outTexCoord);';
            src += '\n\t}';
        }

        fragmentShaderSource = fragmentShaderSource.replace(/%count%/gi, maxTextures.toString());

        return fragmentShaderSource.replace(/%forloop%/gi, src);
    },

    setGlowQuality: function (shader, game, quality, distance)
    {
        if (quality === undefined)
        {
            quality = game.config.glowFXQuality;
        }

        if (distance === undefined)
        {
            distance = game.config.glowFXDistance;
        }

        shader = shader.replace(/__SIZE__/gi, (1 / quality / distance).toFixed(7));
        shader = shader.replace(/__DIST__/gi, distance.toFixed(0) + '.0');

        return shader;
    }

};
