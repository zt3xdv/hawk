var GetAdvancedValue = require('../utils/object/GetAdvancedValue');
var BuildGameObjectAnimation = function (sprite, config) {
  var animConfig = GetAdvancedValue(config, 'anims', null);
  if (animConfig === null) {
    return sprite;
  }
  if (typeof animConfig === 'string') {
    sprite.anims.play(animConfig);
  } else if (typeof animConfig === 'object') {
    var anims = sprite.anims;
    var key = GetAdvancedValue(animConfig, 'key', undefined);
    if (key) {
      var startFrame = GetAdvancedValue(animConfig, 'startFrame', undefined);
      var delay = GetAdvancedValue(animConfig, 'delay', 0);
      var repeat = GetAdvancedValue(animConfig, 'repeat', 0);
      var repeatDelay = GetAdvancedValue(animConfig, 'repeatDelay', 0);
      var yoyo = GetAdvancedValue(animConfig, 'yoyo', false);
      var play = GetAdvancedValue(animConfig, 'play', false);
      var delayedPlay = GetAdvancedValue(animConfig, 'delayedPlay', 0);
      var playConfig = {
        key: key,
        delay: delay,
        repeat: repeat,
        repeatDelay: repeatDelay,
        yoyo: yoyo,
        startFrame: startFrame,
      };
      if (play) {
        anims.play(playConfig);
      } else if (delayedPlay > 0) {
        anims.playAfterDelay(playConfig, delayedPlay);
      } else {
        anims.load(playConfig);
      }
    }
  }
  return sprite;
};
module.exports = BuildGameObjectAnimation;
