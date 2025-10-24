var Class = require('../utils/Class');
var AnimationFrame = new Class({
  initialize: function AnimationFrame(
    textureKey,
    textureFrame,
    index,
    frame,
    isKeyFrame,
  ) {
    if (isKeyFrame === undefined) {
      isKeyFrame = false;
    }
    this.textureKey = textureKey;
    this.textureFrame = textureFrame;
    this.index = index;
    this.frame = frame;
    this.isFirst = false;
    this.isLast = false;
    this.prevFrame = null;
    this.nextFrame = null;
    this.duration = 0;
    this.progress = 0;
    this.isKeyFrame = isKeyFrame;
  },
  toJSON: function () {
    return {
      key: this.textureKey,
      frame: this.textureFrame,
      duration: this.duration,
      keyframe: this.isKeyFrame,
    };
  },
  destroy: function () {
    this.frame = undefined;
  },
});
module.exports = AnimationFrame;
