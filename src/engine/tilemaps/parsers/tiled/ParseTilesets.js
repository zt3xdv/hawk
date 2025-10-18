var Tileset = require('../../Tileset');
var ImageCollection = require('../../ImageCollection');
var ParseObject = require('./ParseObject');
var ParseWangsets = require('./ParseWangsets');

var ParseTilesets = function (json)
{
    var tilesets = [];
    var imageCollections = [];
    var lastSet = null;
    var stringID;

    for (var i = 0; i < json.tilesets.length; i++)
    {

        var set = json.tilesets[i];

        if (set.source)
        {
            console.warn('External tilesets unsupported. Use Embed Tileset and re-export');
        }
        else if (set.image)
        {
            var newSet = new Tileset(set.name, set.firstgid, set.tilewidth, set.tileheight, set.margin, set.spacing, undefined, undefined, set.tileoffset);

            if (json.version > 1)
            {
                var datas = undefined;
                var props = undefined;

                if (Array.isArray(set.tiles))
                {
                    datas = datas || {};
                    props = props || {};

                    for (var t = 0; t < set.tiles.length; t++)
                    {
                        var tile = set.tiles[t];

                        if (tile.properties)
                        {
                            var newPropData = {};

                            tile.properties.forEach(function (propData)
                            {
                                newPropData[propData['name']] = propData['value'];
                            });

                            props[tile.id] = newPropData;
                        }

                        if (tile.objectgroup)
                        {
                            (datas[tile.id] || (datas[tile.id] = {})).objectgroup = tile.objectgroup;

                            if (tile.objectgroup.objects)
                            {
                                var parsedObjects2 = tile.objectgroup.objects.map(function (obj)
                                {
                                    return ParseObject(obj);
                                });

                                datas[tile.id].objectgroup.objects = parsedObjects2;
                            }
                        }

                        if (tile.animation)
                        {
                            (datas[tile.id] || (datas[tile.id] = {})).animation = tile.animation;
                        }

                        if (tile.type)
                        {
                            (datas[tile.id] || (datas[tile.id] = {})).type = tile.type;
                        }
                    }
                }

                if (Array.isArray(set.wangsets))
                {
                    datas = datas || {};
                    props = props || {};

                    ParseWangsets(set.wangsets, datas);
                }

                if (datas) 
                {
                    newSet.tileData = datas;
                    newSet.tileProperties = props;
                }
            }
            else
            {

                if (set.tileproperties)
                {
                    newSet.tileProperties = set.tileproperties;
                }

                if (set.tiles)
                {
                    newSet.tileData = set.tiles;

                    for (stringID in newSet.tileData)
                    {
                        var objectGroup = newSet.tileData[stringID].objectgroup;

                        if (objectGroup && objectGroup.objects)
                        {
                            var parsedObjects1 = objectGroup.objects.map(function (obj)
                            {
                                return ParseObject(obj);
                            });

                            newSet.tileData[stringID].objectgroup.objects = parsedObjects1;
                        }
                    }
                }
            }

            newSet.updateTileData(set.imagewidth, set.imageheight);

            tilesets.push(newSet);
        }
        else
        {
            var newCollection = new ImageCollection(set.name, set.firstgid, set.tilewidth, set.tileheight, set.margin, set.spacing, set.properties);

            var maxId = 0;

            for (t = 0; t < set.tiles.length; t++)
            {
                tile = set.tiles[t];

                var image = tile.image;
                var tileId = parseInt(tile.id, 10);
                var gid = set.firstgid + tileId;
                var width = tile.imagewidth;
                var height = tile.imageheight;
                newCollection.addImage(gid, image, width, height);

                maxId = Math.max(tileId, maxId);
            }

            newCollection.maxId = maxId;

            imageCollections.push(newCollection);
        }

        if (lastSet)
        {
            lastSet.lastgid = set.firstgid - 1;
        }

        lastSet = set;
    }

    return { tilesets: tilesets, imageCollections: imageCollections };
};

module.exports = ParseTilesets;
