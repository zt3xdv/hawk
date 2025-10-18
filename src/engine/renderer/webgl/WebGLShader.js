var Class = require('../../utils/Class');
var ArrayEach = require('../../utils/array/Each');
var GetFastValue = require('../../utils/object/GetFastValue');
var WEBGL_CONST = require('./const');

var WebGLShader = new Class({

    initialize:

    function WebGLShader (pipeline, name, vertexShader, fragmentShader, attributes)
    {

        this.pipeline = pipeline;

        this.name = name;

        this.renderer = pipeline.renderer;

        this.gl = this.renderer.gl;

        this.fragSrc = fragmentShader;

        this.vertSrc = vertexShader;

        this.program = this.renderer.createProgram(vertexShader, fragmentShader);

        this.attributes;

        this.vertexComponentCount = 0;

        this.vertexSize = 0;

        this.uniforms = {};

        this.createAttributes(attributes);
        this.createUniforms();
    },

    createAttributes: function (attributes)
    {
        var count = 0;
        var offset = 0;
        var result = [];

        this.vertexComponentCount = 0;

        for (var i = 0; i < attributes.length; i++)
        {
            var element = attributes[i];

            var name = element.name;
            var size = GetFastValue(element, 'size', 1); 
            var glType = GetFastValue(element, 'type', WEBGL_CONST.FLOAT);
            var type = glType.enum; 
            var typeSize = glType.size; 

            var normalized = (element.normalized) ? true : false;

            result.push({
                name: name,
                size: size,
                type: type,
                normalized: normalized,
                offset: offset,
                enabled: false,
                location: -1
            });

            if (typeSize === 4)
            {
                count += size;
            }
            else
            {
                count++;
            }

            offset += size * typeSize;
        }

        this.vertexSize = offset;
        this.vertexComponentCount = count;
        this.attributes = result;
    },

    bind: function (setAttributes, flush)
    {
        if (setAttributes === undefined) { setAttributes = false; }
        if (flush === undefined) { flush = false; }

        if (flush)
        {
            this.pipeline.flush();
        }

        this.renderer.setProgram(this.program);

        if (setAttributes)
        {
            this.setAttribPointers();
        }

        return this;
    },

    rebind: function ()
    {
        this.renderer.setProgram(this.program);

        this.setAttribPointers(true);

        return this;
    },

    setAttribPointers: function (reset)
    {
        if (reset === undefined) { reset = false; }

        var gl = this.gl;
        var renderer = this.renderer;
        var vertexSize = this.vertexSize;
        var attributes = this.attributes;
        var program = this.program;

        for (var i = 0; i < attributes.length; i++)
        {
            var element = attributes[i];

            var size = element.size;
            var type = element.type;
            var offset = element.offset;
            var enabled = element.enabled;
            var location = element.location;
            var normalized = (element.normalized) ? true : false;

            if (reset)
            {
                if (location !== -1)
                {
                    renderer.deleteAttribLocation(location);
                }
                var attribLocation = this.renderer.createAttribLocation(program, element.name);

                if (attribLocation.webGLAttribLocation >= 0)
                {
                    gl.enableVertexAttribArray(attribLocation.webGLAttribLocation);

                    gl.vertexAttribPointer(attribLocation.webGLAttribLocation, size, type, normalized, vertexSize, offset);

                    element.enabled = true;
                    element.location = attribLocation;
                }
                else if (attribLocation.webGLAttribLocation !== -1)
                {
                    gl.disableVertexAttribArray(attribLocation.webGLAttribLocation);
                }
            }
            else if (enabled)
            {
                gl.vertexAttribPointer(location.webGLAttribLocation, size, type, normalized, vertexSize, offset);
            }
            else if (!enabled && location !== -1 && location.webGLAttribLocation > -1)
            {
                gl.disableVertexAttribArray(location.webGLAttribLocation);

                element.location = -1;
            }
        }

        return this;
    },

    createUniforms: function ()
    {
        var gl = this.gl;
        var program = this.program;
        var uniforms = this.uniforms;

        var i;
        var name;
        var location;

        var totalUniforms = gl.getProgramParameter(program.webGLProgram, gl.ACTIVE_UNIFORMS);

        for (i = 0; i < totalUniforms; i++)
        {
            var info = gl.getActiveUniform(program.webGLProgram, i);

            if (info)
            {
                name = info.name;

                location = this.renderer.createUniformLocation(program, name);

                if (location !== null)
                {
                    uniforms[name] =
                    {
                        name: name,
                        location: location,
                        setter: null,
                        value1: null,
                        value2: null,
                        value3: null,
                        value4: null
                    };
                }

                var struct = name.indexOf('[');

                if (struct > 0)
                {
                    name = name.substr(0, struct);

                    if (!uniforms.hasOwnProperty(name))
                    {
                        location = this.renderer.createUniformLocation(program, name);

                        if (location !== null)
                        {
                            uniforms[name] =
                            {
                                name: name,
                                location: location,
                                setter: null,
                                value1: null,
                                value2: null,
                                value3: null,
                                value4: null
                            };
                        }
                    }
                }
            }
        }

        return this;
    },

    syncUniforms: function ()
    {
        var gl = this.gl;
        this.renderer.setProgram(this.program);
        for (var name in this.uniforms)
        {
            var uniform = this.uniforms[name];

            if (uniform.setter)
            {
                uniform.setter.call(gl, uniform.location.webGLUniformLocation, uniform.value1, uniform.value2, uniform.value3, uniform.value4);
            }
        }
    },

    hasUniform: function (name)
    {
        return this.uniforms.hasOwnProperty(name);
    },

    resetUniform: function (name)
    {
        var uniform = this.uniforms[name];

        if (uniform)
        {
            uniform.value1 = null;
            uniform.value2 = null;
            uniform.value3 = null;
            uniform.value4 = null;
        }

        return this;
    },

    setUniform1: function (setter, name, value1, skipCheck)
    {
        var uniform = this.uniforms[name];

        if (!uniform)
        {
            return this;
        }

        if (skipCheck || uniform.value1 !== value1)
        {
            if (!uniform.setter)
            {
                uniform.setter = setter;
            }

            uniform.value1 = value1;

            this.renderer.setProgram(this.program);

            setter.call(this.gl, uniform.location.webGLUniformLocation, value1);

            this.pipeline.currentShader = this;
        }

        return this;
    },

    setUniform2: function (setter, name, value1, value2, skipCheck)
    {
        var uniform = this.uniforms[name];

        if (!uniform)
        {
            return this;
        }

        if (skipCheck || uniform.value1 !== value1 || uniform.value2 !== value2)
        {
            if (!uniform.setter)
            {
                uniform.setter = setter;
            }

            uniform.value1 = value1;
            uniform.value2 = value2;

            this.renderer.setProgram(this.program);

            setter.call(this.gl, uniform.location.webGLUniformLocation, value1, value2);

            this.pipeline.currentShader = this;
        }

        return this;
    },

    setUniform3: function (setter, name, value1, value2, value3, skipCheck)
    {
        var uniform = this.uniforms[name];

        if (!uniform)
        {
            return this;
        }

        if (skipCheck || uniform.value1 !== value1 || uniform.value2 !== value2 || uniform.value3 !== value3)
        {
            if (!uniform.setter)
            {
                uniform.setter = setter;
            }

            uniform.value1 = value1;
            uniform.value2 = value2;
            uniform.value3 = value3;

            this.renderer.setProgram(this.program);

            setter.call(this.gl, uniform.location.webGLUniformLocation, value1, value2, value3);

            this.pipeline.currentShader = this;
        }

        return this;
    },

    setUniform4: function (setter, name, value1, value2, value3, value4, skipCheck)
    {
        var uniform = this.uniforms[name];

        if (!uniform)
        {
            return this;
        }

        if (skipCheck || uniform.value1 !== value1 || uniform.value2 !== value2 || uniform.value3 !== value3 || uniform.value4 !== value4)
        {
            if (!uniform.setter)
            {
                uniform.setter = setter;
            }

            uniform.value1 = value1;
            uniform.value2 = value2;
            uniform.value3 = value3;
            uniform.value4 = value4;

            this.renderer.setProgram(this.program);

            setter.call(this.gl, uniform.location.webGLUniformLocation, value1, value2, value3, value4);

            this.pipeline.currentShader = this;
        }

        return this;
    },

    setBoolean: function (name, value)
    {
        return this.setUniform1(this.gl.uniform1i, name, Number(value));
    },

    set1f: function (name, x)
    {
        return this.setUniform1(this.gl.uniform1f, name, x);
    },

    set2f: function (name, x, y)
    {
        return this.setUniform2(this.gl.uniform2f, name, x, y);
    },

    set3f: function (name, x, y, z)
    {
        return this.setUniform3(this.gl.uniform3f, name, x, y, z);
    },

    set4f: function (name, x, y, z, w)
    {
        return this.setUniform4(this.gl.uniform4f, name, x, y, z, w);
    },

    set1fv: function (name, arr)
    {
        return this.setUniform1(this.gl.uniform1fv, name, arr, true);
    },

    set2fv: function (name, arr)
    {
        return this.setUniform1(this.gl.uniform2fv, name, arr, true);
    },

    set3fv: function (name, arr)
    {
        return this.setUniform1(this.gl.uniform3fv, name, arr, true);
    },

    set4fv: function (name, arr)
    {
        return this.setUniform1(this.gl.uniform4fv, name, arr, true);
    },

    set1iv: function (name, arr)
    {
        return this.setUniform1(this.gl.uniform1iv, name, arr, true);
    },

    set2iv: function (name, arr)
    {
        return this.setUniform1(this.gl.uniform2iv, name, arr, true);
    },

    set3iv: function (name, arr)
    {
        return this.setUniform1(this.gl.uniform3iv, name, arr, true);
    },

    set4iv: function (name, arr)
    {
        return this.setUniform1(this.gl.uniform4iv, name, arr, true);
    },

    set1i: function (name, x)
    {
        return this.setUniform1(this.gl.uniform1i, name, x);
    },

    set2i: function (name, x, y)
    {
        return this.setUniform2(this.gl.uniform2i, name, x, y);
    },

    set3i: function (name, x, y, z)
    {
        return this.setUniform3(this.gl.uniform3i, name, x, y, z);
    },

    set4i: function (name, x, y, z, w)
    {
        return this.setUniform4(this.gl.uniform4i, name, x, y, z, w);
    },

    setMatrix2fv: function (name, transpose, matrix)
    {
        return this.setUniform2(this.gl.uniformMatrix2fv, name, transpose, matrix, true);
    },

    setMatrix3fv: function (name, transpose, matrix)
    {
        return this.setUniform2(this.gl.uniformMatrix3fv, name, transpose, matrix, true);
    },

    setMatrix4fv: function (name, transpose, matrix)
    {
        return this.setUniform2(this.gl.uniformMatrix4fv, name, transpose, matrix, true);
    },

    createProgram: function (vertSrc, fragSrc)
    {
        if (vertSrc === undefined) { vertSrc = this.vertSrc; }
        if (fragSrc === undefined) { fragSrc = this.fragSrc; }

        if (this.program)
        {
            this.renderer.deleteProgram(this.program);
        }

        this.vertSrc = vertSrc;
        this.fragSrc = fragSrc;

        this.program = this.renderer.createProgram(vertSrc, fragSrc);

        this.createUniforms();

        return this.rebind();
    },

    destroy: function ()
    {
        var renderer = this.renderer;
        ArrayEach(this.uniforms, function (uniform)
        {
            renderer.deleteUniformLocation(uniform.location);
        });
        this.uniforms = null;

        ArrayEach(this.attributes, function (attrib)
        {
            renderer.deleteAttribLocation(attrib.location);
        });
        this.attributes = null;

        renderer.deleteProgram(this.program);

        this.pipeline = null;
        this.renderer = null;
        this.gl = null;
        this.program = null;
    }

});

module.exports = WebGLShader;
