var Text = require('./Text');
var GameObjectFactory = require('../GameObjectFactory');

GameObjectFactory.register('text', function (x, y, text, style)
{
    return this.displayList.add(new Text(this.scene, x, y, text, style));
});
