var Class = require('../../utils/Class');
var DeepCopy = require('../../utils/object/DeepCopy');
var EventEmitter = require('eventemitter3');
var Events = require('./pipelines/events');
var GetFastValue = require('../../utils/object/GetFastValue');
var Matrix4 = require('../../math/Matrix4');
var RendererEvents = require('../events');
var RenderTarget = require('./RenderTarget');
var Utils = require('./Utils');
var WebGLShader = require('./WebGLShader');

var WebGLPipeline = new Class({

    Extends: EventEmitter,

    initialize:

    function WebGLPipeline (config)
    {
        EventEmitter.call(this);

        var game = config.game;
        var renderer = game.renderer;
        var gl = renderer.gl;

        this.name = GetFastValue(config, 'name', 'WebGLPipeline');

        this.game = game;

        this.renderer = renderer;

        this.manager;

        this.gl = gl;

        this.view = game.canvas;

        this.width = 0;

        this.height = 0;

        this.vertexCount = 0;

        this.vertexCapacity = 0;

        this.vertexData;

        this.vertexBuffer;

        this.activeBuffer;

        this.topology = GetFastValue(config, 'topology', gl.TRIANGLES);

        this.bytes;

        this.vertexViewF32;

        this.vertexViewU32;

        this.active = true;

        this.forceZero = GetFastValue(config, 'forceZero', false);

        this.hasBooted = false;

        this.isPostFX = false;

        this.isPreFX = false;

        this.renderTargets = [];

        this.currentRenderTarget;

        this.shaders = [];

        this.currentShader;

        this.projectionMatrix;

        this.projectionWidth = 0;

        this.projectionHeight = 0;

        this.config = config;

        this.glReset = false;

        this.batch = [];

        this.currentBatch = null;

        this.currentTexture = null;

        this.currentUnit = 0;

        this.activeTextures = [];

        this.resizeUniform = GetFastValue(config, 'resizeUniform', '');
    },

    boot: function ()
    {
        var i;
        var gl = this.gl;
        var config = this.config;
        var renderer = this.renderer;

        if (!this.isPostFX)
        {
            this.projectionMatrix = new Matrix4().identity();
        }

        var renderTargets = this.renderTargets;

        var targets = GetFastValue(config, 'renderTarget', false);

        if (typeof(targets) === 'boolean' && targets)
        {
            targets = 1;
        }

        var width = renderer.width;
        var height = renderer.height;

        if (typeof(targets) === 'number')
        {

            for (i = 0; i < targets; i++)
            {
                renderTargets.push(new RenderTarget(renderer, width, height, 1, 0, true));
            }
        }
        else if (Array.isArray(targets))
        {
            for (i = 0; i < targets.length; i++)
            {
                var scale = GetFastValue(targets[i], 'scale', 1);
                var minFilter = GetFastValue(targets[i], 'minFilter', 0);
                var autoClear = GetFastValue(targets[i], 'autoClear', 1);
                var autoResize = GetFastValue(targets[i], 'autoResize', false);
                var targetWidth = GetFastValue(targets[i], 'width', null);
                var targetHeight = GetFastValue(targets[i], 'height', targetWidth);

                if (targetWidth)
                {
                    renderTargets.push(new RenderTarget(renderer, targetWidth, targetHeight, 1, minFilter, autoClear, autoResize));
                }
                else
                {
                    renderTargets.push(new RenderTarget(renderer, width, height, scale, minFilter, autoClear, autoResize));
                }
            }
        }

        if (renderTargets.length)
        {

            this.currentRenderTarget = renderTargets[0];
        }

        this.setShadersFromConfig(config);

        var shaders = this.shaders;
        var vertexSize = 0;

        for (i = 0; i < shaders.length; i++)
        {
            if (shaders[i].vertexSize > vertexSize)
            {
                vertexSize = shaders[i].vertexSize;
            }
        }

        var batchSize = GetFastValue(config, 'batchSize', renderer.config.batchSize);

        this.vertexCapacity = batchSize * 6;

        var data = new ArrayBuffer(this.vertexCapacity * vertexSize);

        this.vertexData = data;
        this.bytes = new Uint8Array(data);
        this.vertexViewF32 = new Float32Array(data);
        this.vertexViewU32 = new Uint32Array(data);

        var configVerts = GetFastValue(config, 'vertices', null);

        if (configVerts)
        {
            this.vertexViewF32.set(configVerts);

            this.vertexBuffer = renderer.createVertexBuffer(data, gl.STATIC_DRAW);
        }
        else
        {
            this.vertexBuffer = renderer.createVertexBuffer(data.byteLength, gl.DYNAMIC_DRAW);
        }

        this.setVertexBuffer();

        for (i = shaders.length - 1; i >= 0; i--)
        {
            shaders[i].rebind();
        }

        this.hasBooted = true;

        renderer.on(RendererEvents.RESIZE, this.resize, this);
        renderer.on(RendererEvents.PRE_RENDER, this.onPreRender, this);
        renderer.on(RendererEvents.RENDER, this.onRender, this);
        renderer.on(RendererEvents.POST_RENDER, this.onPostRender, this);

        this.emit(Events.BOOT, this);

        this.onBoot();
    },

    onBoot: function ()
    {
    },

    onResize: function ()
    {
    },

    setShader: function (shader, setAttributes, vertexBuffer)
    {
        var renderer = this.renderer;

        if (shader !== this.currentShader || renderer.currentProgram !== this.currentShader.program)
        {
            this.flush();

            var wasBound = this.setVertexBuffer(vertexBuffer);

            if (wasBound && !setAttributes)
            {
                setAttributes = true;
            }

            shader.bind(setAttributes, false);

            this.currentShader = shader;
        }

        return this;
    },

    getShaderByName: function (name)
    {
        var shaders = this.shaders;

        for (var i = 0; i < shaders.length; i++)
        {
            if (shaders[i].name === name)
            {
                return shaders[i];
            }
        }
    },

    setShadersFromConfig: function (config)
    {
        var i;
        var shaders = this.shaders;
        var renderer = this.renderer;

        for (i = 0; i < shaders.length; i++)
        {
            shaders[i].destroy();
        }

        var vName = 'vertShader';
        var fName = 'fragShader';
        var aName = 'attributes';

        var defaultVertShader = GetFastValue(config, vName, null);
        var defaultFragShader = Utils.parseFragmentShaderMaxTextures(GetFastValue(config, fName, null), renderer.maxTextures);
        var defaultAttribs = GetFastValue(config, aName, null);

        var configShaders = GetFastValue(config, 'shaders', []);

        var len = configShaders.length;

        if (len === 0)
        {
            if (defaultVertShader && defaultFragShader)
            {
                this.shaders = [ new WebGLShader(this, 'default', defaultVertShader, defaultFragShader, DeepCopy(defaultAttribs)) ];
            }
        }
        else
        {
            var newShaders = [];

            for (i = 0; i < len; i++)
            {
                var shaderEntry = configShaders[i];

                var name;
                var vertShader;
                var fragShader;
                var attributes;

                if (typeof shaderEntry === 'string')
                {
                    name = 'default';
                    vertShader = defaultVertShader;
                    fragShader = Utils.parseFragmentShaderMaxTextures(shaderEntry, renderer.maxTextures);
                    attributes = defaultAttribs;
                }
                else
                {
                    name = GetFastValue(shaderEntry, 'name', 'default');
                    vertShader = GetFastValue(shaderEntry, vName, defaultVertShader);
                    fragShader = Utils.parseFragmentShaderMaxTextures(GetFastValue(shaderEntry, fName, defaultFragShader), renderer.maxTextures);
                    attributes = GetFastValue(shaderEntry, aName, defaultAttribs);
                }

                if (name === 'default')
                {
                    var lines = fragShader.split('\n');
                    var test = lines[0].trim();

                    if (test.indexOf('#define SHADER_NAME') > -1)
                    {
                        name = test.substring(20);
                    }
                }

                if (vertShader && fragShader)
                {
                    newShaders.push(new WebGLShader(this, name, vertShader, fragShader, DeepCopy(attributes)));
                }
            }

            this.shaders = newShaders;
        }

        if (this.shaders.length === 0)
        {
            console.warn('Pipeline: ' + this.name + ' - Invalid shader config');
        }
        else
        {
            this.currentShader = this.shaders[0];
        }

        return this;
    },

    createBatch: function (texture)
    {
        this.currentBatch = {
            start: this.vertexCount,
            count: 0,
            texture: [ texture ],
            unit: 0,
            maxUnit: 0
        };

        this.currentUnit = 0;
        this.currentTexture = texture;

        this.batch.push(this.currentBatch);

        return 0;
    },

    addTextureToBatch: function (texture)
    {
        var batch = this.currentBatch;

        if (batch)
        {
            batch.texture.push(texture);
            batch.unit++;
            batch.maxUnit++;
        }
    },

    pushBatch: function (texture)
    {

        if (!this.currentBatch || (this.forceZero && texture !== this.currentTexture))
        {
            return this.createBatch(texture);
        }

        if (texture === this.currentTexture)
        {
            return this.currentUnit;
        }
        else
        {
            var current = this.currentBatch;

            var idx = current.texture.indexOf(texture);

            if (idx === -1)
            {

                if (current.texture.length === this.renderer.maxTextures)
                {
                    return this.createBatch(texture);
                }
                else
                {

                    current.unit++;
                    current.maxUnit++;
                    current.texture.push(texture);

                    this.currentUnit = current.unit;
                    this.currentTexture = texture;

                    return current.unit;
                }
            }
            else
            {
                this.currentUnit = idx;
                this.currentTexture = texture;

                return idx;
            }
        }
    },

    setGameObject: function (gameObject, frame)
    {
        if (frame === undefined) { frame = gameObject.frame; }

        return this.pushBatch(frame.source.glTexture);
    },

    shouldFlush: function (amount)
    {
        if (amount === undefined) { amount = 0; }

        return (this.vertexCount + amount > this.vertexCapacity);
    },

    vertexAvailable: function ()
    {
        return this.vertexCapacity - this.vertexCount;
    },

    resize: function (width, height)
    {
        if (width !== this.width || height !== this.height)
        {
            this.flush();
        }

        this.width = width;
        this.height = height;

        var targets = this.renderTargets;

        for (var i = 0; i < targets.length; i++)
        {
            targets[i].resize(width, height);
        }

        this.setProjectionMatrix(width, height);

        if (this.resizeUniform)
        {
            this.set2f(this.resizeUniform, width, height);
        }

        this.emit(Events.RESIZE, width, height, this);

        this.onResize(width, height);

        return this;
    },

    setProjectionMatrix: function (width, height)
    {
        var projectionMatrix = this.projectionMatrix;

        if (!projectionMatrix)
        {
            return this;
        }

        this.projectionWidth = width;
        this.projectionHeight = height;

        projectionMatrix.ortho(0, width, height, 0, -1000, 1000);

        var shaders = this.shaders;

        var name = 'uProjectionMatrix';

        for (var i = 0; i < shaders.length; i++)
        {
            var shader = shaders[i];

            if (shader.hasUniform(name))
            {
                shader.resetUniform(name);

                shader.setMatrix4fv(name, false, projectionMatrix.val, shader);
            }
        }

        return this;
    },

    flipProjectionMatrix: function (flipY)
    {
        if (flipY === undefined) { flipY = true; }

        var projectionMatrix = this.projectionMatrix;

        if (!projectionMatrix)
        {
            return this;
        }

        var width = this.projectionWidth;
        var height = this.projectionHeight;

        if (flipY)
        {
            projectionMatrix.ortho(0, width, 0, height, -1000, 1000);
        }
        else
        {
            projectionMatrix.ortho(0, width, height, 0, -1000, 1000);
        }

        this.setMatrix4fv('uProjectionMatrix', false, projectionMatrix.val);
    },

    updateProjectionMatrix: function ()
    {
        if (this.projectionMatrix)
        {
            var globalWidth = this.renderer.projectionWidth;
            var globalHeight = this.renderer.projectionHeight;

            if (this.projectionWidth !== globalWidth || this.projectionHeight !== globalHeight)
            {
                this.setProjectionMatrix(globalWidth, globalHeight);
            }
        }
    },

    bind: function (currentShader)
    {
        if (currentShader === undefined) { currentShader = this.currentShader; }

        if (this.glReset)
        {
            return this.rebind(currentShader);
        }

        var wasBound = false;

        var gl = this.gl;

        if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) !== this.vertexBuffer)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer.webGLBuffer);

            this.activeBuffer = this.vertexBuffer;

            wasBound = true;
        }

        currentShader.bind(wasBound);

        this.currentShader = currentShader;

        this.activeTextures.length = 0;

        this.emit(Events.BIND, this, currentShader);

        this.onActive(currentShader);

        return this;
    },

    rebind: function (currentShader)
    {
        this.activeBuffer = null;

        this.setVertexBuffer();

        var shaders = this.shaders;

        for (var i = shaders.length - 1; i >= 0; i--)
        {
            var shader = shaders[i].rebind();

            if (!currentShader || shader === currentShader)
            {
                this.currentShader = shader;
            }
        }

        this.activeTextures.length = 0;

        this.emit(Events.REBIND, this.currentShader);

        this.onActive(this.currentShader);

        this.onRebind();

        this.glReset = false;

        return this;
    },

    restoreContext: function ()
    {
        var shaders = this.shaders;
        var hasVertexBuffer = !!this.vertexBuffer;

        this.activeBuffer = null;
        this.activeTextures.length = 0;
        this.batch.length = 0;
        this.currentBatch = null;
        this.currentTexture = null;
        this.currentUnit = 0;

        if (hasVertexBuffer)
        {
            this.setVertexBuffer();
        }

        for (var i = 0; i < shaders.length; i++)
        {
            var shader = shaders[i];
            shader.syncUniforms();
            if (hasVertexBuffer)
            {
                shader.rebind();
            }
        }
    },

    setVertexBuffer: function (buffer)
    {
        if (buffer === undefined) { buffer = this.vertexBuffer; }

        if (buffer !== this.activeBuffer)
        {
            var gl = this.gl;

            this.gl.bindBuffer(gl.ARRAY_BUFFER, buffer.webGLBuffer);

            this.activeBuffer = buffer;

            return true;
        }

        return false;
    },

    preBatch: function (gameObject)
    {
        if (this.currentRenderTarget)
        {
            this.currentRenderTarget.bind();
        }

        this.onPreBatch(gameObject);

        return this;
    },

    postBatch: function (gameObject)
    {
        this.onDraw(this.currentRenderTarget);

        this.onPostBatch(gameObject);

        return this;
    },

    onDraw: function ()
    {
    },

    unbind: function ()
    {
        if (this.currentRenderTarget)
        {
            this.currentRenderTarget.unbind();
        }
    },

    flush: function (isPostFlush)
    {
        if (isPostFlush === undefined) { isPostFlush = false; }

        if (this.vertexCount > 0)
        {
            this.emit(Events.BEFORE_FLUSH, this, isPostFlush);

            this.onBeforeFlush(isPostFlush);

            var gl = this.gl;
            var vertexCount = this.vertexCount;
            var vertexSize = this.currentShader.vertexSize;
            var topology = this.topology;

            if (this.active)
            {
                this.setVertexBuffer();

                if (vertexCount === this.vertexCapacity)
                {
                    gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.DYNAMIC_DRAW);
                }
                else
                {
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.bytes.subarray(0, vertexCount * vertexSize));
                }

                var i;
                var entry;
                var texture;
                var batch = this.batch;
                var activeTextures = this.activeTextures;

                if (this.forceZero)
                {

                    if (!activeTextures[0])
                    {
                        gl.activeTexture(gl.TEXTURE0);
                    }

                    for (i = 0; i < batch.length; i++)
                    {
                        entry = batch[i];
                        texture = entry.texture[0];

                        if (activeTextures[0] !== texture)
                        {
                            gl.bindTexture(gl.TEXTURE_2D, texture.webGLTexture);

                            activeTextures[0] = texture;
                        }

                        gl.drawArrays(topology, entry.start, entry.count);
                    }
                }
                else
                {
                    for (i = 0; i < batch.length; i++)
                    {
                        entry = batch[i];

                        for (var t = 0; t <= entry.maxUnit; t++)
                        {
                            texture = entry.texture[t];

                            if (activeTextures[t] !== texture)
                            {
                                gl.activeTexture(gl.TEXTURE0 + t);
                                gl.bindTexture(gl.TEXTURE_2D, texture.webGLTexture);

                                activeTextures[t] = texture;
                            }
                        }

                        gl.drawArrays(topology, entry.start, entry.count);
                    }
                }
            }

            this.vertexCount = 0;

            this.batch.length = 0;
            this.currentBatch = null;
            this.currentTexture = null;
            this.currentUnit = 0;

            this.emit(Events.AFTER_FLUSH, this, isPostFlush);

            this.onAfterFlush(isPostFlush);
        }

        return this;
    },

    onActive: function ()
    {
    },

    onBind: function ()
    {
    },

    onRebind: function ()
    {
    },

    onBatch: function ()
    {
    },

    onPreBatch: function ()
    {
    },

    onPostBatch: function ()
    {
    },

    onPreRender: function ()
    {
    },

    onRender: function ()
    {
    },

    onPostRender: function ()
    {
    },

    onBeforeFlush: function ()
    {
    },

    onAfterFlush: function ()
    {
    },

    batchVert: function (x, y, u, v, unit, tintEffect, tint)
    {
        var vertexViewF32 = this.vertexViewF32;
        var vertexViewU32 = this.vertexViewU32;

        var vertexOffset = (this.vertexCount * this.currentShader.vertexComponentCount) - 1;

        vertexViewF32[++vertexOffset] = x;
        vertexViewF32[++vertexOffset] = y;
        vertexViewF32[++vertexOffset] = u;
        vertexViewF32[++vertexOffset] = v;
        vertexViewF32[++vertexOffset] = unit;
        vertexViewF32[++vertexOffset] = tintEffect;
        vertexViewU32[++vertexOffset] = tint;

        this.vertexCount++;

        this.currentBatch.count = (this.vertexCount - this.currentBatch.start);
    },

    batchQuad: function (gameObject, x0, y0, x1, y1, x2, y2, x3, y3, u0, v0, u1, v1, tintTL, tintTR, tintBL, tintBR, tintEffect, texture, unit)
    {
        if (unit === undefined) { unit = this.currentUnit; }

        var hasFlushed = false;

        if (this.shouldFlush(6))
        {
            this.flush();

            hasFlushed = true;
        }

        if (!this.currentBatch)
        {
            unit = this.setTexture2D(texture);
        }

        var vertexViewF32 = this.vertexViewF32;
        var vertexViewU32 = this.vertexViewU32;

        var vertexOffset = (this.vertexCount * this.currentShader.vertexComponentCount) - 1;

        vertexViewF32[++vertexOffset] = x0;
        vertexViewF32[++vertexOffset] = y0;
        vertexViewF32[++vertexOffset] = u0;
        vertexViewF32[++vertexOffset] = v0;
        vertexViewF32[++vertexOffset] = unit;
        vertexViewF32[++vertexOffset] = tintEffect;
        vertexViewU32[++vertexOffset] = tintTL;

        vertexViewF32[++vertexOffset] = x1;
        vertexViewF32[++vertexOffset] = y1;
        vertexViewF32[++vertexOffset] = u0;
        vertexViewF32[++vertexOffset] = v1;
        vertexViewF32[++vertexOffset] = unit;
        vertexViewF32[++vertexOffset] = tintEffect;
        vertexViewU32[++vertexOffset] = tintBL;

        vertexViewF32[++vertexOffset] = x2;
        vertexViewF32[++vertexOffset] = y2;
        vertexViewF32[++vertexOffset] = u1;
        vertexViewF32[++vertexOffset] = v1;
        vertexViewF32[++vertexOffset] = unit;
        vertexViewF32[++vertexOffset] = tintEffect;
        vertexViewU32[++vertexOffset] = tintBR;

        vertexViewF32[++vertexOffset] = x0;
        vertexViewF32[++vertexOffset] = y0;
        vertexViewF32[++vertexOffset] = u0;
        vertexViewF32[++vertexOffset] = v0;
        vertexViewF32[++vertexOffset] = unit;
        vertexViewF32[++vertexOffset] = tintEffect;
        vertexViewU32[++vertexOffset] = tintTL;

        vertexViewF32[++vertexOffset] = x2;
        vertexViewF32[++vertexOffset] = y2;
        vertexViewF32[++vertexOffset] = u1;
        vertexViewF32[++vertexOffset] = v1;
        vertexViewF32[++vertexOffset] = unit;
        vertexViewF32[++vertexOffset] = tintEffect;
        vertexViewU32[++vertexOffset] = tintBR;

        vertexViewF32[++vertexOffset] = x3;
        vertexViewF32[++vertexOffset] = y3;
        vertexViewF32[++vertexOffset] = u1;
        vertexViewF32[++vertexOffset] = v0;
        vertexViewF32[++vertexOffset] = unit;
        vertexViewF32[++vertexOffset] = tintEffect;
        vertexViewU32[++vertexOffset] = tintTR;

        this.vertexCount += 6;

        this.currentBatch.count = (this.vertexCount - this.currentBatch.start);

        this.onBatch(gameObject);

        return hasFlushed;
    },

    batchTri: function (gameObject, x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, tintTL, tintTR, tintBL, tintEffect, texture, unit)
    {
        if (unit === undefined) { unit = this.currentUnit; }

        var hasFlushed = false;

        if (this.shouldFlush(3))
        {
            this.flush();

            hasFlushed = true;
        }

        if (!this.currentBatch)
        {
            unit = this.setTexture2D(texture);
        }

        var vertexViewF32 = this.vertexViewF32;
        var vertexViewU32 = this.vertexViewU32;

        var vertexOffset = (this.vertexCount * this.currentShader.vertexComponentCount) - 1;

        vertexViewF32[++vertexOffset] = x0;
        vertexViewF32[++vertexOffset] = y0;
        vertexViewF32[++vertexOffset] = u0;
        vertexViewF32[++vertexOffset] = v0;
        vertexViewF32[++vertexOffset] = unit;
        vertexViewF32[++vertexOffset] = tintEffect;
        vertexViewU32[++vertexOffset] = tintTL;

        vertexViewF32[++vertexOffset] = x1;
        vertexViewF32[++vertexOffset] = y1;
        vertexViewF32[++vertexOffset] = u0;
        vertexViewF32[++vertexOffset] = v1;
        vertexViewF32[++vertexOffset] = unit;
        vertexViewF32[++vertexOffset] = tintEffect;
        vertexViewU32[++vertexOffset] = tintTR;

        vertexViewF32[++vertexOffset] = x2;
        vertexViewF32[++vertexOffset] = y2;
        vertexViewF32[++vertexOffset] = u1;
        vertexViewF32[++vertexOffset] = v1;
        vertexViewF32[++vertexOffset] = unit;
        vertexViewF32[++vertexOffset] = tintEffect;
        vertexViewU32[++vertexOffset] = tintBL;

        this.vertexCount += 3;

        this.currentBatch.count = (this.vertexCount - this.currentBatch.start);

        this.onBatch(gameObject);

        return hasFlushed;
    },

    drawFillRect: function (x, y, width, height, color, alpha, texture, flipUV)
    {
        if (texture === undefined) { texture = this.renderer.whiteTexture; }
        if (flipUV === undefined) { flipUV = true; }

        x = Math.floor(x);
        y = Math.floor(y);

        var xw = Math.floor(x + width);
        var yh = Math.floor(y + height);

        var unit = this.setTexture2D(texture);

        var tint = Utils.getTintAppendFloatAlphaAndSwap(color, alpha);

        var u0 = 0;
        var v0 = 0;
        var u1 = 1;
        var v1 = 1;

        if (flipUV)
        {
            v0 = 1;
            v1 = 0;
        }

        this.batchQuad(null, x, y, x, yh, xw, yh, xw, y, u0, v0, u1, v1, tint, tint, tint, tint, 0, texture, unit);
    },

    setTexture2D: function (texture)
    {
        if (texture === undefined) { texture = this.renderer.whiteTexture; }

        return this.pushBatch(texture);
    },

    bindTexture: function (texture, unit)
    {
        if (unit === undefined) { unit = 0; }

        var gl = this.gl;

        gl.activeTexture(gl.TEXTURE0 + unit);

        gl.bindTexture(gl.TEXTURE_2D, texture.webGLTexture);

        return this;
    },

    bindRenderTarget: function (target, unit)
    {
        return this.bindTexture(target.texture, unit);
    },

    setTime: function (name, shader)
    {
        this.set1f(name, this.game.loop.getDuration(), shader);

        return this;
    },

    setBoolean: function (name, value, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.setBoolean(name, value);

        return this;
    },

    set1f: function (name, x, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.set1f(name, x);

        return this;
    },

    set2f: function (name, x, y, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.set2f(name, x, y);

        return this;
    },

    set3f: function (name, x, y, z, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.set3f(name, x, y, z);

        return this;
    },

    set4f: function (name, x, y, z, w, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.set4f(name, x, y, z, w);

        return this;
    },

    set1fv: function (name, arr, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.set1fv(name, arr);

        return this;
    },

    set2fv: function (name, arr, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.set2fv(name, arr);

        return this;
    },

    set3fv: function (name, arr, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.set3fv(name, arr);

        return this;
    },

    set4fv: function (name, arr, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.set4fv(name, arr);

        return this;
    },

    set1iv: function (name, arr, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.set1iv(name, arr);

        return this;
    },

    set2iv: function (name, arr, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.set2iv(name, arr);

        return this;
    },

    set3iv: function (name, arr, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.set3iv(name, arr);

        return this;
    },

    set4iv: function (name, arr, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.set4iv(name, arr);

        return this;
    },

    set1i: function (name, x, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.set1i(name, x);

        return this;
    },

    set2i: function (name, x, y, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.set2i(name, x, y);

        return this;
    },

    set3i: function (name, x, y, z, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.set3i(name, x, y, z);

        return this;
    },

    set4i: function (name, x, y, z, w, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.set4i(name, x, y, z, w);

        return this;
    },

    setMatrix2fv: function (name, transpose, matrix, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.setMatrix2fv(name, transpose, matrix);

        return this;
    },

    setMatrix3fv: function (name, transpose, matrix, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.setMatrix3fv(name, transpose, matrix);

        return this;
    },

    setMatrix4fv: function (name, transpose, matrix, shader)
    {
        if (shader === undefined) { shader = this.currentShader; }

        shader.setMatrix4fv(name, transpose, matrix);

        return this;
    },

    destroy: function ()
    {
        this.emit(Events.DESTROY, this);

        var i;

        var shaders = this.shaders;

        for (i = 0; i < shaders.length; i++)
        {
            shaders[i].destroy();
        }

        var targets = this.renderTargets;

        for (i = 0; i < targets.length; i++)
        {
            targets[i].destroy();
        }

        var renderer = this.renderer;

        renderer.deleteBuffer(this.vertexBuffer);

        renderer.off(RendererEvents.RESIZE, this.resize, this);
        renderer.off(RendererEvents.PRE_RENDER, this.onPreRender, this);
        renderer.off(RendererEvents.RENDER, this.onRender, this);
        renderer.off(RendererEvents.POST_RENDER, this.onPostRender, this);

        this.removeAllListeners();

        this.game = null;
        this.renderer = null;
        this.manager = null;
        this.gl = null;
        this.view = null;
        this.shaders = null;
        this.renderTargets = null;
        this.bytes = null;
        this.vertexViewF32 = null;
        this.vertexViewU32 = null;
        this.vertexData = null;
        this.vertexBuffer = null;
        this.currentShader = null;
        this.currentRenderTarget = null;
        this.activeTextures = null;

        return this;
    }

});

module.exports = WebGLPipeline;
