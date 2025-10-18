var GameObjectFactory = require('../GameObjectFactory');
var Sprite = require('./Sprite');

GameObjectFactory.register('sprite', function (x, y, texture, frame)
{
    return this.displayList.add(new Sprite(this.scene, x, y, texture, frame));
});
