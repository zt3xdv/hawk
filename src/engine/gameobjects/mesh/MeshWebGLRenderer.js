var GetCalcMatrix = require('../GetCalcMatrix');

var MeshWebGLRenderer = function (renderer, src, camera, parentMatrix)
{
    var faces = src.faces;
    var totalFaces = faces.length;

    if (totalFaces === 0)
    {
        return;
    }

    camera.addToRenderList(src);

    var pipeline = renderer.pipelines.set(src.pipeline, src);

    var calcMatrix = GetCalcMatrix(src, camera, parentMatrix).calc;

    renderer.pipelines.preBatch(src);

    var textureUnit = pipeline.setGameObject(src);

    var F32 = pipeline.vertexViewF32;
    var U32 = pipeline.vertexViewU32;

    var vertexOffset = (pipeline.vertexCount * pipeline.currentShader.vertexComponentCount) - 1;

    var tintEffect = src.tintFill;

    var debugFaces = [];
    var debugCallback = src.debugCallback;

    var a = calcMatrix.a;
    var b = calcMatrix.b;
    var c = calcMatrix.c;
    var d = calcMatrix.d;
    var e = calcMatrix.e;
    var f = calcMatrix.f;

    var z = src.viewPosition.z;

    var hideCCW = src.hideCCW;
    var roundPixels = camera.roundPixels;
    var alpha = camera.alpha * src.alpha;

    var totalFacesRendered = 0;

    for (var i = 0; i < totalFaces; i++)
    {
        var face = faces[i];

        if (!face.isInView(camera, hideCCW, z, alpha, a, b, c, d, e, f, roundPixels))
        {
            continue;
        }

        if (pipeline.shouldFlush(3))
        {
            pipeline.flush();

            textureUnit = pipeline.setGameObject(src);

            vertexOffset = (pipeline.vertexCount * pipeline.currentShader.vertexComponentCount) - 1;
        }

        vertexOffset = face.load(F32, U32, vertexOffset, textureUnit, tintEffect);

        totalFacesRendered++;

        pipeline.vertexCount += 3;

        pipeline.currentBatch.count = (pipeline.vertexCount - pipeline.currentBatch.start);

        if (debugCallback)
        {
            debugFaces.push(face);
        }
    }

    src.totalFrame += totalFacesRendered;

    if (debugCallback)
    {
        debugCallback.call(src, src, debugFaces);
    }

    renderer.pipelines.postBatch(src);
};

module.exports = MeshWebGLRenderer;
