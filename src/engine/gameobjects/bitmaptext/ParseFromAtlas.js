var ParseXMLBitmapFont = require('./ParseXMLBitmapFont');

var ParseFromAtlas = function (scene, fontName, textureKey, frameKey, xmlKey, xSpacing, ySpacing)
{
    var texture = scene.sys.textures.get(textureKey);
    var frame = texture.get(frameKey);
    var xml = scene.sys.cache.xml.get(xmlKey);

    if (frame && xml)
    {
        var data = ParseXMLBitmapFont(xml, frame, xSpacing, ySpacing, texture);

        scene.sys.cache.bitmapFont.add(fontName, { data: data, texture: textureKey, frame: frameKey, fromAtlas: true });

        return true;
    }
    else
    {
        return false;
    }
};

module.exports = ParseFromAtlas;
