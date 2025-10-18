var TileSprite = require('./TileSprite');
var GameObjectFactory = require('../GameObjectFactory');

GameObjectFactory.register('tileSprite', function (x, y, width, height, texture, frame)
{
    return this.displayList.add(new TileSprite(this.scene, x, y, width, height, texture, frame));
});
