
import {
  Message
} from 'phosphor-messaging';

import {
  PanelLayout
} from 'phosphor-panel';

import {
  Widget
} from 'phosphor-widget';

import {
  DataBrowserModel
} from './model';

import {
  DataSection
} from './section';

const DATA_CLASS = 'ph-DataBrowser-item';
const REFRESH_DURATION = 30000;

/**
 * A widget which hosts a data browser.
 */
export
class DataBrowserWidget extends Widget {
  constructor(model: DataBrowserModel) {
    super();
    this._model = model;
    this._model.refreshed.connect(this._handleRefresh, this);

    this._dataSection = new DataSection(model);
    this._dataSection.addClass(DATA_CLASS);

    let layout = new PanelLayout();
    layout.addChild(this._dataSection);

    this.layout = layout;
  }

  refresh() {
    this._model.refresh();
    console.log('Data widget refresh...');
  }

  dispose() {
    this._model = null;
    this._dataSection = null;
    super.dispose();
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.refresh();
  }

  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.refresh();
  }

  private _handleRefresh(): void {
    clearTimeout(this._timeoutId);
    this._timeoutId = setTimeout(() => this.refresh(), REFRESH_DURATION);
  }

  private _model: DataBrowserModel = null;
  private _dataSection: DataSection = null;
  private _timeoutId = -1;
}
