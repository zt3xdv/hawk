var Face = require('./Face');
var Vertex = require('./Vertex');

var GenerateVerts = function (vertices, uvs, indicies, containsZ, normals, colors, alphas, flipUV)
{
    if (containsZ === undefined) { containsZ = false; }
    if (colors === undefined) { colors = 0xffffff; }
    if (alphas === undefined) { alphas = 1; }
    if (flipUV === undefined) { flipUV = false; }

    if (vertices.length !== uvs.length && !containsZ)
    {
        console.warn('GenerateVerts: vertices and uvs count not equal');
        return;
    }

    var result = {
        faces: [],
        vertices: []
    };

    var i;

    var x;
    var y;
    var z;

    var u;
    var v;

    var color;
    var alpha;

    var normalX;
    var normalY;
    var normalZ;

    var iInc = (containsZ) ? 3 : 2;

    var isColorArray = Array.isArray(colors);
    var isAlphaArray = Array.isArray(alphas);

    if (Array.isArray(indicies) && indicies.length > 0)
    {
        for (i = 0; i < indicies.length; i++)
        {
            var index1 = indicies[i];
            var index2 = indicies[i] * 2;
            var index3 = indicies[i] * iInc;

            x = vertices[index3];
            y = vertices[index3 + 1];
            z = (containsZ) ? vertices[index3 + 2] : 0;

            u = uvs[index2];
            v = uvs[index2 + 1];

            if (flipUV)
            {
                v = 1 - v;
            }

            color = (isColorArray) ? colors[index1] : colors;
            alpha = (isAlphaArray) ? alphas[index1] : alphas;

            normalX = 0;
            normalY = 0;
            normalZ = 0;

            if (normals)
            {
                normalX = normals[index3];
                normalY = normals[index3 + 1];
                normalZ = (containsZ) ? normals[index3 + 2] : 0;
            }

            result.vertices.push(new Vertex(x, y, z, u, v, color, alpha, normalX, normalY, normalZ));
        }
    }
    else
    {
        var uvIndex = 0;
        var colorIndex = 0;

        for (i = 0; i < vertices.length; i += iInc)
        {
            x = vertices[i];
            y = vertices[i + 1];
            z = (containsZ) ? vertices[i + 2] : 0;

            u = uvs[uvIndex];
            v = uvs[uvIndex + 1];

            color = (isColorArray) ? colors[colorIndex] : colors;
            alpha = (isAlphaArray) ? alphas[colorIndex] : alphas;

            normalX = 0;
            normalY = 0;
            normalZ = 0;

            if (normals)
            {
                normalX = normals[i];
                normalY = normals[i + 1];
                normalZ = (containsZ) ? normals[i + 2] : 0;
            }

            result.vertices.push(new Vertex(x, y, z, u, v, color, alpha, normalX, normalY, normalZ));

            uvIndex += 2;
            colorIndex++;
        }
    }

    for (i = 0; i < result.vertices.length; i += 3)
    {
        var vert1 = result.vertices[i];
        var vert2 = result.vertices[i + 1];
        var vert3 = result.vertices[i + 2];

        result.faces.push(new Face(vert1, vert2, vert3));
    }

    return result;
};

module.exports = GenerateVerts;
