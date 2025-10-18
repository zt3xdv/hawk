var Layer = require('./Layer');
var GameObjectFactory = require('../GameObjectFactory');

GameObjectFactory.register('layer', function (children)
{
    return this.displayList.add(new Layer(this.scene, children));
});
