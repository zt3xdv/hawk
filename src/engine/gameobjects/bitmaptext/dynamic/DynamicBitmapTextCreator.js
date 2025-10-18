var BitmapText = require('./DynamicBitmapText');
var BuildGameObject = require('../../BuildGameObject');
var GameObjectCreator = require('../../GameObjectCreator');
var GetAdvancedValue = require('../../../utils/object/GetAdvancedValue');

GameObjectCreator.register('dynamicBitmapText', function (config, addToScene)
{
    if (config === undefined) { config = {}; }

    var font = GetAdvancedValue(config, 'font', '');
    var text = GetAdvancedValue(config, 'text', '');
    var size = GetAdvancedValue(config, 'size', false);

    var bitmapText = new BitmapText(this.scene, 0, 0, font, text, size);

    if (addToScene !== undefined)
    {
        config.add = addToScene;
    }

    BuildGameObject(this.scene, bitmapText, config);

    return bitmapText;
});
