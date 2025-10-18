var Shader = require('./Shader');
var GameObjectFactory = require('../GameObjectFactory');

if (typeof WEBGL_RENDERER)
{
    GameObjectFactory.register('shader', function (key, x, y, width, height, textures, textureData)
    {
        return this.displayList.add(new Shader(this.scene, key, x, y, width, height, textures, textureData));
    });
}
