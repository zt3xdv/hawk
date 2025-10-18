var GameObjectFactory = require('../../GameObjectFactory');
var IsoBox = require('./IsoBox');

GameObjectFactory.register('isobox', function (x, y, size, height, fillTop, fillLeft, fillRight)
{
    return this.displayList.add(new IsoBox(this.scene, x, y, size, height, fillTop, fillLeft, fillRight));
});
