
import {
  Widget
} from 'phosphor-widget';

import {
  Grid
} from 'ag-grid/main';

import {
  IDataProvider
} from './financial';

/**
 * A widget which hosts a data browser.
 */
export
class DataViewerWidget extends Widget {
  constructor(model: IDataProvider) {
    super();
    this._model = model;

    this._container = document.createElement('div');
    this._container.className = 'ag-fresh';

    this._model.dataUpdated.connect(this._refreshData, this);

    this._grid = new Grid(
      this._container,
      this._buildGridOptions()
    );

    this.node.appendChild(this._container);
  }

  private _buildGridOptions(): any {
    return {
      columnDefs: this._model.columns(),
      rowData: this._model.rows(),
      enableFilter: true,
      enableSorting: true,
      onGridReady: function(params: any) {
        params.api.sizeColumnsToFit();
      }
    };
  }

  private _refreshData(sender: IDataProvider, value: any) {
    console.log('viewer received data update');
  }

  private _model: IDataProvider = null;
  private _container: HTMLElement = null;
  private _grid: any = null;
}
