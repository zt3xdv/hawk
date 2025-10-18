var BaseSound = require('../BaseSound');
var Class = require('../../utils/Class');
var Events = require('../events');
var Clamp = require('../../math/Clamp');

var HTML5AudioSound = new Class({

    Extends: BaseSound,

    initialize:

    function HTML5AudioSound (manager, key, config)
    {
        if (config === undefined) { config = {}; }

        this.tags = manager.game.cache.audio.get(key);

        if (!this.tags)
        {
            throw new Error('No cached audio asset with key "' + key);
        }

        this.audio = null;

        this.startTime = 0;

        this.previousTime = 0;

        this.duration = this.tags[0].duration;

        this.totalDuration = this.tags[0].duration;

        BaseSound.call(this, manager, key, config);
    },

    play: function (markerName, config)
    {
        if (this.manager.isLocked(this, 'play', [ markerName, config ]))
        {
            return false;
        }

        if (!BaseSound.prototype.play.call(this, markerName, config))
        {
            return false;
        }

        if (!this.pickAndPlayAudioTag())
        {
            return false;
        }

        this.emit(Events.PLAY, this);

        return true;
    },

    pause: function ()
    {
        if (this.manager.isLocked(this, 'pause'))
        {
            return false;
        }

        if (this.startTime > 0)
        {
            return false;
        }

        if (!BaseSound.prototype.pause.call(this))
        {
            return false;
        }

        this.currentConfig.seek = this.audio.currentTime - (this.currentMarker ? this.currentMarker.start : 0);

        this.stopAndReleaseAudioTag();

        this.emit(Events.PAUSE, this);

        return true;
    },

    resume: function ()
    {
        if (this.manager.isLocked(this, 'resume'))
        {
            return false;
        }

        if (this.startTime > 0)
        {
            return false;
        }

        if (!BaseSound.prototype.resume.call(this))
        {
            return false;
        }

        if (!this.pickAndPlayAudioTag())
        {
            return false;
        }

        this.emit(Events.RESUME, this);

        return true;
    },

    stop: function ()
    {
        if (this.manager.isLocked(this, 'stop'))
        {
            return false;
        }

        if (!BaseSound.prototype.stop.call(this))
        {
            return false;
        }

        this.stopAndReleaseAudioTag();

        this.emit(Events.STOP, this);

        return true;
    },

    pickAndPlayAudioTag: function ()
    {
        if (!this.pickAudioTag())
        {
            this.reset();

            return false;
        }

        var seek = this.currentConfig.seek;
        var delay = this.currentConfig.delay;
        var offset = (this.currentMarker ? this.currentMarker.start : 0) + seek;

        this.previousTime = offset;
        this.audio.currentTime = offset;
        this.applyConfig();

        if (delay === 0)
        {
            this.startTime = 0;

            if (this.audio.paused)
            {
                this.playCatchPromise();
            }
        }
        else
        {
            this.startTime = window.performance.now() + delay * 1000;

            if (!this.audio.paused)
            {
                this.audio.pause();
            }
        }

        this.resetConfig();

        return true;
    },

    pickAudioTag: function ()
    {
        if (this.audio)
        {
            return true;
        }

        for (var i = 0; i < this.tags.length; i++)
        {
            var audio = this.tags[i];

            if (audio.dataset.used === 'false')
            {
                audio.dataset.used = 'true';
                this.audio = audio;
                return true;
            }
        }

        if (!this.manager.override)
        {
            return false;
        }

        var otherSounds = [];

        this.manager.forEachActiveSound(function (sound)
        {
            if (sound.key === this.key && sound.audio)
            {
                otherSounds.push(sound);
            }
        }, this);

        otherSounds.sort(function (a1, a2)
        {
            if (a1.loop === a2.loop)
            {

                return (a2.seek / a2.duration) - (a1.seek / a1.duration);
            }
            return a1.loop ? 1 : -1;
        });

        var selectedSound = otherSounds[0];

        this.audio = selectedSound.audio;

        selectedSound.reset();
        selectedSound.audio = null;
        selectedSound.startTime = 0;
        selectedSound.previousTime = 0;

        return true;
    },

    playCatchPromise: function ()
    {
        var playPromise = this.audio.play();

        if (playPromise)
        {

            playPromise.catch(function (reason)
            {
                console.warn(reason);
            });
        }
    },

    stopAndReleaseAudioTag: function ()
    {
        this.startTime = 0;
        this.previousTime = 0;

        if (this.audio)
        {
            this.audio.pause();
            this.audio.dataset.used = 'false';
            this.audio = null;
        }
    },

    reset: function ()
    {
        BaseSound.prototype.stop.call(this);
    },

    onBlur: function ()
    {
        this.isPlaying = false;
        this.isPaused = true;

        this.currentConfig.seek = this.audio.currentTime - (this.currentMarker ? this.currentMarker.start : 0);

        this.currentConfig.delay = Math.max(0, (this.startTime - window.performance.now()) / 1000);

        this.stopAndReleaseAudioTag();
    },

    onFocus: function ()
    {
        this.isPlaying = true;
        this.isPaused = false;
        this.pickAndPlayAudioTag();
    },

    update: function (time)
    {
        if (!this.isPlaying)
        {
            return;
        }

        if (this.startTime > 0)
        {
            if (this.startTime < time - this.manager.audioPlayDelay)
            {
                this.audio.currentTime += Math.max(0, time - this.startTime) / 1000;
                this.startTime = 0;
                this.previousTime = this.audio.currentTime;
                this.playCatchPromise();
            }

            return;
        }

        var startTime = this.currentMarker ? this.currentMarker.start : 0;
        var endTime = startTime + this.duration;
        var currentTime = this.audio.currentTime;

        if (this.currentConfig.loop)
        {
            if (currentTime >= endTime - this.manager.loopEndOffset)
            {
                this.audio.currentTime = startTime + Math.max(0, currentTime - endTime);
                currentTime = this.audio.currentTime;
            }
            else if (currentTime < startTime)
            {
                this.audio.currentTime += startTime;
                currentTime = this.audio.currentTime;
            }

            if (currentTime < this.previousTime)
            {
                this.emit(Events.LOOPED, this);
            }
        }
        else if (currentTime >= endTime)
        {
            this.reset();

            this.stopAndReleaseAudioTag();

            this.emit(Events.COMPLETE, this);

            return;
        }

        this.previousTime = currentTime;
    },

    destroy: function ()
    {
        BaseSound.prototype.destroy.call(this);

        this.tags = null;

        if (this.audio)
        {
            this.stopAndReleaseAudioTag();
        }
    },

    updateMute: function ()
    {
        if (this.audio)
        {
            this.audio.muted = this.currentConfig.mute || this.manager.mute;
        }
    },

    updateVolume: function ()
    {
        if (this.audio)
        {
            this.audio.volume = Clamp(this.currentConfig.volume * this.manager.volume, 0, 1);
        }
    },

    calculateRate: function ()
    {
        BaseSound.prototype.calculateRate.call(this);

        if (this.audio)
        {
            this.audio.playbackRate = this.totalRate;
        }
    },

    mute: {

        get: function ()
        {
            return this.currentConfig.mute;
        },

        set: function (value)
        {
            this.currentConfig.mute = value;

            if (this.manager.isLocked(this, 'mute', value))
            {
                return;
            }

            this.updateMute();

            this.emit(Events.MUTE, this, value);
        }
    },

    setMute: function (value)
    {
        this.mute = value;

        return this;
    },

    volume: {

        get: function ()
        {
            return this.currentConfig.volume;
        },

        set: function (value)
        {
            this.currentConfig.volume = value;

            if (this.manager.isLocked(this, 'volume', value))
            {
                return;
            }

            this.updateVolume();

            this.emit(Events.VOLUME, this, value);
        }
    },

    setVolume: function (value)
    {
        this.volume = value;

        return this;
    },

    rate: {

        get: function ()
        {
            return this.currentConfig.rate;
        },

        set: function (value)
        {
            this.currentConfig.rate = value;

            if (this.manager.isLocked(this, Events.RATE, value))
            {
                return;
            }
            else
            {
                this.calculateRate();

                this.emit(Events.RATE, this, value);
            }
        }

    },

    setRate: function (value)
    {
        this.rate = value;

        return this;
    },

    detune: {

        get: function ()
        {
            return this.currentConfig.detune;
        },

        set: function (value)
        {
            this.currentConfig.detune = value;

            if (this.manager.isLocked(this, Events.DETUNE, value))
            {
                return;
            }
            else
            {
                this.calculateRate();

                this.emit(Events.DETUNE, this, value);
            }
        }

    },

    setDetune: function (value)
    {
        this.detune = value;

        return this;
    },

    seek: {

        get: function ()
        {
            if (this.isPlaying)
            {
                return this.audio.currentTime - (this.currentMarker ? this.currentMarker.start : 0);
            }
            else if (this.isPaused)
            {
                return this.currentConfig.seek;
            }
            else
            {
                return 0;
            }
        },

        set: function (value)
        {
            if (this.manager.isLocked(this, 'seek', value))
            {
                return;
            }

            if (this.startTime > 0)
            {
                return;
            }

            if (this.isPlaying || this.isPaused)
            {
                value = Math.min(Math.max(0, value), this.duration);

                if (this.isPlaying)
                {
                    this.previousTime = value;
                    this.audio.currentTime = value;
                }
                else if (this.isPaused)
                {
                    this.currentConfig.seek = value;
                }

                this.emit(Events.SEEK, this, value);
            }
        }
    },

    setSeek: function (value)
    {
        this.seek = value;

        return this;
    },

    loop: {

        get: function ()
        {
            return this.currentConfig.loop;
        },

        set: function (value)
        {
            this.currentConfig.loop = value;

            if (this.manager.isLocked(this, 'loop', value))
            {
                return;
            }

            if (this.audio)
            {
                this.audio.loop = value;
            }

            this.emit(Events.LOOP, this, value);
        }

    },

    setLoop: function (value)
    {
        this.loop = value;

        return this;
    },

    pan: {

        get: function ()
        {
            return this.currentConfig.pan;
        },

        set: function (value)
        {
            this.currentConfig.pan = value;

            this.emit(Events.PAN, this, value);
        }
    },

    setPan: function (value)
    {
        this.pan = value;

        return this;
    }

});

module.exports = HTML5AudioSound;
