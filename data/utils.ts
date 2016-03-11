
import {
  hitTest
} from 'phosphor-domutil';

import {
  Widget
} from 'phosphor-widget';


export
const DATA_BROWSER_CLASS = 'ph-DataBrowser';

export
const DROP_TARGET_CLASS = 'ph-mod-dropTarget';

export
const SELECTED_CLASS = 'jp-mod-selected';

export
const CONTENTS_MIME = 'application/data-browser-contents';


/**
 * Get the index of the node at a client position, or `-1`.
 */
export
function hitTestNodes(nodes: HTMLElement[] | NodeList, x: number, y: number): number {
  for (let i = 0, n = nodes.length; i < n; ++i) {
    if (hitTest(nodes[i] as HTMLElement, x, y)) {
      return i;
    }
  }
  return -1;
}

/**
 * Find the first element matching a class name.
 */
export
function findElement(parent: HTMLElement, className: string): HTMLElement {
  let elements = parent.getElementsByClassName(className);
  if (elements.length) {
    return elements[0] as HTMLElement;
  }
}
