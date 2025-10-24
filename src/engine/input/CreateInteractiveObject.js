var CreateInteractiveObject = function (gameObject, hitArea, hitAreaCallback) {
  return {
    gameObject: gameObject,
    enabled: true,
    draggable: false,
    dropZone: false,
    cursor: false,
    target: null,
    camera: null,
    hitArea: hitArea,
    hitAreaCallback: hitAreaCallback,
    hitAreaDebug: null,
    customHitArea: false,
    localX: 0,
    localY: 0,
    dragState: 0,
    dragStartX: 0,
    dragStartY: 0,
    dragStartXGlobal: 0,
    dragStartYGlobal: 0,
    dragStartCamera: null,
    dragX: 0,
    dragY: 0,
  };
};
module.exports = CreateInteractiveObject;
