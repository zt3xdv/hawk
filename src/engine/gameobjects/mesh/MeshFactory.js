var Mesh = require('./Mesh');
var GameObjectFactory = require('../GameObjectFactory');

if (typeof WEBGL_RENDERER)
{
    GameObjectFactory.register('mesh', function (x, y, texture, frame, vertices, uvs, indicies, containsZ, normals, colors, alphas)
    {
        return this.displayList.add(new Mesh(this.scene, x, y, texture, frame, vertices, uvs, indicies, containsZ, normals, colors, alphas));
    });
}
