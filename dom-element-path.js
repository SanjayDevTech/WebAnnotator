const parentElements = (element) => {
  const parents = [];
  while (element) {
    const tagName = element.nodeName.toLowerCase();
    const cssId = element.id ? `#${element.id}` : '';
    // let cssClass = '';
    // if (element.className && typeof element.className === 'string') {
    //   // escape class names
    //   cssClass = `.${element.className.replace(/\s+/g, '.').replace(/[:*+?^${}()|[\]\\]/gi, '\\$&')}`;
    // }

    parents.unshift({
      element,
      selector: tagName + cssId,
      // selector: tagName + cssId + cssClass,
    });

    element = element.parentNode !== document ? element.parentNode : false;
  }

  return parents;
};

const nthElement = (element, sameType = true) => {
  let c = element;
  let nth = 1;
  while (c.previousElementSibling !== null) {
    if (!sameType || c.previousElementSibling.nodeName === element.nodeName) {
      nth++;
    }
    c = c.previousElementSibling;
  }

  return nth;
};

export { nthElement };

const nthSelectorNeeded = (selector, path) => {
  const querySelector = path === '' ? selector : `${path} > ${selector}`;

  return document.querySelectorAll(querySelector).length > 1;
};

const buildPathString = (parents) => {
  const pathArr = [];
  const joinSep = "->"

  parents.forEach((parent) => {
    if (nthSelectorNeeded(parent.selector, pathArr.join(joinSep))) {
      parent.selector += `:nth-of-type(${nthElement(parent.element)})`;
    }
    pathArr.push(parent.selector.replace("#", "@"));
  });

  return pathArr.join(joinSep);
};

const domElementPath = (element) => {
  if (!(element instanceof HTMLElement)) {
    throw new Error('element must be of type `HTMLElement`.');
  }

  return buildPathString(parentElements(element));
};

export default domElementPath;
