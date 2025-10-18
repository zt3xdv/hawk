var AtlasXML = function (texture, sourceIndex, xml)
{

    if (!xml.getElementsByTagName('TextureAtlas'))
    {
        console.warn('Invalid Texture Atlas XML given');
        return;
    }

    var source = texture.source[sourceIndex];

    texture.add('__BASE', sourceIndex, 0, 0, source.width, source.height);

    var frames = xml.getElementsByTagName('SubTexture');

    var newFrame;

    for (var i = 0; i < frames.length; i++)
    {
        var frame = frames[i].attributes;

        var name = frame.name.value;
        var x = parseInt(frame.x.value, 10);
        var y = parseInt(frame.y.value, 10);
        var width = parseInt(frame.width.value, 10);
        var height = parseInt(frame.height.value, 10);

        newFrame = texture.add(name, sourceIndex, x, y, width, height);

        if (frame.frameX)
        {
            var frameX = Math.abs(parseInt(frame.frameX.value, 10));
            var frameY = Math.abs(parseInt(frame.frameY.value, 10));
            var frameWidth = parseInt(frame.frameWidth.value, 10);
            var frameHeight = parseInt(frame.frameHeight.value, 10);

            newFrame.setTrim(
                width,
                height,
                frameX,
                frameY,
                frameWidth,
                frameHeight
            );
        }
    }

    return texture;
};

module.exports = AtlasXML;
