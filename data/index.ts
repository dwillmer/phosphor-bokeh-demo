
import {
  IAppShell
} from 'phosphide';

import {
  Container
} from 'phosphor-di';

import {
  Widget
} from 'phosphor-widget';

import {
  DataBrowserModel, ItemModel
} from './model';

import {
  DataViewerWidget
} from './viewer';

import {
  DataBrowserWidget
} from './widget';


export
function resolve(container: Container): Promise<void> {
  return container.resolve(DataHandler).then(handler => {
    handler.run();
  });
}


class DataHandler {

  static requires = [IAppShell];

  static create(shell: IAppShell): DataHandler {
    return new DataHandler(shell);
  }

  constructor(shell: IAppShell) {
    this._shell = shell;
  }

  run(): void {

    let equitiesTrades = new ItemModel('local-tabular', 'Equities Trades', [0,1,2,3,4]);
    let equitiesPositions = new ItemModel('local-tabular', 'Equities Positions', [2,3,4,5]);
    let ratesTrades = new ItemModel('local-tabular', 'Rates Trades', [0,1,2,3,4,5]);
    let ratesPositions = new ItemModel('local-tabular', 'Rates Positions', [6,7,8,9]);
    let ratesPnl = new ItemModel('local_tabular', 'Rates PnL', [0,1,2,3,4]);
    let commodsTrades = new ItemModel('local-tabular', 'Commod Trades', [0,1,2,3,4]);
    let commodsPositions = new ItemModel('local-tabular', 'Commod Positions', [0,1,2,3,4]);

    let dataModel = new DataBrowserModel();
    dataModel.addItems([
      commodsTrades, commodsPositions,
      equitiesTrades, equitiesPositions,
      ratesTrades, ratesPositions, ratesPnl,
    ]);

    let dataBrowser = new DataBrowserWidget(dataModel);
    dataBrowser.title.text = 'Data';

    this._shell.addToLeftArea(dataBrowser, {rank: 1});

    let onOpenRequested = (model: DataBrowserModel) => {
      let widget = new DataViewerWidget(model);
      this._shell.addToMainArea(widget);
    }
    dataModel.openRequested.connect(model => onOpenRequested(model));
  }

  private _shell: IAppShell = null;
}
