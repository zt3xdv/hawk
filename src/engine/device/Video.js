

var GetFastValue = require('../utils/object/GetFastValue');


var Video = {

    h264: false,
    hls: false,
    mp4: false,
    m4v: false,
    ogg: false,
    vp9: false,
    webm: false,
    hasRequestVideoFrame: false

};

function init ()
{
    if (typeof importScripts === 'function')
    {
        return Video;
    }

    var videoElement = document.createElement('video');
    var result = !!videoElement.canPlayType;
    var no = /^no$/;

    try
    {
        if (result)
        {
            if (videoElement.canPlayType('video/ogg; codecs="theora"').replace(no, ''))
            {
                Video.ogg = true;
            }

            if (videoElement.canPlayType('video/mp4; codecs="avc1.42E01E"').replace(no, ''))
            {
                // Without QuickTime, this value will be `undefined`. github.com/Modernizr/Modernizr/issues/546
                Video.h264 = true;
                Video.mp4 = true;
            }

            if (videoElement.canPlayType('video/x-m4v').replace(no, ''))
            {
                Video.m4v = true;
            }

            if (videoElement.canPlayType('video/webm; codecs="vp8, vorbis"').replace(no, ''))
            {
                Video.webm = true;
            }

            if (videoElement.canPlayType('video/webm; codecs="vp9"').replace(no, ''))
            {
                Video.vp9 = true;
            }

            if (videoElement.canPlayType('application/x-mpegURL; codecs="avc1.42E01E"').replace(no, ''))
            {
                Video.hls = true;
            }
        }
    }
    catch (e)
    {
        //  Nothing to do
    }

    if (videoElement.parentNode)
    {
        videoElement.parentNode.removeChild(videoElement);
    }

    Video.getVideoURL = function (urls)
    {
        if (!Array.isArray(urls))
        {
            urls = [ urls ];
        }

        for (var i = 0; i < urls.length; i++)
        {
            var url = GetFastValue(urls[i], 'url', urls[i]);

            if (url.indexOf('blob:') === 0)
            {
                return {
                    url: url,
                    type: ''
                };
            }

            var videoType;

            if (url.indexOf('data:') === 0)
            {
                videoType = url.split(',')[0].match(/\/(.*?);/);
            }
            else
            {
                videoType = url.match(/\.([a-zA-Z0-9]+)($|\?)/);
            }

            videoType = GetFastValue(urls[i], 'type', (videoType) ? videoType[1] : '').toLowerCase();

            if (Video[videoType])
            {
                return {
                    url: url,
                    type: videoType
                };
            }
        }

        return null;
    };

    return Video;
}

module.exports = init();
