var Class = require('../../../utils/Class');
var GetFastValue = require('../../../utils/object/GetFastValue');
var LightShaderSourceFS = require('../shaders/Light-frag');
var MultiPipeline = require('./MultiPipeline');
var TransformMatrix = require('../../../gameobjects/components/TransformMatrix');
var Vec2 = require('../../../math/Vector2');
var WebGLPipeline = require('../WebGLPipeline');

var LightPipeline = new Class({

    Extends: MultiPipeline,

    initialize:

    function LightPipeline (config)
    {
        var fragShader = GetFastValue(config, 'fragShader', LightShaderSourceFS);

        config.fragShader = fragShader.replace('%LIGHT_COUNT%', config.game.renderer.config.maxLights);

        MultiPipeline.call(this, config);

        this.inverseRotationMatrix = new Float32Array([
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ]);

        this.currentNormalMap;

        this.lightsActive = true;

        this.tempVec2 = new Vec2();

        this._tempMatrix = new TransformMatrix();

        this._tempMatrix2 = new TransformMatrix();
    },

    boot: function ()
    {
        WebGLPipeline.prototype.boot.call(this);
    },

    onRender: function (scene, camera)
    {
        var lightManager = scene.sys.lights;

        this.lightsActive = false;

        if (!lightManager || !lightManager.active)
        {
            return;
        }

        var lights = lightManager.getLights(camera);
        var lightsCount = lights.length;

        this.lightsActive = true;

        var i;
        var renderer = this.renderer;
        var height = renderer.height;
        var cameraMatrix = camera.matrix;
        var tempVec2 = this.tempVec2;

        this.set1i('uMainSampler', 0);
        this.set1i('uNormSampler', 1);
        this.set2f('uResolution', this.width / 2, this.height / 2);
        this.set4f('uCamera', camera.x, camera.y, camera.rotation, camera.zoom);
        this.set3f('uAmbientLightColor', lightManager.ambientColor.r, lightManager.ambientColor.g, lightManager.ambientColor.b);
        this.set1i('uLightCount', lightsCount);

        for (i = 0; i < lightsCount; i++)
        {
            var light = lights[i].light;
            var color = light.color;

            var lightName = 'uLights[' + i + '].';

            cameraMatrix.transformPoint(light.x, light.y, tempVec2);

            this.set2f(lightName + 'position', tempVec2.x - (camera.scrollX * light.scrollFactorX * camera.zoom), height - (tempVec2.y - (camera.scrollY * light.scrollFactorY) * camera.zoom));
            this.set3f(lightName + 'color', color.r, color.g, color.b);
            this.set1f(lightName + 'intensity', light.intensity);
            this.set1f(lightName + 'radius', light.radius);
        }

        this.currentNormalMapRotation = null;
    },

    setNormalMapRotation: function (rotation)
    {
        if (rotation !== this.currentNormalMapRotation || this.vertexCount === 0)
        {
            if (this.vertexCount > 0)
            {
                this.flush();
            }

            var inverseRotationMatrix = this.inverseRotationMatrix;

            if (rotation)
            {
                var rot = -rotation;
                var c = Math.cos(rot);
                var s = Math.sin(rot);

                inverseRotationMatrix[1] = s;
                inverseRotationMatrix[3] = -s;
                inverseRotationMatrix[0] = inverseRotationMatrix[4] = c;
            }
            else
            {
                inverseRotationMatrix[0] = inverseRotationMatrix[4] = 1;
                inverseRotationMatrix[1] = inverseRotationMatrix[3] = 0;
            }

            this.setMatrix3fv('uInverseRotationMatrix', false, inverseRotationMatrix);

            this.currentNormalMapRotation = rotation;
        }
    },

    setTexture2D: function (texture, gameObject)
    {
        var renderer = this.renderer;

        if (texture === undefined) { texture = renderer.whiteTexture; }

        var normalMap = this.getNormalMap(gameObject);

        if (this.isNewNormalMap(texture, normalMap))
        {
            this.flush();

            this.createBatch(texture);

            this.addTextureToBatch(normalMap);

            this.currentNormalMap = normalMap;
        }

        var rotation = 0;

        if (gameObject && gameObject.parentContainer)
        {
            var matrix = gameObject.getWorldTransformMatrix(this._tempMatrix, this._tempMatrix2);

            rotation = matrix.rotationNormalized;
        }
        else if (gameObject)
        {
            rotation = gameObject.rotation;
        }

        if (this.currentBatch === null)
        {
            this.createBatch(texture);

            this.addTextureToBatch(normalMap);
        }

        this.setNormalMapRotation(rotation);

        return 0;
    },

    setGameObject: function (gameObject, frame)
    {
        if (frame === undefined) { frame = gameObject.frame; }

        var texture = frame.glTexture;
        var normalMap = this.getNormalMap(gameObject);

        if (this.isNewNormalMap(texture, normalMap))
        {
            this.flush();

            this.createBatch(texture);

            this.addTextureToBatch(normalMap);

            this.currentNormalMap = normalMap;
        }

        if (gameObject.parentContainer)
        {
            var matrix = gameObject.getWorldTransformMatrix(this._tempMatrix, this._tempMatrix2);

            this.setNormalMapRotation(matrix.rotationNormalized);
        }
        else
        {
            this.setNormalMapRotation(gameObject.rotation);
        }

        if (this.currentBatch === null)
        {
            this.createBatch(texture);

            this.addTextureToBatch(normalMap);
        }

        return 0;
    },

    isNewNormalMap: function (texture, normalMap)
    {
        return (this.currentTexture !== texture || this.currentNormalMap !== normalMap);
    },

    getNormalMap: function (gameObject)
    {
        var normalMap;

        if (!gameObject)
        {
            return this.renderer.normalTexture;
        }
        else if (gameObject.displayTexture)
        {
            normalMap = gameObject.displayTexture.dataSource[gameObject.displayFrame.sourceIndex];
        }
        else if (gameObject.texture)
        {
            normalMap = gameObject.texture.dataSource[gameObject.frame.sourceIndex];
        }
        else if (gameObject.tileset)
        {
            if (Array.isArray(gameObject.tileset))
            {
                normalMap = gameObject.tileset[0].image.dataSource[0];
            }
            else
            {
                normalMap = gameObject.tileset.image.dataSource[0];
            }
        }

        if (!normalMap)
        {
            return this.renderer.normalTexture;
        }

        return normalMap.glTexture;
    },

    batchSprite: function (gameObject, camera, parentTransformMatrix)
    {
        if (this.lightsActive)
        {
            MultiPipeline.prototype.batchSprite.call(this, gameObject, camera, parentTransformMatrix);
        }
    },

    batchTexture: function (
        gameObject,
        texture,
        textureWidth, textureHeight,
        srcX, srcY,
        srcWidth, srcHeight,
        scaleX, scaleY,
        rotation,
        flipX, flipY,
        scrollFactorX, scrollFactorY,
        displayOriginX, displayOriginY,
        frameX, frameY, frameWidth, frameHeight,
        tintTL, tintTR, tintBL, tintBR, tintEffect,
        uOffset, vOffset,
        camera,
        parentTransformMatrix,
        skipFlip,
        textureUnit)
    {
        if (this.lightsActive)
        {
            MultiPipeline.prototype.batchTexture.call(
                this,
                gameObject,
                texture,
                textureWidth, textureHeight,
                srcX, srcY,
                srcWidth, srcHeight,
                scaleX, scaleY,
                rotation,
                flipX, flipY,
                scrollFactorX, scrollFactorY,
                displayOriginX, displayOriginY,
                frameX, frameY, frameWidth, frameHeight,
                tintTL, tintTR, tintBL, tintBR, tintEffect,
                uOffset, vOffset,
                camera,
                parentTransformMatrix,
                skipFlip,
                textureUnit
            );
        }
    },

    batchTextureFrame: function (
        frame,
        x, y,
        tint, alpha,
        transformMatrix,
        parentTransformMatrix
    )
    {
        if (this.lightsActive)
        {
            MultiPipeline.prototype.batchTextureFrame.call(
                this,
                frame,
                x, y,
                tint, alpha,
                transformMatrix,
                parentTransformMatrix
            );
        }
    }

});

module.exports = LightPipeline;
