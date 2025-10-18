

var Class = require('../../utils/Class');
var CONST = require('../const');
var File = require('../File');
var FileTypesManager = require('../FileTypesManager');
var GetFastValue = require('../../utils/object/GetFastValue');
var HTML5AudioFile = require('./HTML5AudioFile');
var IsPlainObject = require('../../utils/object/IsPlainObject');


var AudioFile = new Class({

    Extends: File,

    initialize:

    //  URL is an object created by AudioFile.findAudioURL
    function AudioFile (loader, key, urlConfig, xhrSettings, audioContext)
    {
        if (IsPlainObject(key))
        {
            var config = key;

            key = GetFastValue(config, 'key');
            xhrSettings = GetFastValue(config, 'xhrSettings');
            audioContext = GetFastValue(config, 'context', audioContext);
        }

        var fileConfig = {
            type: 'audio',
            cache: loader.cacheManager.audio,
            extension: urlConfig.type,
            responseType: 'arraybuffer',
            key: key,
            url: urlConfig.url,
            xhrSettings: xhrSettings,
            config: { context: audioContext }
        };

        File.call(this, loader, fileConfig);
    },

    
    onProcess: function ()
    {
        this.state = CONST.FILE_PROCESSING;

        var _this = this;

        // interesting read https://github.com/WebAudio/web-audio-api/issues/1305
        this.config.context.decodeAudioData(this.xhrLoader.response,
            function (audioBuffer)
            {
                _this.data = audioBuffer;

                _this.onProcessComplete();
            },
            function (e)
            {
                // eslint-disable-next-line no-console
                console.error('Error decoding audio: ' + _this.key + ' - ', e ? e.message : null);

                _this.onProcessError();
            }
        );

        this.config.context = null;
    }

});

AudioFile.create = function (loader, key, urls, config, xhrSettings)
{
    var game = loader.systems.game;
    var audioConfig = game.config.audio;
    var deviceAudio = game.device.audio;

    //  url may be inside key, which may be an object
    if (IsPlainObject(key))
    {
        urls = GetFastValue(key, 'url', []);
        config = GetFastValue(key, 'config', {});
    }

    var urlConfig = AudioFile.getAudioURL(game, urls);

    if (!urlConfig)
    {
        console.warn('No audio URLs for "%s" can play on this device', key);

        return null;
    }

    // https://developers.google.com/web/updates/2012/02/HTML5-audio-and-the-Web-Audio-API-are-BFFs
    // var stream = GetFastValue(config, 'stream', false);

    if (deviceAudio.webAudio && !audioConfig.disableWebAudio)
    {
        return new AudioFile(loader, key, urlConfig, xhrSettings, game.sound.context);
    }
    else
    {
        return new HTML5AudioFile(loader, key, urlConfig, config);
    }
};

AudioFile.getAudioURL = function (game, urls)
{
    if (!Array.isArray(urls))
    {
        urls = [ urls ];
    }

    for (var i = 0; i < urls.length; i++)
    {
        var url = GetFastValue(urls[i], 'url', urls[i]);

        if (url.indexOf('blob:') === 0 || url.indexOf('data:') === 0)
        {
            return {
                url: url,
                type: ''
            };
        }

        var audioType = url.match(/\.([a-zA-Z0-9]+)($|\?)/);

        audioType = GetFastValue(urls[i], 'type', (audioType) ? audioType[1] : '').toLowerCase();

        if (game.device.audio[audioType])
        {
            return {
                url: url,
                type: audioType
            };
        }
    }

    return null;
};


FileTypesManager.register('audio', function (key, urls, config, xhrSettings)
{
    var game = this.systems.game;
    var audioConfig = game.config.audio;
    var deviceAudio = game.device.audio;

    if (audioConfig.noAudio || (!deviceAudio.webAudio && !deviceAudio.audioData))
    {
        //  Sounds are disabled, so skip loading audio
        return this;
    }

    var audioFile;

    if (Array.isArray(key))
    {
        for (var i = 0; i < key.length; i++)
        {
            //  If it's an array it has to be an array of Objects, so we get everything out of the 'key' object
            audioFile = AudioFile.create(this, key[i]);

            if (audioFile)
            {
                this.addFile(audioFile);
            }
        }
    }
    else
    {
        audioFile = AudioFile.create(this, key, urls, config, xhrSettings);

        if (audioFile)
        {
            this.addFile(audioFile);
        }
    }

    return this;
});

module.exports = AudioFile;
