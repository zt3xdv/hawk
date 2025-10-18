var RectangleToRectangle = require('../../geom/intersects/RectangleToRectangle');
var TransformMatrix = require('../components/TransformMatrix');
var Utils = require('../../renderer/webgl/Utils');

var tempMatrix1 = new TransformMatrix();
var tempMatrix2 = new TransformMatrix();
var tempMatrix3 = new TransformMatrix();
var tempMatrix4 = new TransformMatrix();

var ParticleEmitterWebGLRenderer = function (renderer, emitter, camera, parentMatrix)
{
    var pipeline = renderer.pipelines.set(emitter.pipeline);

    var camMatrix = tempMatrix1;
    var calcMatrix = tempMatrix2;
    var particleMatrix = tempMatrix3;
    var managerMatrix = tempMatrix4;

    if (parentMatrix)
    {
        managerMatrix.loadIdentity();
        managerMatrix.multiply(parentMatrix);
        managerMatrix.translate(emitter.x, emitter.y);
        managerMatrix.rotate(emitter.rotation);
        managerMatrix.scale(emitter.scaleX, emitter.scaleY);
    }
    else
    {
        managerMatrix.applyITRS(emitter.x, emitter.y, emitter.rotation, emitter.scaleX, emitter.scaleY);
    }

    var getTint = Utils.getTintAppendFloatAlpha;
    var camerAlpha = camera.alpha;
    var emitterAlpha = emitter.alpha;

    renderer.pipelines.preBatch(emitter);

    var particles = emitter.alive;
    var particleCount = particles.length;
    var viewBounds = emitter.viewBounds;

    if (particleCount === 0 || (viewBounds && !RectangleToRectangle(viewBounds, camera.worldView)))
    {
        return;
    }

    if (emitter.sortCallback)
    {
        emitter.depthSort();
    }

    camera.addToRenderList(emitter);

    camMatrix.copyFrom(camera.matrix);

    camMatrix.multiplyWithOffset(managerMatrix, -camera.scrollX * emitter.scrollFactorX, -camera.scrollY * emitter.scrollFactorY);

    renderer.setBlendMode(emitter.blendMode);

    if (emitter.mask)
    {
        emitter.mask.preRenderWebGL(renderer, emitter, camera);

        renderer.pipelines.set(emitter.pipeline);
    }

    var tintEffect = emitter.tintFill;
    var textureUnit;
    var glTexture;

    for (var i = 0; i < particleCount; i++)
    {
        var particle = particles[i];

        var alpha = particle.alpha * emitterAlpha * camerAlpha;

        if (alpha <= 0 || particle.scaleX === 0 || particle.scaleY === 0)
        {
            continue;
        }

        particleMatrix.applyITRS(particle.x, particle.y, particle.rotation, particle.scaleX, particle.scaleY);

        particleMatrix.e = particle.x;
        particleMatrix.f = particle.y;

        camMatrix.multiply(particleMatrix, calcMatrix);

        var frame = particle.frame;

        if (frame.glTexture !== glTexture)
        {
            glTexture = frame.glTexture;

            textureUnit = pipeline.setGameObject(emitter, frame);
        }

        var x = -frame.halfWidth;
        var y = -frame.halfHeight;

        var quad = calcMatrix.setQuad(x, y, x + frame.width, y + frame.height);

        var tint = getTint(particle.tint, alpha);

        if (pipeline.shouldFlush(6))
        {
            pipeline.flush();

            textureUnit = pipeline.setGameObject(emitter, frame);
        }

        pipeline.batchQuad(
            emitter,
            quad[0], quad[1], quad[2], quad[3], quad[4], quad[5], quad[6], quad[7],
            frame.u0, frame.v0, frame.u1, frame.v1,
            tint, tint, tint, tint,
            tintEffect,
            glTexture,
            textureUnit
        );
    }

    if (emitter.mask)
    {
        emitter.mask.postRenderWebGL(renderer, camera);
    }

    renderer.pipelines.postBatch(emitter);
};

module.exports = ParticleEmitterWebGLRenderer;
