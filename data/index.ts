
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
  DataBrowserModel
} from './model';

import {
  DataViewerWidget
} from './viewer';

import {
  DataBrowserWidget
} from './widget';

import {
  TradesData, PositionsData, MarketData, PnlData,
  IDataProvider
} from './financial';


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
    var tradesFeed = new TradesData('Trades');
    var posFeed = new PositionsData('Positions', tradesFeed);
    var marketDataFeed = new MarketData('MarketData');
    var pnlFeed = new PnlData('PnL', posFeed, marketDataFeed);

    tradesFeed.initialise();
    //posFeed.set_target(null);

    let dataModel = new DataBrowserModel();
    dataModel.addItems([
      tradesFeed, posFeed, marketDataFeed, pnlFeed
    ]);

    let dataBrowser = new DataBrowserWidget(dataModel);
    dataBrowser.title.text = 'Data';

    this._shell.addToLeftArea(dataBrowser, {rank: 1});

    let onOpenRequested = (sender: DataBrowserModel, value: string) => {
      let item = sender.sortedItems[0]; // TODO : get selected item.
      let widget = new DataViewerWidget(item);
      widget.title.text = value;
      widget.title.closable = true;
      this._shell.addToMainArea(widget);
    };
    dataModel.openRequested.connect((sender, value) => onOpenRequested(sender, value));
  }

  private _shell: IAppShell = null;
}
