var GetFastValue = require('../../../utils/object/GetFastValue');
var ParseObject = require('./ParseObject');
var ObjectLayer = require('../../mapdata/ObjectLayer');
var CreateGroupLayer = require('./CreateGroupLayer');

var ParseObjectLayers = function (json)
{
    var objectLayers = [];

    var groupStack = [];
    var curGroupState = CreateGroupLayer(json);

    while (curGroupState.i < curGroupState.layers.length || groupStack.length > 0)
    {
        if (curGroupState.i >= curGroupState.layers.length)
        {

            if (groupStack.length < 1)
            {
                console.warn(
                    'TilemapParser.parseTiledJSON - Invalid layer group hierarchy'
                );
                break;
            }

            curGroupState = groupStack.pop();
            continue;
        }

        var curo = curGroupState.layers[curGroupState.i];
        curGroupState.i++;

        curo.opacity *= curGroupState.opacity;
        curo.visible = curGroupState.visible && curo.visible;

        if (curo.type !== 'objectgroup')
        {
            if (curo.type === 'group')
            {

                var nextGroupState = CreateGroupLayer(json, curo, curGroupState);

                groupStack.push(curGroupState);
                curGroupState = nextGroupState;
            }

            continue;
        }

        curo.name = curGroupState.name + curo.name;
        var offsetX = curGroupState.x + GetFastValue(curo, 'startx', 0) + GetFastValue(curo, 'offsetx', 0);
        var offsetY = curGroupState.y + GetFastValue(curo, 'starty', 0) + GetFastValue(curo, 'offsety', 0);

        var objects = [];
        for (var j = 0; j < curo.objects.length; j++)
        {
            var parsedObject = ParseObject(curo.objects[j], offsetX, offsetY);

            objects.push(parsedObject);
        }

        var objectLayer = new ObjectLayer(curo);
        objectLayer.objects = objects;

        objectLayers.push(objectLayer);
    }

    return objectLayers;
};

module.exports = ParseObjectLayers;
