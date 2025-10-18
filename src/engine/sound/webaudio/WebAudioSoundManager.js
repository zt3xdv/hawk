var Base64ToArrayBuffer = require('../../utils/base64/Base64ToArrayBuffer');
var BaseSoundManager = require('../BaseSoundManager');
var Class = require('../../utils/Class');
var Events = require('../events');
var GameEvents = require('../../core/events');
var WebAudioSound = require('./WebAudioSound');
var GetFastValue = require('../../utils/object/GetFastValue');

var WebAudioSoundManager = new Class({

    Extends: BaseSoundManager,

    initialize:

    function WebAudioSoundManager (game)
    {

        this.context = this.createAudioContext(game);

        this.masterMuteNode = this.context.createGain();

        this.masterVolumeNode = this.context.createGain();

        this.masterMuteNode.connect(this.masterVolumeNode);

        this.masterVolumeNode.connect(this.context.destination);

        this.destination = this.masterMuteNode;

        this.locked = this.context.state === 'suspended';

        BaseSoundManager.call(this, game);

        if (this.locked)
        {
            if (game.isBooted)
            {
                this.unlock();
            }
            else
            {
                game.events.once(GameEvents.BOOT, this.unlock, this);
            }
        }

        game.events.on(GameEvents.VISIBLE, this.onGameVisible, this);
    },

    onGameVisible: function ()
    {
        var context = this.context;

        window.setTimeout(function ()
        {

            if (context)
            {
                context.suspend();
                context.resume();
            }

        }, 100);
    },

    createAudioContext: function (game)
    {
        var audioConfig = game.config.audio;

        if (audioConfig.context)
        {
            audioConfig.context.resume();

            return audioConfig.context;
        }

        if (window.hasOwnProperty('AudioContext'))
        {
            return new AudioContext();
        }
        else if (window.hasOwnProperty('webkitAudioContext'))
        {
            return new window.webkitAudioContext();
        }
    },

    setAudioContext: function (context)
    {
        if (this.context)
        {
            this.context.close();
        }

        if (this.masterMuteNode)
        {
            this.masterMuteNode.disconnect();
        }

        if (this.masterVolumeNode)
        {
            this.masterVolumeNode.disconnect();
        }

        this.context = context;

        this.masterMuteNode = context.createGain();
        this.masterVolumeNode = context.createGain();

        this.masterMuteNode.connect(this.masterVolumeNode);
        this.masterVolumeNode.connect(context.destination);

        this.destination = this.masterMuteNode;

        return this;
    },

    add: function (key, config)
    {
        var sound = new WebAudioSound(this, key, config);

        this.sounds.push(sound);

        return sound;
    },

    decodeAudio: function (audioKey, audioData)
    {
        var audioFiles;

        if (!Array.isArray(audioKey))
        {
            audioFiles = [ { key: audioKey, data: audioData } ];
        }
        else
        {
            audioFiles = audioKey;
        }

        var cache = this.game.cache.audio;
        var remaining = audioFiles.length;

        for (var i = 0; i < audioFiles.length; i++)
        {
            var entry = audioFiles[i];

            var key = entry.key;
            var data = entry.data;

            if (typeof data === 'string')
            {
                data = Base64ToArrayBuffer(data);
            }

            var success = function (key, audioBuffer)
            {
                cache.add(key, audioBuffer);

                this.emit(Events.DECODED, key);

                remaining--;

                if (remaining === 0)
                {
                    this.emit(Events.DECODED_ALL);
                }
            }.bind(this, key);

            var failure = function (key, error)
            {

                console.error('Error decoding audio: ' + key + ' - ', error ? error.message : '');

                remaining--;

                if (remaining === 0)
                {
                    this.emit(Events.DECODED_ALL);
                }
            }.bind(this, key);

            this.context.decodeAudioData(data, success, failure);
        }
    },

    setListenerPosition: function (x, y)
    {
        if (x === undefined) { x = this.game.scale.width / 2; }
        if (y === undefined) { y = this.game.scale.height / 2; }

        this.listenerPosition.set(x, y);

        return this;
    },

    unlock: function ()
    {
        var _this = this;

        var body = document.body;

        var unlockHandler = function unlockHandler ()
        {
            if (_this.context && body)
            {
                var bodyRemove = body.removeEventListener.bind(body);

                _this.context.resume().then(function ()
                {
                    bodyRemove('touchstart', unlockHandler);
                    bodyRemove('touchend', unlockHandler);
                    bodyRemove('mousedown', unlockHandler);
                    bodyRemove('mouseup', unlockHandler);
                    bodyRemove('keydown', unlockHandler);

                    _this.unlocked = true;

                }, function ()
                {
                    bodyRemove('touchstart', unlockHandler);
                    bodyRemove('touchend', unlockHandler);
                    bodyRemove('mousedown', unlockHandler);
                    bodyRemove('mouseup', unlockHandler);
                    bodyRemove('keydown', unlockHandler);
                });
            }
        };

        if (body)
        {
            body.addEventListener('touchstart', unlockHandler, false);
            body.addEventListener('touchend', unlockHandler, false);
            body.addEventListener('mousedown', unlockHandler, false);
            body.addEventListener('mouseup', unlockHandler, false);
            body.addEventListener('keydown', unlockHandler, false);
        }
    },

    onBlur: function ()
    {
        if (!this.locked)
        {
            this.context.suspend();
        }
    },

    onFocus: function ()
    {
        var context = this.context;

        if (context && !this.locked && (context.state === 'suspended' || context.state === 'interrupted'))
        {
            context.resume();
        }
    },

    update: function (time, delta)
    {
        var listener = this.context.listener;

        var x = GetFastValue(this.listenerPosition, 'x', null);
        var y = GetFastValue(this.listenerPosition, 'y', null);

        if (listener && listener.positionX !== undefined)
        {
            if (x && x !== this._spatialx)
            {
                this._spatialx = listener.positionX.value = x;
            }
            if (y && y !== this._spatialy)
            {
                this._spatialy = listener.positionY.value = y;
            }
        }

        else if (listener)
        {
            if (x && x !== this._spatialx)
            {
                this._spatialx = x;
            }
            if (y && y !== this._spatialy)
            {
                this._spatialy = y;
            }

            var z = GetFastValue(listener, 'z', 0);

            listener.setPosition(this._spatialx || 0, this._spatialy || 0, z);
        }

        BaseSoundManager.prototype.update.call(this, time, delta);

        if (!this.gameLostFocus)
        {
            this.onFocus();
        }
    },

    destroy: function ()
    {
        this.destination = null;
        this.masterVolumeNode.disconnect();
        this.masterVolumeNode = null;
        this.masterMuteNode.disconnect();
        this.masterMuteNode = null;

        if (this.game.config.audio.context)
        {
            this.context.suspend();
        }
        else
        {
            var _this = this;

            this.context.close().then(function ()
            {
                _this.context = null;
            });
        }

        this.game.events.off(GameEvents.VISIBLE, this.onGameVisible, this);

        BaseSoundManager.prototype.destroy.call(this);
    },

    setMute: function (value)
    {
        this.mute = value;

        return this;
    },

    mute: {

        get: function ()
        {
            return (this.masterMuteNode.gain.value === 0);
        },

        set: function (value)
        {
            this.masterMuteNode.gain.setValueAtTime(value ? 0 : 1, 0);

            this.emit(Events.GLOBAL_MUTE, this, value);
        }

    },

    setVolume: function (value)
    {
        this.volume = value;

        return this;
    },

    volume: {

        get: function ()
        {
            return this.masterVolumeNode.gain.value;
        },

        set: function (value)
        {
            this.masterVolumeNode.gain.setValueAtTime(value, 0);

            this.emit(Events.GLOBAL_VOLUME, this, value);
        }

    }

});

module.exports = WebAudioSoundManager;
