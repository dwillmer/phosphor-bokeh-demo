
import {
  Drag, DropAction, DropActions, IDragEvent, MimeData
} from 'phosphor-dragdrop';

import {
  Message
} from 'phosphor-messaging';

import {
  Widget
} from 'phosphor-widget';

import {
  DataBrowserModel, ItemModel
} from './model';

import * as arrays from 'phosphor-arrays';
import * as utils from './utils';

import {
  SELECTED_CLASS
} from './utils';


/**
 * The class names added to the DataSection nodes.
 */
const CONTENT_CLASS = 'ph-DataSection-content';
const DATA_SECTION_TEXT = 'ph-DataSection-text';
const DESCENDING_CLASS = 'ph-mod-descending';
const DRAG_THRESHOLD = 5;
const HEADER_CLASS = 'ph-DataSection-header';
const HEADER_ITEM_CLASS = 'ph-DataSection-headerItem';
const ITEM_CLASS = 'ph-DataSection-item';
const ITEM_TEXT_CLASS = 'ph-DataSection-itemText';
const LOCAL_TABULAR_TYPE_CLASS = 'ph-DataSection-localTabular';
const MULTI_SELECTED_CLASS = 'ph-DataSection-multiSelected';



export
class DataSection extends Widget {

  static createTextNode(text: string): HTMLElement {
    var node = DataSection.createNode();
    node.children[0].textContent = text;
    return node;
  }

  static createNode(): HTMLElement {
    let node = document.createElement('div');
    let content = document.createElement('span');
    content.className = CONTENT_CLASS;
    node.appendChild(content);
    node.tabIndex = 1;
    return node;
  }

  static updateItemNode(node: HTMLElement, model: ItemModel) {
    let currNode = node.firstChild as HTMLElement;

    let type: string;
    switch (model.type) {
    case 'local-tabular':
      type = LOCAL_TABULAR_TYPE_CLASS;
      break;
    }

    let modText = '';
    let modTitle = '';

    node.className = `${ITEM_CLASS} ${type}`;
    currNode.textContent = model.name;
  }

  constructor(model: DataBrowserModel) {
    super();
    this._model = model;
    this._model.refreshed.connect(this._onModelRefresh, this);
  }

  get headerNode(): HTMLElement {
    return utils.findElement(this.node, HEADER_CLASS);
  }

  dispose(): void {
    this._model = null;
    this._items = null;
    this._drag = null;
    this._dragData = null;
    super.dispose();
  }

  /**
   * Get the data browser content node.
   */
  get contentNode(): HTMLElement {
    return utils.findElement(this.node, CONTENT_CLASS);
  }

  /**
   * Handle the DOM events.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'mousedown':
      this._evtMousedown(event as MouseEvent);
      break;
    case 'mouseup':
      this._evtMouseup(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMousemove(event as MouseEvent);
      break;
    case 'keydown':
      //this._evtKeyown(event as KeyboardEvent);
      break;
    case 'click':
      this._evtClick(event as MouseEvent);
      break;
    case 'dblclick':
      this._evtDblClick(event as MouseEvent);
      break;
    case 'scroll':
      this._evtScroll(event as MouseEvent);
      break;
    case 'p-dragenter':
      this._evtDragEnter(event as IDragEvent);
      break;
    case 'p-dragleave':
      this._evtDragLeave(event as IDragEvent);
      break;
    case 'p-dragover':
      this._evtDragOver(event as IDragEvent);
      break;
    case 'p-drop':
      this._evtDrop(event as IDragEvent);
      break;
    }
  }

  /**
   * A handler invoked on an `after-attach` message.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    let node = this.node;
    let content = utils.findElement(node, CONTENT_CLASS);
    node.addEventListener('mousedown', this);
    node.addEventListener('keydown', this);
    node.addEventListener('click', this);
    node.addEventListener('dblclick', this);
    content.addEventListener('scroll', this);
    content.addEventListener('p-dragenter', this);
    content.addEventListener('p-dragleave', this);
    content.addEventListener('p-dragover', this);
    content.addEventListener('p-drop', this);
  }

  /**
   * A handler invoked on a `before-detach` message.
   */
  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    let node = this.node;
    let content = utils.findElement(node, CONTENT_CLASS);
    node.removeEventListener('mousedown', this);
    node.removeEventListener('keydown', this);
    node.removeEventListener('click', this);
    node.removeEventListener('dblclick', this);
    content.removeEventListener('scroll', this);
    content.removeEventListener('p-dragenter', this);
    content.removeEventListener('p-dragleave', this);
    content.removeEventListener('p-dragover', this);
    content.removeEventListener('p-drop', this);
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('mouseup', this, true);
  }

  /**
   * A handler invoked on an `update-request` message.
   */
  protected onUpdateRequest(msg: Message): void {
    // Fetch common variables.
    let items = this._model.sortedItems;
    let nodes = this._items;
    let content = utils.findElement(this.node, CONTENT_CLASS);
    let subtype = this.constructor as typeof DataSection;

    this.removeClass(MULTI_SELECTED_CLASS);
    this.removeClass(SELECTED_CLASS);

    // Remove any excess item nodes.
    while (nodes.length > items.length) {
      let node = nodes.pop();
      content.removeChild(node);
    }

    // // Add any missing item nodes.
    // while (nodes.length < items.length) {
    //   let node = subtype.createTextNode('empty');
    //   nodes.push(node);
    //   content.appendChild(node);
    // }

    // Update the node states to match the model contents.
    for (let i = 0, n = items.length; i < n; ++i) {
      subtype.updateItemNode(nodes[i], items[i]);
      if (this._model.isSelected(items[i].name)) {
        nodes[i].classList.add(SELECTED_CLASS);
      }
    }

    // Handle the selectors on the widget node.
    let selectedNames = this._model.getSelected();
    if (selectedNames.length > 1) {
      this.addClass(MULTI_SELECTED_CLASS);
    }
    if (selectedNames.length) {
      this.addClass(SELECTED_CLASS);
    }

    //this._prevPath = this._model.path;
  }

  /**
   * Handle the `click` event for the widget.
   */
  private _evtClick(event: MouseEvent): void {
    this._softSelection = '';
    let target = event.target as HTMLElement;

    let header = this.headerNode;
    if (header.contains(target)) {
      let children = header.getElementsByClassName(HEADER_ITEM_CLASS);
      let name = children[0] as HTMLElement;
      let modified = children[1] as HTMLElement;

      if (name.contains(target)) {
        name.classList.add(SELECTED_CLASS);
        modified.classList.remove(SELECTED_CLASS);
        modified.classList.remove(DESCENDING_CLASS);
      } else if (modified.contains(target)) {
        modified.classList.remove(DESCENDING_CLASS);
      }
      modified.classList.add(SELECTED_CLASS);
      name.classList.remove(SELECTED_CLASS);
      name.classList.remove(DESCENDING_CLASS);
    }
    // this.update();
    // return;

    // Bail if editing.
    if (this._editNode.contains(target)) {
      return;
    }

    let content = this.contentNode;
    if (content.contains(target)) {
      this._handleFileSelect(event);
    }
  }

  /**
   * Handle the `scroll` event for the widget.
   */
  private _evtScroll(event: MouseEvent): void {
    this.headerNode.scrollLeft = this.contentNode.scrollLeft;
  }

  /**
   * Handle the `mousedown` event for the widget.
   */
  private _evtMousedown(event: MouseEvent): void {
    // Bail if clicking within the edit node.
    if (event.target === this._editNode) {
      return;
    }

    // Blur the edit node if necessary.
    if (this._editNode.parentNode) {
      if (this._editNode !== event.target as HTMLElement) {
        this._editNode.focus();
        this._editNode.blur();
        clearTimeout(this._selectTimer);
      } else {
        return;
      }
    }

    let index = utils.hitTestNodes(this._items, event.clientX, event.clientY);
    if (index === -1) {
      return;
    }

    this._softSelection = '';
    let items = this._model.sortedItems;
    let selected = this._model.getSelected();
    if (selected.indexOf(items[index].name) === -1) {
      this._softSelection = items[index].name;
    }

    // Left mouse press for drag start.
    if (event.button === 0) {
      this._dragData = {
        pressX: event.clientX,
        pressY: event.clientY,
        index: index
      };
      document.addEventListener('mouseup', this, true);
      document.addEventListener('mousemove', this, true);
    }

    if (event.button !== 0) {
      clearTimeout(this._selectTimer);
    }
  }

  /**
   * Handle the `mouseup` event for the widget.
   */
  private _evtMouseup(event: MouseEvent): void {
    if (event.button !== 0 || !this._drag) {
      document.removeEventListener('mousemove', this, true);
      document.removeEventListener('mouseup', this, true);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle the `mousemove` event for the widget.
   */
  private _evtMousemove(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Bail if we are the one dragging.
    if (this._drag) {
      return;
    }

    // Check for a drag initialization.
    let data = this._dragData;
    let dx = Math.abs(event.clientX - data.pressX);
    let dy = Math.abs(event.clientY - data.pressY);
    if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
      return;
    }

    this._startDrag(data.index, event.clientX, event.clientY);
  }

  /**
   * Handle the `dblclick` event for the widget.
   */
  private _evtDblClick(event: MouseEvent): void {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Do nothing if any modifier keys are pressed.
    if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    clearTimeout(this._selectTimer);
    // this._noSelectTimer = setTimeout(() => {
    //   this._noSelectTimer = -1;
    // }, RENAME_DURATION);

    this._editNode.blur();

    // Find a valid double click target.
    let target = event.target as HTMLElement;
    let i = arrays.findIndex(this._items, node => node.contains(target));
    if (i === -1) {
      return;
    }

    let item = this._model.sortedItems[i];
    this._model.open(item.name).catch(error => {
      console.log('Data open error', error);
    });
  }

  /**
   * Handle the `p-dragenter` event for the widget.
   */
  private _evtDragEnter(event: IDragEvent): void {
    if (event.mimeData.hasData(utils.CONTENTS_MIME)) {
      let index = utils.hitTestNodes(this._items, event.clientX, event.clientY);
      if (index === -1) {
        return;
      }
      let target = this._items[index];
      if (target.classList.contains(SELECTED_CLASS)) {
        return;
      }
      target.classList.add(utils.DROP_TARGET_CLASS);
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Handle the `p-dragleave` event for the widget.
   */
  private _evtDragLeave(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    let dropTarget = utils.findElement(this.node, utils.DROP_TARGET_CLASS);
    if (dropTarget) dropTarget.classList.remove(utils.DROP_TARGET_CLASS);
  }

  /**
   * Handle the `p-dragover` event for the widget.
   */
  private _evtDragOver(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    event.dropAction = event.proposedAction;
    let dropTarget = utils.findElement(this.node, utils.DROP_TARGET_CLASS);
    if (dropTarget) {
      dropTarget.classList.remove(utils.DROP_TARGET_CLASS);
    }
    let index = utils.hitTestNodes(this._items, event.clientX, event.clientY);
    this._items[index].classList.add(utils.DROP_TARGET_CLASS);
  }

  /**
   * Handle the `p-drop` event for the widget.
   */
  private _evtDrop(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.proposedAction === DropAction.None) {
      event.dropAction = DropAction.None;
      return;
    }
    if (!event.mimeData.hasData(utils.CONTENTS_MIME)) {
      return;
    }
    event.dropAction = event.proposedAction;

    let target = event.target as HTMLElement;

    while (target && target.parentElement) {
      if (target.classList.contains(utils.DROP_TARGET_CLASS)) {
        target.classList.remove(utils.DROP_TARGET_CLASS);
        break;
      }
      target = target.parentElement;
    }

    let index = this._items.indexOf(target);
    let items = this._model.sortedItems;
    var path = items[index].name + '/';

    // Move all of the items.
    let promises: Promise<void>[] = [];
    for (let item of items) {
      if (!this._softSelection && !this._model.isSelected(item.name)) {
        continue;
      }
      if (this._softSelection !== item.name) {
        continue;
      }
      var name = item.name;
      var newPath = path + name;
    }
    Promise.all(promises).then(
      () => this._model.refresh(),
      error => console.log(error)
    );

  }

  /**
   * Start a drag event.
   */
  private _startDrag(index: number, clientX: number, clientY: number): void {
    let selected = this._model.getSelected();
    let source = this._items[index];
    let items = this._model.sortedItems;
    let item: ItemModel = null;

    if (!source.classList.contains(SELECTED_CLASS)) {
      item = items[index];
      selected = [item.name];
    }

    // Create the drag image.
    var dragImage = source.cloneNode(true) as HTMLElement;
    dragImage.removeChild(dragImage.lastChild);
    var text = utils.findElement(dragImage, ITEM_TEXT_CLASS);
    text.textContent = '1';

    this._drag = new Drag({
      dragImage: dragImage,
      mimeData: new MimeData(),
      supportedActions: DropActions.Move,
      proposedAction: DropAction.Move
    });
    this._drag.mimeData.setData(utils.CONTENTS_MIME, null);

    // Start the drag and remove the mousemove listener.
    this._drag.start(clientX, clientY).then(action => {
      this._drag = null;
    });
    document.removeEventListener('mousemove', this, true);
  }

  private _handleFileSelect(event: MouseEvent): void {
    let items = this._model.sortedItems;
    let nodes = this._items;
    let index = utils.hitTestNodes(this._items, event.clientX, event.clientY);

    clearTimeout(this._selectTimer);

    let name = items[index].name;
    let selected = this._model.getSelected();

    if (this._model.isSelected(name)) {
      this._model.deselect(name);
    } else {
      this._model.select(name);
    }

    this.update();
  }

  /**
   * Handle the refreshed signal from the model.
   */
  private _onModelRefresh(): void {
    console.log('DataSection: _onModelRefresh');
    while (this.node.firstChild) {
      this.node.removeChild(this.node.firstChild);
    }
    this._items = [];
    let sorted = this._model.sortedItems;
    for (let i = 0; i < sorted.length; ++i) {
      let item = sorted[i];
      let newItem = DataSection.createTextNode(item.name);
      this._items.push(newItem);
      this.node.appendChild(newItem);
    }
    this.update();
  }

  private _editNode: HTMLInputElement = null;
  private _model: DataBrowserModel = null;
  private _items: HTMLElement[] = [];
  private _drag: Drag = null;
  private _dragData: { pressX: number, pressY: number, index: number } = null;
  private _prevPath = '';
  private _selectTimer = -1;
  private _noSelectTimer = -1;
  private _softSelection = '';
}


/**
 * The namespace for the private data.
 */
namespace Private {
  /**
   * Scroll an element into view if needed.
   */
  export
  function scrollIfNeeded(area: HTMLElement, elem: HTMLElement): void {
    let ar = area.getBoundingClientRect();
    let er = elem.getBoundingClientRect();
    if (er.top < ar.top) {
      area.scrollTop -= ar.top - er.top;
    } else if (er.bottom > ar.bottom) {
      area.scrollTop += er.bottom - ar.bottom;
    }
  }
}
