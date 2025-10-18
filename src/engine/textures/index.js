var Extend = require('../utils/object/Extend');
var FilterMode = require('./const');

var Textures = {

    CanvasTexture: require('./CanvasTexture'),
    DynamicTexture: require('./DynamicTexture'),
    Events: require('./events'),
    FilterMode: FilterMode,
    Frame: require('./Frame'),
    Parsers: require('./parsers'),
    Texture: require('./Texture'),
    TextureManager: require('./TextureManager'),
    TextureSource: require('./TextureSource')

};

Textures = Extend(false, Textures, FilterMode);

module.exports = Textures;
