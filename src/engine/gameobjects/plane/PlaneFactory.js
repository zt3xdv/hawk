var Plane = require('./Plane');
var GameObjectFactory = require('../GameObjectFactory');

GameObjectFactory.register('plane', function (x, y, texture, frame, width, height, tile)
{
    return this.displayList.add(new Plane(this.scene, x, y, texture, frame, width, height, tile));
});
