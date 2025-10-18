var TransformMatrix = require('../gameobjects/components/TransformMatrix');

var tempMatrix1 = new TransformMatrix();
var tempMatrix2 = new TransformMatrix();
var tempMatrix3 = new TransformMatrix();

var TilemapLayerCanvasRenderer = function (renderer, src, camera, parentMatrix)
{
    var renderTiles = src.cull(camera);

    var tileCount = renderTiles.length;
    var alpha = camera.alpha * src.alpha;

    if (tileCount === 0 || alpha <= 0)
    {
        return;
    }

    var camMatrix = tempMatrix1;
    var layerMatrix = tempMatrix2;
    var calcMatrix = tempMatrix3;

    layerMatrix.applyITRS(src.x, src.y, src.rotation, src.scaleX, src.scaleY);

    camMatrix.copyFrom(camera.matrix);

    var ctx = renderer.currentContext;
    var gidMap = src.gidMap;

    ctx.save();

    if (parentMatrix)
    {

        camMatrix.multiplyWithOffset(parentMatrix, -camera.scrollX * src.scrollFactorX, -camera.scrollY * src.scrollFactorY);

        layerMatrix.e = src.x;
        layerMatrix.f = src.y;

        camMatrix.multiply(layerMatrix, calcMatrix);

        calcMatrix.copyToContext(ctx);
    }
    else
    {
        layerMatrix.e -= camera.scrollX * src.scrollFactorX;
        layerMatrix.f -= camera.scrollY * src.scrollFactorY;

        layerMatrix.copyToContext(ctx);
    }

    if (!renderer.antialias || src.scaleX > 1 || src.scaleY > 1)
    {
        ctx.imageSmoothingEnabled = false;
    }

    for (var i = 0; i < tileCount; i++)
    {
        var tile = renderTiles[i];

        var tileset = gidMap[tile.index];

        if (!tileset)
        {
            continue;
        }

        var image = tileset.image.getSourceImage();

        var tileTexCoords = tileset.getTileTextureCoordinates(tile.index);
        var tileWidth = tileset.tileWidth;
        var tileHeight = tileset.tileHeight;

        if (tileTexCoords === null || tileWidth === 0 || tileHeight === 0)
        {
            continue;
        }

        var halfWidth = tileWidth * 0.5;
        var halfHeight = tileHeight * 0.5;

        tileTexCoords.x += tileset.tileOffset.x;
        tileTexCoords.y += tileset.tileOffset.y;

        ctx.save();

        ctx.translate(tile.pixelX + halfWidth, tile.pixelY + halfHeight);

        if (tile.rotation !== 0)
        {
            ctx.rotate(tile.rotation);
        }

        if (tile.flipX || tile.flipY)
        {
            ctx.scale((tile.flipX) ? -1 : 1, (tile.flipY) ? -1 : 1);
        }

        ctx.globalAlpha = alpha * tile.alpha;

        ctx.drawImage(
            image,
            tileTexCoords.x, tileTexCoords.y,
            tileWidth , tileHeight,
            -halfWidth, -halfHeight,
            tileWidth, tileHeight
        );

        ctx.restore();
    }

    ctx.restore();
};

module.exports = TilemapLayerCanvasRenderer;
