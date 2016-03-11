
import {
  Widget
} from 'phosphor-widget';

import {
  Grid
} from 'Slick';

import {
  ItemModel
} from './model';


/**
 * A widget which hosts a data browser.
 */
export
class DataViewerWidget extends Widget {
  constructor(model: ItemModel) {
    super();
    this._model = model;

    this._container = document.createElement('div');
    this._grid = new Grid(
      this._container,
      model.rows(),
      model.columns()
    );
  }

  private _model: ItemModel = null;
  private _container: HTMLElement = null;
  private _grid: any = null;
}
