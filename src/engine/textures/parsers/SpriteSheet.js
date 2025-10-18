var GetFastValue = require('../../utils/object/GetFastValue');

var SpriteSheet = function (texture, sourceIndex, x, y, width, height, config)
{
    var frameWidth = GetFastValue(config, 'frameWidth', null);
    var frameHeight = GetFastValue(config, 'frameHeight', frameWidth);

    if (frameWidth === null)
    {
        throw new Error('TextureManager.SpriteSheet: Invalid frameWidth given.');
    }

    var source = texture.source[sourceIndex];

    texture.add('__BASE', sourceIndex, 0, 0, source.width, source.height);

    var startFrame = GetFastValue(config, 'startFrame', 0);
    var endFrame = GetFastValue(config, 'endFrame', -1);
    var margin = GetFastValue(config, 'margin', 0);
    var spacing = GetFastValue(config, 'spacing', 0);

    var row = Math.floor((width - margin + spacing) / (frameWidth + spacing));
    var column = Math.floor((height - margin + spacing) / (frameHeight + spacing));
    var total = row * column;

    if (total === 0)
    {
        console.warn('SpriteSheet frame dimensions will result in zero frames for texture:', texture.key);
    }

    if (startFrame > total || startFrame < -total)
    {
        startFrame = 0;
    }

    if (startFrame < 0)
    {

        startFrame = total + startFrame;
    }

    if (endFrame === -1 || endFrame > total || endFrame < startFrame)
    {
        endFrame = total;
    }

    var fx = margin;
    var fy = margin;
    var ax = 0;
    var ay = 0;
    var c = 0;

    for (var i = 0; i < total; i++)
    {
        ax = 0;
        ay = 0;

        var w = fx + frameWidth;
        var h = fy + frameHeight;

        if (w > width)
        {
            ax = w - width;
        }

        if (h > height)
        {
            ay = h - height;
        }

        if (i >= startFrame && i <= endFrame)
        {
            texture.add(c, sourceIndex, x + fx, y + fy, frameWidth - ax, frameHeight - ay);

            c++;
        }

        fx += frameWidth + spacing;

        if (fx + frameWidth > width)
        {
            fx = margin;
            fy += frameHeight + spacing;
        }
    }

    return texture;
};

module.exports = SpriteSheet;
