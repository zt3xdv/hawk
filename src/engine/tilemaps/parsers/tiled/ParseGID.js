var FLIPPED_HORIZONTAL = 0x80000000;
var FLIPPED_VERTICAL = 0x40000000;
var FLIPPED_ANTI_DIAGONAL = 0x20000000; 

var ParseGID = function (gid)
{
    var flippedHorizontal = Boolean(gid & FLIPPED_HORIZONTAL);
    var flippedVertical = Boolean(gid & FLIPPED_VERTICAL);
    var flippedAntiDiagonal = Boolean(gid & FLIPPED_ANTI_DIAGONAL);
    gid = gid & ~(FLIPPED_HORIZONTAL | FLIPPED_VERTICAL | FLIPPED_ANTI_DIAGONAL);

    var rotation = 0;
    var flipped = false;

    if (flippedHorizontal && flippedVertical && flippedAntiDiagonal)
    {
        rotation = Math.PI / 2;
        flipped = true;
    }
    else if (flippedHorizontal && flippedVertical && !flippedAntiDiagonal)
    {
        rotation = Math.PI;
        flipped = false;
    }
    else if (flippedHorizontal && !flippedVertical && flippedAntiDiagonal)
    {
        rotation = Math.PI / 2;
        flipped = false;
    }
    else if (flippedHorizontal && !flippedVertical && !flippedAntiDiagonal)
    {
        rotation = 0;
        flipped = true;
    }
    else if (!flippedHorizontal && flippedVertical && flippedAntiDiagonal)
    {
        rotation = 3 * Math.PI / 2;
        flipped = false;
    }
    else if (!flippedHorizontal && flippedVertical && !flippedAntiDiagonal)
    {
        rotation = Math.PI;
        flipped = true;
    }
    else if (!flippedHorizontal && !flippedVertical && flippedAntiDiagonal)
    {
        rotation = 3 * Math.PI / 2;
        flipped = true;
    }
    else if (!flippedHorizontal && !flippedVertical && !flippedAntiDiagonal)
    {
        rotation = 0;
        flipped = false;
    }

    return {
        gid: gid,
        flippedHorizontal: flippedHorizontal,
        flippedVertical: flippedVertical,
        flippedAntiDiagonal: flippedAntiDiagonal,
        rotation: rotation,
        flipped: flipped
    };
};

module.exports = ParseGID;
