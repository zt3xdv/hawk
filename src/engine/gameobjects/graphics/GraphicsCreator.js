var GameObjectCreator = require('../GameObjectCreator');
var Graphics = require('./Graphics');

GameObjectCreator.register('graphics', function (config, addToScene)
{
    if (config === undefined) { config = {}; }

    if (addToScene !== undefined)
    {
        config.add = addToScene;
    }

    var graphics = new Graphics(this.scene, config);

    if (config.add)
    {
        this.scene.sys.displayList.add(graphics);
    }

    return graphics;
});
