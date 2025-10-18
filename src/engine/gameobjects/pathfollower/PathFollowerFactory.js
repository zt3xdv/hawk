var GameObjectFactory = require('../GameObjectFactory');
var PathFollower = require('./PathFollower');

GameObjectFactory.register('follower', function (path, x, y, key, frame)
{
    var sprite = new PathFollower(this.scene, path, x, y, key, frame);

    this.displayList.add(sprite);
    this.updateList.add(sprite);

    return sprite;
});
