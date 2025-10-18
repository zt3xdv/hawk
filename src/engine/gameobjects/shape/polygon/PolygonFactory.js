var GameObjectFactory = require('../../GameObjectFactory');
var Polygon = require('./Polygon');

GameObjectFactory.register('polygon', function (x, y, points, fillColor, fillAlpha)
{
    return this.displayList.add(new Polygon(this.scene, x, y, points, fillColor, fillAlpha));
});
