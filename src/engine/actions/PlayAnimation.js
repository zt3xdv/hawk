var PlayAnimation = function (items, key, ignoreIfPlaying) {
  for (var i = 0; i < items.length; i++) {
    var gameObject = items[i];
    if (gameObject.anims) {
      gameObject.anims.play(key, ignoreIfPlaying);
    }
  }
  return items;
};
module.exports = PlayAnimation;
