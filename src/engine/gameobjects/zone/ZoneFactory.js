var Zone = require('./Zone');
var GameObjectFactory = require('../GameObjectFactory');

GameObjectFactory.register('zone', function (x, y, width, height)
{
    return this.displayList.add(new Zone(this.scene, x, y, width, height));
});
