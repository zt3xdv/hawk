var Extern = require('./Extern');
var GameObjectFactory = require('../GameObjectFactory');

GameObjectFactory.register('extern', function ()
{
    var extern = new Extern(this.scene);

    this.displayList.add(extern);

    return extern;
});
