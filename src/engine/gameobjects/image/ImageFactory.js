var Image = require('./Image');
var GameObjectFactory = require('../GameObjectFactory');

GameObjectFactory.register('image', function (x, y, texture, frame)
{
    return this.displayList.add(new Image(this.scene, x, y, texture, frame));
});
