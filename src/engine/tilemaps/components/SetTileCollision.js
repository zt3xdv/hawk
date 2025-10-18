var SetTileCollision = function (tile, collides)
{
    if (collides)
    {
        tile.setCollision(true, true, true, true, false);
    }
    else
    {
        tile.resetCollision(false);
    }
};

module.exports = SetTileCollision;
