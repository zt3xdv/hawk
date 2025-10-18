var Video = require('./Video');
var GameObjectFactory = require('../GameObjectFactory');

GameObjectFactory.register('video', function (x, y, key)
{
    return this.displayList.add(new Video(this.scene, x, y, key));
});
