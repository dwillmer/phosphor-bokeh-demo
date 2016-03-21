
import {
  Widget, ResizeMessage
} from 'phosphor-widget';

import {
  Grid
} from 'ag-grid/main';

import 'ag-grid-enterprise/main';

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

  onResize(msg: ResizeMessage): void {
    super.onResize(msg);
    if (this._view) {
      let sel = this.node.children[0].getBoundingClientRect();
      this._container.style.height = (msg.height-sel.height)-5 + 'px';
      this._opts.api.sizeColumnsToFit();
    }
  }

  dispose() {
    super.dispose();
    if (this._model) {
      this._model.unsubscribe();
    }
    this._model.dataUpdated.disconnect(this._refreshData, this);
    this._model = null;
  }

  private _selectChartView(): void {
    this._model.unsubscribe();
    this._model.dataUpdated.disconnect(this._refreshData, this);
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }
    this._container.classList.remove('ag-blue');
    this._container.classList.add('bk-root');

    this._view = document.createElement('div');

    // Put Bokeh plot here...
    this._view.appendChild(document.createTextNode('Bokeh chart view.'))

    this._container.appendChild(this._view);

    // this._model.set_target(null);
  }

  private _selectGridView(): void {
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }
    this._container.classList.remove('bk-root');
    this._container.classList.add('ag-blue');
    this._view = new Grid(
      this._container,
      this._buildGridOptions()
    );
    this._model.dataUpdated.connect(this._refreshData, this);
    this._model.subscribe();
  }

  private _buildGridOptions(): any {
    var groupColumn = {
      headerName: 'Group',
      width: 200,
      field: 'Name',
      valueGetter: function(params: any) {
        if (params.node.group) {
          return params.node.key;
        } else {
          return params.data[params.colDef.field];
        }
      },
      //comparator: agGrid.defaultGroupComparator,
      suppressAggregation: false,
      suppressRowGroup: true,
      cellRenderer: {
        renderer: 'group',
        checkbox: true
      }
    };

    this._opts = {
      columnDefs: this._model.columns(),
      rowData: this._model.rows(),
      enableFilter: true,
      enableSorting: true,
      enableColResize: true,
      //enableStatusBar: true,
      enableRangeSelection: true,
      onGridReady: function(params: any) {
        params.api.sizeColumnsToFit();
      },
      rowGroupPanelShow: 'always',
      groupKeys: undefined,
      groupHideGroupColumns: true,
      groupColumnDef: groupColumn,
      rowSelection: 'multiple',
      rowDeselection: true,
      groupSelectsChildren: true,
      suppressRowClickSelection: true,
      //showToolPanel: window.innerWidth > 900
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
