var BuildGameObject = require('../BuildGameObject');
var GameObjectCreator = require('../GameObjectCreator');
var GetAdvancedValue = require('../../utils/object/GetAdvancedValue');
var PointLight = require('./PointLight');

GameObjectCreator.register('pointlight', function (config, addToScene)
{
    if (config === undefined) { config = {}; }

    var color = GetAdvancedValue(config, 'color', 0xffffff);
    var radius = GetAdvancedValue(config, 'radius', 128);
    var intensity = GetAdvancedValue(config, 'intensity', 1);
    var attenuation = GetAdvancedValue(config, 'attenuation', 0.1);

    var layer = new PointLight(this.scene, 0, 0, color, radius, intensity, attenuation);

    if (addToScene !== undefined)
    {
        config.add = addToScene;
    }

    BuildGameObject(this.scene, layer, config);

    return layer;
});
