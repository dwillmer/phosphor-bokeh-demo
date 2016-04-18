
import {
  Application
} from 'phosphide/lib/core/application';

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

Bokeh.set_log_level("info");

export
const dataExtension = {
  id: 'demo.data',
  activate: activateData
};


function activateData(app: Application): Promise<void> {
  var tradesFeed = new TradesData('Trades');
  var posFeed = new PositionsData('Positions', tradesFeed);
  var marketDataFeed = new MarketData('MarketData');
  var pnlFeed = new PnlData('PnL', posFeed, marketDataFeed);

  tradesFeed.initialise();

  let dataModel = new DataBrowserModel();
  dataModel.addItems([
    tradesFeed, posFeed, marketDataFeed, pnlFeed
  ]);

  let dataBrowser = new DataBrowserWidget(dataModel);
  dataBrowser.id = 'DataBrowser';
  dataBrowser.title.text = 'Data';
  dataBrowser.addClass('ph-DataPalette');

  let onOpenRequested = (sender: DataBrowserModel, value: string) => {
    let widget = sender.newFromName(value)
    app.shell.addToMainArea(widget);
  };
  dataModel.openRequested.connect((sender, value) => onOpenRequested(sender, value));

  let handler = (name: string) => {
    return () => {
      var item = dataModel.newFromName(name);
      app.shell.addToMainArea(item);
    }
  }

  let commandItems = [
    { id: 'show:trades', handler: handler('Trades') },
    { id: 'show:positions', handler: handler('Positions') },
    { id: 'show:pnl', handler: handler('PnL') },
    { id: 'show:market_data', handler: handler('MarketData') }
  ];

  let paletteItems = [
    {
      command: 'show:trades',
      text: 'New Trades View',
      caption: 'New dock panel with a trades view',
      category: 'Data'
    },
    {
      command: 'show:positions',
      text: 'New Positions View',
      caption: 'New dock panel with a positions view',
      category: 'Data'
    },
    {
      command: 'show:pnl',
      text: 'New PnL View',
      caption: 'New dock panel with a PnL view',
      category: 'Data'
    },
    {
      command: 'show:market_data',
      text: 'New Market Data View',
      caption: 'New dock panel with a Market Data view',
      category: 'Data'
    }
  ];

  let shortcutItems = [
    {
      sequence: ['Ctrl Shift T'],
      selector: '*',
      command: 'show:trades'
    },
    {
      sequence: ['Ctrl Shift P'],
      selector: '*',
      command: 'show:positions',
    },
    {
      sequence: ['Ctrl Shift P', 'L'],
      selector: '*',
      command: 'show:pnl'
    },
    {
      sequence: ['Ctrl Shift M'],
      selector: '*',
      command: 'show:market_data'
    }
  ];

  app.commands.add(commandItems);
  app.shortcuts.add(shortcutItems);
  app.palette.add(paletteItems);

  app.shell.addToLeftArea(dataBrowser, {rank: 1});

  return Promise.resolve<void>();
}
