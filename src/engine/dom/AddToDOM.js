var AddToDOM = function (element, parent) {
  var target;
  if (parent) {
    if (typeof parent === 'string') {
      target = document.getElementById(parent);
    } else if (typeof parent === 'object' && parent.nodeType === 1) {
      target = parent;
    }
  } else if (element.parentElement || parent === null) {
    return element;
  }
  if (!target) {
    target = document.body;
  }
  target.appendChild(element);
  return element;
};
module.exports = AddToDOM;
