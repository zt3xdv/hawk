var GetTarget = function (element) {
  var target;
  if (element !== '') {
    if (typeof element === 'string') {
      target = document.getElementById(element);
    } else if (element && element.nodeType === 1) {
      target = element;
    }
  }
  if (!target) {
    target = document.body;
  }
  return target;
};
module.exports = GetTarget;
