var BuildGameObject = require('../BuildGameObject');
var Layer = require('./Layer');
var GameObjectCreator = require('../GameObjectCreator');
var GetAdvancedValue = require('../../utils/object/GetAdvancedValue');

GameObjectCreator.register('layer', function (config, addToScene)
{
    if (config === undefined) { config = {}; }

    var children = GetAdvancedValue(config, 'children', null);

    var layer = new Layer(this.scene, children);

    if (addToScene !== undefined)
    {
        config.add = addToScene;
    }

    BuildGameObject(this.scene, layer, config);

    return layer;
});
