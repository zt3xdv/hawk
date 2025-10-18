var Pick = require('../../../utils/object/Pick');
var ParseGID = require('./ParseGID');

var copyPoints = function (p) { return { x: p.x, y: p.y }; };

var commonObjectProps = [ 'id', 'name', 'type', 'rotation', 'properties', 'visible', 'x', 'y', 'width', 'height' ];

var ParseObject = function (tiledObject, offsetX, offsetY)
{
    if (offsetX === undefined) { offsetX = 0; }
    if (offsetY === undefined) { offsetY = 0; }

    var parsedObject = Pick(tiledObject, commonObjectProps);

    parsedObject.x += offsetX;
    parsedObject.y += offsetY;

    if (tiledObject.gid)
    {

        var gidInfo = ParseGID(tiledObject.gid);
        parsedObject.gid = gidInfo.gid;
        parsedObject.flippedHorizontal = gidInfo.flippedHorizontal;
        parsedObject.flippedVertical = gidInfo.flippedVertical;
        parsedObject.flippedAntiDiagonal = gidInfo.flippedAntiDiagonal;
    }
    else if (tiledObject.polyline)
    {
        parsedObject.polyline = tiledObject.polyline.map(copyPoints);
    }
    else if (tiledObject.polygon)
    {
        parsedObject.polygon = tiledObject.polygon.map(copyPoints);
    }
    else if (tiledObject.ellipse)
    {
        parsedObject.ellipse = tiledObject.ellipse;
    }
    else if (tiledObject.text)
    {
        parsedObject.text = tiledObject.text;
    }
    else if (tiledObject.point)
    {
        parsedObject.point = true;
    }
    else
    {

        parsedObject.rectangle = true;
    }

    return parsedObject;
};

module.exports = ParseObject;
