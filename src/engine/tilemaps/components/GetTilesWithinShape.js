var Geom = require('../../geom/');
var GetTilesWithin = require('./GetTilesWithin');
var Intersects = require('../../geom/intersects/');
var NOOP = require('../../utils/NOOP');
var Vector2 = require('../../math/Vector2');
var CONST = require('../const/ORIENTATION_CONST');

var TriangleToRectangle = function (triangle, rect)
{
    return Intersects.RectangleToTriangle(rect, triangle);
};

var point = new Vector2();
var pointStart = new Vector2();
var pointEnd = new Vector2();

var GetTilesWithinShape = function (shape, filteringOptions, camera, layer)
{
    if (layer.orientation !== CONST.ORTHOGONAL)
    {
        console.warn('GetTilesWithinShape only works with orthogonal tilemaps');
        return [];
    }

    if (shape === undefined) { return []; }

    var intersectTest = NOOP;

    if (shape instanceof Geom.Circle)
    {
        intersectTest = Intersects.CircleToRectangle;
    }
    else if (shape instanceof Geom.Rectangle)
    {
        intersectTest = Intersects.RectangleToRectangle;
    }
    else if (shape instanceof Geom.Triangle)
    {
        intersectTest = TriangleToRectangle;
    }
    else if (shape instanceof Geom.Line)
    {
        intersectTest = Intersects.LineToRectangle;
    }

    layer.tilemapLayer.worldToTileXY(shape.left, shape.top, true, pointStart, camera);

    var xStart = pointStart.x;
    var yStart = pointStart.y;

    layer.tilemapLayer.worldToTileXY(shape.right, shape.bottom, false, pointEnd, camera);

    var xEnd = Math.ceil(pointEnd.x);
    var yEnd = Math.ceil(pointEnd.y);

    var width = Math.max(xEnd - xStart, 1);
    var height = Math.max(yEnd - yStart, 1);

    var tiles = GetTilesWithin(xStart, yStart, width, height, filteringOptions, layer);

    var tileWidth = layer.tileWidth;
    var tileHeight = layer.tileHeight;

    if (layer.tilemapLayer)
    {
        tileWidth *= layer.tilemapLayer.scaleX;
        tileHeight *= layer.tilemapLayer.scaleY;
    }

    var results = [];
    var tileRect = new Geom.Rectangle(0, 0, tileWidth, tileHeight);

    for (var i = 0; i < tiles.length; i++)
    {
        var tile = tiles[i];

        layer.tilemapLayer.tileToWorldXY(tile.x, tile.y, point, camera);

        tileRect.x = point.x;
        tileRect.y = point.y;

        if (intersectTest(shape, tileRect))
        {
            results.push(tile);
        }
    }

    return results;
};

module.exports = GetTilesWithinShape;
