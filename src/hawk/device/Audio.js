var Browser = require('./Browser');
var Audio = {
  flac: false,
  aac: false,
  audioData: false,
  dolby: false,
  m4a: false,
  mp3: false,
  ogg: false,
  opus: false,
  wav: false,
  webAudio: false,
  webm: false,
};
function init() {
  if (typeof importScripts === 'function') {
    return Audio;
  }
  Audio.audioData = !!window['Audio'];
  Audio.webAudio = !!(window['AudioContext'] || window['webkitAudioContext']);
  var audioElement = document.createElement('audio');
  var result = !!audioElement.canPlayType;
  try {
    if (result) {
      var CanPlay = function (type1, type2) {
        var canPlayType1 = audioElement
          .canPlayType('audio/' + type1)
          .replace(/^no$/, '');
        if (type2) {
          return Boolean(
            canPlayType1 ||
              audioElement.canPlayType('audio/' + type2).replace(/^no$/, ''),
          );
        } else {
          return Boolean(canPlayType1);
        }
      };
      Audio.ogg = CanPlay('ogg; codecs="vorbis"');
      Audio.opus = CanPlay('ogg; codecs="opus"', 'opus');
      Audio.mp3 = CanPlay('mpeg');
      Audio.wav = CanPlay('wav');
      Audio.m4a = CanPlay('x-m4a');
      Audio.aac = CanPlay('aac');
      Audio.flac = CanPlay('flac', 'x-flac');
      Audio.webm = CanPlay('webm; codecs="vorbis"');
      if (audioElement.canPlayType('audio/mp4; codecs="ec-3"') !== '') {
        if (Browser.edge) {
          Audio.dolby = true;
        } else if (Browser.safari && Browser.safariVersion >= 9) {
          if (/Mac OS X (\d+)_(\d+)/.test(navigator.userAgent)) {
            var major = parseInt(RegExp.$1, 10);
            var minor = parseInt(RegExp.$2, 10);
            if ((major === 10 && minor >= 11) || major > 10) {
              Audio.dolby = true;
            }
          }
        }
      }
    }
  } catch (e) {}
  return Audio;
}
module.exports = init();
