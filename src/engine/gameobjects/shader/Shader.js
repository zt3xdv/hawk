var Class = require('../../utils/Class');
var Components = require('../components');
var GameObject = require('../GameObject');
var GetFastValue = require('../../utils/object/GetFastValue');
var Extend = require('../../utils/object/Extend');
var SetValue = require('../../utils/object/SetValue');
var ShaderRender = require('./ShaderRender');
var TransformMatrix = require('../components/TransformMatrix');
var ArrayEach = require('../../utils/array/Each');
var RenderEvents = require('../../renderer/events');

var Shader = new Class({

    Extends: GameObject,

    Mixins: [
        Components.ComputedSize,
        Components.Depth,
        Components.GetBounds,
        Components.Mask,
        Components.Origin,
        Components.ScrollFactor,
        Components.Transform,
        Components.Visible,
        ShaderRender
    ],

    initialize:

    function Shader (scene, key, x, y, width, height, textures, textureData)
    {
        if (x === undefined) { x = 0; }
        if (y === undefined) { y = 0; }
        if (width === undefined) { width = 128; }
        if (height === undefined) { height = 128; }

        GameObject.call(this, scene, 'Shader');

        this.blendMode = -1;

        this.shader;

        var renderer = scene.sys.renderer;

        this.renderer = renderer;

        this.gl = renderer.gl;

        this.vertexData = new ArrayBuffer(6 * (Float32Array.BYTES_PER_ELEMENT * 2));

        this.vertexBuffer = renderer.createVertexBuffer(this.vertexData.byteLength, this.gl.STREAM_DRAW);

        this._deferSetShader = null;

        this._deferProjOrtho = null;

        this.program = null;

        this.bytes = new Uint8Array(this.vertexData);

        this.vertexViewF32 = new Float32Array(this.vertexData);

        this._tempMatrix1 = new TransformMatrix();

        this._tempMatrix2 = new TransformMatrix();

        this._tempMatrix3 = new TransformMatrix();

        this.viewMatrix = new Float32Array([ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ]);

        this.projectionMatrix = new Float32Array([ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ]);

        this.uniforms = {};

        this.pointer = null;

        this._rendererWidth = renderer.width;

        this._rendererHeight = renderer.height;

        this._textureCount = 0;

        this.framebuffer = null;

        this.glTexture = null;

        this.renderToTexture = false;

        this.texture = null;

        this.setPosition(x, y);
        this.setSize(width, height);
        this.setOrigin(0.5, 0.5);
        this.setShader(key, textures, textureData);

        this.renderer.on(RenderEvents.RESTORE_WEBGL, this.onContextRestored, this);
    },

    willRender: function (camera)
    {
        if (this.renderToTexture)
        {
            return true;
        }
        else
        {
            return !(GameObject.RENDER_MASK !== this.renderFlags || (this.cameraFilter !== 0 && (this.cameraFilter & camera.id)));
        }
    },

    setRenderToTexture: function (key, flipY)
    {
        if (flipY === undefined) { flipY = false; }

        if (!this.renderToTexture)
        {
            var width = this.width;
            var height = this.height;
            var renderer = this.renderer;

            this.glTexture = renderer.createTextureFromSource(null, width, height, 0);

            this.framebuffer = renderer.createFramebuffer(width, height, this.glTexture, false);

            this._rendererWidth = width;
            this._rendererHeight = height;

            this.renderToTexture = true;

            this.projOrtho(0, this.width, this.height, 0);

            if (key)
            {
                this.texture = this.scene.sys.textures.addGLTexture(key, this.glTexture);
            }
        }

        if (this.shader)
        {
            renderer.pipelines.clear();

            this.load();
            this.flush();

            renderer.pipelines.rebind();
        }

        return this;
    },

    setShader: function (key, textures, textureData)
    {
        if (this.renderer.contextLost)
        {
            this._deferSetShader = { key: key, textures: textures, textureData: textureData };
            return this;
        }

        if (textures === undefined) { textures = []; }

        if (typeof key === 'string')
        {
            var cache = this.scene.sys.cache.shader;

            if (!cache.has(key))
            {
                console.warn('Shader missing: ' + key);
                return this;
            }

            this.shader = cache.get(key);
        }
        else
        {
            this.shader = key;
        }

        var gl = this.gl;
        var renderer = this.renderer;

        if (this.program)
        {
            renderer.deleteProgram(this.program);
        }

        var program = renderer.createProgram(this.shader.vertexSrc, this.shader.fragmentSrc);

        gl.uniformMatrix4fv(gl.getUniformLocation(program.webGLProgram, 'uViewMatrix'), false, this.viewMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(program.webGLProgram, 'uProjectionMatrix'), false, this.projectionMatrix);
        gl.uniform2f(gl.getUniformLocation(program.webGLProgram, 'uResolution'), this.width, this.height);

        this.program = program;

        var d = new Date();

        var defaultUniforms = {
            resolution: { type: '2f', value: { x: this.width, y: this.height } },
            time: { type: '1f', value: 0 },
            mouse: { type: '2f', value: { x: this.width / 2, y: this.height / 2 } },
            date: { type: '4fv', value: [ d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() * 60 * 60 + d.getMinutes() * 60 + d.getSeconds() ] },
            sampleRate: { type: '1f', value: 44100.0 },
            iChannel0: { type: 'sampler2D', value: null, textureData: { repeat: true } },
            iChannel1: { type: 'sampler2D', value: null, textureData: { repeat: true } },
            iChannel2: { type: 'sampler2D', value: null, textureData: { repeat: true } },
            iChannel3: { type: 'sampler2D', value: null, textureData: { repeat: true } }
        };

        if (this.shader.uniforms)
        {
            this.uniforms = Extend(true, {}, this.shader.uniforms, defaultUniforms);
        }
        else
        {
            this.uniforms = defaultUniforms;
        }

        for (var i = 0; i < 4; i++)
        {
            if (textures[i])
            {
                this.setSampler2D('iChannel' + i, textures[i], i, textureData);
            }
        }

        this.initUniforms();

        this.projOrtho(0, this._rendererWidth, this._rendererHeight, 0);

        return this;
    },

    setPointer: function (pointer)
    {
        this.pointer = pointer;

        return this;
    },

    projOrtho: function (left, right, bottom, top)
    {
        if (this.renderer.contextLost)
        {
            this._deferProjOrtho = { left: left, right: right, bottom: bottom, top: top };
            return;
        }

        var near = -1000;
        var far = 1000;

        var leftRight = 1 / (left - right);
        var bottomTop = 1 / (bottom - top);
        var nearFar = 1 / (near - far);

        var pm = this.projectionMatrix;

        pm[0] = -2 * leftRight;
        pm[5] = -2 * bottomTop;
        pm[10] = 2 * nearFar;
        pm[12] = (left + right) * leftRight;
        pm[13] = (top + bottom) * bottomTop;
        pm[14] = (far + near) * nearFar;

        var program = this.program;

        var gl = this.gl;
        var renderer = this.renderer;

        renderer.setProgram(program);

        gl.uniformMatrix4fv(gl.getUniformLocation(program.webGLProgram, 'uProjectionMatrix'), false, this.projectionMatrix);

        this._rendererWidth = right;
        this._rendererHeight = bottom;
    },

    initUniforms: function ()
    {
        var map = this.renderer.glFuncMap;
        var program = this.program;

        this._textureCount = 0;

        for (var key in this.uniforms)
        {
            var uniform = this.uniforms[key];

            var type = uniform.type;
            var data = map[type];

            uniform.uniformLocation = this.renderer.createUniformLocation(program, key);

            if (type !== 'sampler2D')
            {
                uniform.glMatrix = data.matrix;
                uniform.glValueLength = data.length;
                uniform.glFunc = data.func;
            }
        }
    },

    setSampler2DBuffer: function (uniformKey, texture, width, height, textureIndex, textureData)
    {
        if (textureIndex === undefined) { textureIndex = 0; }
        if (textureData === undefined) { textureData = {}; }

        var uniform = this.uniforms[uniformKey];

        uniform.value = texture;

        textureData.width = width;
        textureData.height = height;

        uniform.textureData = textureData;

        this._textureCount = textureIndex;

        this.initSampler2D(uniform);

        return this;
    },

    setSampler2D: function (uniformKey, textureKey, textureIndex, textureData)
    {
        if (textureIndex === undefined) { textureIndex = 0; }

        var textureManager = this.scene.sys.textures;

        if (textureManager.exists(textureKey))
        {
            var frame = textureManager.getFrame(textureKey);

            if (frame.glTexture && frame.glTexture.isRenderTexture)
            {
                return this.setSampler2DBuffer(uniformKey, frame.glTexture, frame.width, frame.height, textureIndex, textureData);
            }

            var uniform = this.uniforms[uniformKey];
            var source = frame.source;

            uniform.textureKey = textureKey;
            uniform.source = source.image;
            uniform.value = frame.glTexture;

            if (source.isGLTexture)
            {
                if (!textureData)
                {
                    textureData = {};
                }

                textureData.width = source.width;
                textureData.height = source.height;
            }

            if (textureData)
            {
                uniform.textureData = textureData;
            }

            this._textureCount = textureIndex;

            this.initSampler2D(uniform);
        }

        return this;
    },

    setUniform: function (key, value)
    {
        SetValue(this.uniforms, key, value);

        return this;
    },

    getUniform: function (key)
    {
        return GetFastValue(this.uniforms, key, null);
    },

    setChannel0: function (textureKey, textureData)
    {
        return this.setSampler2D('iChannel0', textureKey, 0, textureData);
    },

    setChannel1: function (textureKey, textureData)
    {
        return this.setSampler2D('iChannel1', textureKey, 1, textureData);
    },

    setChannel2: function (textureKey, textureData)
    {
        return this.setSampler2D('iChannel2', textureKey, 2, textureData);
    },

    setChannel3: function (textureKey, textureData)
    {
        return this.setSampler2D('iChannel3', textureKey, 3, textureData);
    },

    initSampler2D: function (uniform)
    {
        if (!uniform.value)
        {
            return;
        }

        var data = uniform.textureData;

        if (data && !uniform.value.isRenderTexture)
        {
            var gl = this.gl;
            var wrapper = uniform.value;

            var magFilter = gl[GetFastValue(data, 'magFilter', 'linear').toUpperCase()];
            var minFilter = gl[GetFastValue(data, 'minFilter', 'linear').toUpperCase()];
            var wrapS = gl[GetFastValue(data, 'wrapS', 'repeat').toUpperCase()];
            var wrapT = gl[GetFastValue(data, 'wrapT', 'repeat').toUpperCase()];
            var format = gl[GetFastValue(data, 'format', 'rgba').toUpperCase()];
            var flipY = GetFastValue(data, 'flipY', false);
            var width = GetFastValue(data, 'width', wrapper.width);
            var height = GetFastValue(data, 'height', wrapper.height);
            var source = GetFastValue(data, 'source', wrapper.pixels);

            if (data.repeat)
            {
                wrapS = gl.REPEAT;
                wrapT = gl.REPEAT;
            }

            if (data.width)
            {

                source = null;
            }

            wrapper.update(source, width, height, flipY, wrapS, wrapT, minFilter, magFilter, format);
        }

        this.renderer.setProgram(this.program);

        this._textureCount++;
    },

    syncUniforms: function ()
    {
        var gl = this.gl;

        var uniforms = this.uniforms;
        var uniform;
        var length;
        var glFunc;
        var location;
        var value;
        var textureCount = 0;

        for (var key in uniforms)
        {
            uniform = uniforms[key];

            glFunc = uniform.glFunc;
            length = uniform.glValueLength;
            location = uniform.uniformLocation;
            value = uniform.value;

            if (value === null)
            {
                continue;
            }

            if (length === 1)
            {
                if (uniform.glMatrix)
                {
                    glFunc.call(gl, location.webGLUniformLocation, uniform.transpose, value);
                }
                else
                {
                    glFunc.call(gl, location.webGLUniformLocation, value);
                }
            }
            else if (length === 2)
            {
                glFunc.call(gl, location.webGLUniformLocation, value.x, value.y);
            }
            else if (length === 3)
            {
                glFunc.call(gl, location.webGLUniformLocation, value.x, value.y, value.z);
            }
            else if (length === 4)
            {
                glFunc.call(gl, location.webGLUniformLocation, value.x, value.y, value.z, value.w);
            }
            else if (uniform.type === 'sampler2D')
            {
                gl.activeTexture(gl.TEXTURE0 + textureCount);

                gl.bindTexture(gl.TEXTURE_2D, value.webGLTexture);

                gl.uniform1i(location.webGLUniformLocation, textureCount);

                textureCount++;
            }
        }
    },

    load: function (matrix2D)
    {

        var gl = this.gl;
        var width = this.width;
        var height = this.height;
        var renderer = this.renderer;
        var program = this.program;
        var vm = this.viewMatrix;

        if (!this.renderToTexture)
        {
            var x = -this._displayOriginX;
            var y = -this._displayOriginY;

            vm[0] = matrix2D[0];
            vm[1] = matrix2D[1];
            vm[4] = matrix2D[2];
            vm[5] = matrix2D[3];
            vm[8] = matrix2D[4];
            vm[9] = matrix2D[5];
            vm[12] = vm[0] * x + vm[4] * y;
            vm[13] = vm[1] * x + vm[5] * y;
        }

        gl.useProgram(program.webGLProgram);

        gl.uniformMatrix4fv(gl.getUniformLocation(program.webGLProgram, 'uViewMatrix'), false, vm);
        gl.uniformMatrix4fv(gl.getUniformLocation(program.webGLProgram, 'uProjectionMatrix'), false, this.projectionMatrix);
        gl.uniform2f(gl.getUniformLocation(program.webGLProgram, 'uResolution'), this.width, this.height);

        var uniforms = this.uniforms;
        var res = uniforms.resolution;

        res.value.x = width;
        res.value.y = height;

        uniforms.time.value = renderer.game.loop.getDuration();

        var pointer = this.pointer;

        if (pointer)
        {
            var mouse = uniforms.mouse;

            var px = pointer.x / width;
            var py = 1 - pointer.y / height;

            mouse.value.x = px.toFixed(2);
            mouse.value.y = py.toFixed(2);
        }

        this.syncUniforms();
    },

    flush: function ()
    {

        var width = this.width;
        var height = this.height;
        var program = this.program;

        var gl = this.gl;
        var vertexBuffer = this.vertexBuffer;
        var renderer = this.renderer;
        var vertexSize = Float32Array.BYTES_PER_ELEMENT * 2;

        if (this.renderToTexture)
        {
            renderer.setFramebuffer(this.framebuffer);

            gl.clearColor(0, 0, 0, 0);

            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.webGLBuffer);

        var location = gl.getAttribLocation(program.webGLProgram, 'inPosition');

        if (location !== -1)
        {
            gl.enableVertexAttribArray(location);

            gl.vertexAttribPointer(location, 2, gl.FLOAT, false, vertexSize, 0);
        }

        var vf = this.vertexViewF32;

        vf[3] = height;
        vf[4] = width;
        vf[5] = height;
        vf[8] = width;
        vf[9] = height;
        vf[10] = width;

        var vertexCount = 6;

        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.bytes.subarray(0, vertexCount * vertexSize));

        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

        if (this.renderToTexture)
        {
            renderer.setFramebuffer(null, false);
        }
    },

    setAlpha: function ()
    {
    },

    setBlendMode: function ()
    {
    },

    onContextRestored: function ()
    {
        if (this._deferSetShader !== null)
        {
            var key = this._deferSetShader.key;
            var textures = this._deferSetShader.textures;
            var textureData = this._deferSetShader.textureData;
            this._deferSetShader = null;
            this.setShader(key, textures, textureData);
        }

        if (this._deferProjOrtho !== null)
        {
            var left = this._deferProjOrtho.left;
            var right = this._deferProjOrtho.right;
            var bottom = this._deferProjOrtho.bottom;
            var top = this._deferProjOrtho.top;
            this._deferProjOrtho = null;
            this.projOrtho(left, right, bottom, top);
        }
    },

    preDestroy: function ()
    {
        var renderer = this.renderer;

        renderer.off(RenderEvents.RESTORE_WEBGL, this.onContextRestored, this);
        renderer.deleteProgram(this.program);
        renderer.deleteBuffer(this.vertexBuffer);

        if (this.renderToTexture)
        {
            renderer.deleteFramebuffer(this.framebuffer);

            this.texture.destroy();

            this.framebuffer = null;
            this.glTexture = null;
            this.texture = null;
        }

        ArrayEach(this.uniforms, function (uniform)
        {
            renderer.deleteUniformLocation(uniform.uniformLocation);
            uniform.uniformLocation = null;
        });
    }

});

module.exports = Shader;
