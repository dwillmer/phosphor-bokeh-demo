
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
    var sel = document.createElement('select');
    var gridOpt = document.createElement('option');
    gridOpt.text = 'Grid';
    sel.add(gridOpt);
    var chartOpt = document.createElement('option');
    chartOpt.text = 'Chart';
    sel.add(chartOpt);

    this.node.appendChild(sel);
    sel.addEventListener('change', () => {
      console.log('Select changed: ', sel.selectedIndex);
      if (sel.selectedIndex === 0) {
        this._selectGridView();
      } else {
        this._selectChartView();
      }
    });

    // Default setting is grid view.
    this._selectGridView();

    this.node.appendChild(this._container);
  }

  private _selectChartView(): void {
    this._model.dataUpdated.disconnect(this._refreshData, this);
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }
    this._container.className = 'bk-root';

    this._view = document.createElement('div');

    // Put Bokeh plot here...
    this._view.appendChild(document.createTextNode('Bokeh chart view.'))

    this._container.appendChild(this._view);

    // this._model.set_target(null);
  }

  private _selectGridView(): void {
    this._container.className = 'ag-blue';
    this._view = new Grid(
      this._container,
      this._buildGridOptions()
    );
    this._model.dataUpdated.connect(this._refreshData, this);
  }

  private _buildGridOptions(): any {
    this._opts = {
      columnDefs: this._model.columns(),
      rowData: this._model.rows(),
      enableFilter: true,
      enableSorting: true,
      enableColResize: true,
      enableStatusBar: true,
      enableRangeSelection: true,
      onGridReady: function(params: any) {
        params.api.sizeColumnsToFit();
      },
      rowGroupPanelShow: 'always',
      groupKeys: undefined,
      groupHideGroupColumns: true,
      rowSelection: 'multiple',
      rowDeselection: true,
      groupSelectsChildren: true,
      suppressRowClickSelection: true,
      showToolPanel: window.innerWidth > 900
    };
    return this._opts;
  }

  private _refreshData(sender: IDataProvider, value: any) {
    this._opts.api.setRowData(this._model.rows());
  }

  private _model: IDataProvider = null;
  private _container: HTMLElement = null;
  private _view: any = null;
  private _opts: any = null;
}
