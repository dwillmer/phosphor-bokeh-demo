import {
  ISignal, Signal
} from 'phosphor-signaling';

declare var Bokeh:any;

/**
 * A list of instruments to generate data for.
 */
const INSTS = ['MSFT', 'AAPL', 'IBM', 'BHP', 'JPM', 'BAML'];

/**
 * Pick a random element of an array of strings.
 */
export
function sample(items: string[]): string {
  return items[Math.floor(Math.random() * items.length)];
}


/**
 * Column Definition interface.
 */
export
interface IColDef {
  /**
   * The string representation of the column.
   */
  headerName: string,
  /**
   * The attribute name of the row which holds data
   * for this column.
   */
  field: string
}


/**
 * The interface required by data providers.
 *
 * For this simple data setup, we assume all data sets
 * are tabular.
 */
export
interface IDataProvider {
  /**
   * A read-only handle to the data by row.
   */
  rows(): any;
  /**
   * The column headers in the data set.
   */
  columns(): IColDef[];
  /**
   * The signal emitted when the data is updated.
   */
  dataUpdated: ISignal<IDataProvider, any>;
  /**
   * The name of this data provider.
   */
  name: string;
  /**
   * TODO : make consistent.
   */
  set_target(item: any): void;
}


/**
 * The Base class which provides the basic functionality
 * for data providers.
 *
 * This needs to be subclassed to be useful.
 */
export
class BaseDataProvider implements IDataProvider {
  /**
   * The signal emitted when the data is updated.
   */
  static dataChangedSignal = new Signal<IDataProvider, any>();

  /**
   * Getter for the class static signal.
   *
   * This is what should be used to connect to the signal.
   */
  get dataUpdated(): ISignal<IDataProvider, any> {
    return BaseDataProvider.dataChangedSignal.bind(this);
  }

  /**
   * The number of rows in the data set.
   */
  rows(): any {
    return this._data
  }

  /**
   * The number of columns in the data set.
   *
   * Here we just take the length of the first item,
   * and assume all rows are of the same length.
   */
  columns(): IColDef[] {
    return this._columnHeaders;
  }

  constructor(name: string) {
    this.name = name;
    this.dataUpdated.connect(this._update_target_data_source, this);
  }

  /**
   * Set the target Bokeh datasource. If a plot is given, will search the
   * glyphs until it finds one with a data source and then use that.
   * If null is given, uses the single plot in the page (errors if
   * there are multiple plots).
   */
  set_target(ds: any): void {
     if (ds === null) {
         // Find the one Bokeh plot on the page
         let plot_keys = Object.keys(Bokeh.index);
         if (plot_keys.length == 1) {
             return this.set_target(Bokeh.index[plot_keys[0]]);
         } else {
             throw "set_target(null) only works if there is exactly one Bokeh plot, found " + plot_keys.length;
         }
     } else if (ds.model && ds.model.type == 'Plot') {
         // Find a datasource on the plot, assuming all glyphs in the plot share one data source
         for (var key in ds.renderers) {
            var r = ds.renderers[key];
            if (r && r.mget && r.mget('data_source')) {
                return this.set_target(r.mget('data_source'));
            }
         }
     } else if (ds.stream) {
         // Looks like a datasource
         // Reset current
         if (this._data_source) {
             for (var key in this._data) {
                 if (this._data_source.hasOwnProperty(key)) {
                    this._data_source.get('data')[key] = []
                 }
             }
         }
         // Store
         this._data_source = ds;
         // Reset new
         if (this._data_source) {
             for (var key in this._data) {
                 if (this._data_source.hasOwnProperty(key)) {
                    this._data_source.get('data')[key] = []
                 }
             }
         }
     } else {
         throw "Invalid data source given in set_target(): " + ds;
     }
  }

  private _update_target_data_source(sender: BaseDataProvider, data: any): void {
      if (this._data_source) {
          let data_source_data: any = this._data_source.get('data');
          let data_copy: any = {t: Date.now()};
          for (var key in data) {
             if (data_source_data.hasOwnProperty(key)) {
                 data_copy[key] = data[key];
             }
          }
          this._data_source.stream(data_copy, 100); // todo: how much history?
      }
  }

  /**
   * Returns the item matching the name, or `undefined`.
   */
  protected _find(name: string): any {
    for (let i = 0; i < this._data.length; ++i) {
      if (this._data[i].instrument === name) {
        return this._data[i];
      }
    }
  }

  name: string = null;
  protected _data: any = [];
  protected _data_source: any = null;
  protected _columnHeaders: IColDef[] = [];
}


/**
 * The interface required for a simple Trade object.
 */
export
interface ITrade {
  ident: string;
  trader: string;
  instrument: string;
  quantity: number;
  price: number;
  direction: string;
  book: string;
}


export
class TradesData extends BaseDataProvider {

  initialise(): void {
    this._columnHeaders = [
      { headerName: 'Id', field: 'ident' },
      { headerName: 'Trader', field: 'trader' },
      { headerName: 'Inst', field: 'instrument' },
      { headerName: 'Qty', field: 'quantity' },
      { headerName: 'Price', field: 'price' },
      { headerName: 'Direction', field: 'direction' },
      { headerName: 'Book', field: 'book' }
    ];
    this._initialiseData();
    setInterval(() => this._generateMultipleUpdates(), 1500);
  }

  protected _initialiseData(): void {
    this._data = [
      this._generateUpdates()
    ];
  }

  protected _newTrade(): ITrade {
    return {
      ident: this._newId(),
      trader: sample(this._traders),
      instrument: sample(INSTS),
      quantity: Math.floor(Math.random() * 100),
      price: Math.floor(Math.random() * 10),
      direction: sample(this._directions),
      book: sample(this._books)
    };
  }

  protected _generateMultipleUpdates(): void {
    let n = Math.floor(Math.random() * 3);
    for (let i = 0; i < n; ++i) {
      this._generateUpdates();
    }
  }

  protected _generateUpdates(): any {
    var trade = this._newTrade();
    this._data.push(trade);
    this.dataUpdated.emit(trade);
    return trade;
  }

  private _newId(): string {
    var pad = new Array(4).join('0');
    return 'Id_' + (pad + this._data.length).slice(-pad.length);
  }

  private _traders: string[] = ['Bob', 'Alice', 'Geoff', 'Gertrude'];
  private _directions: string[] = ['Buy', 'Sell'];
  private _books: string[] = ['A', 'B', 'C', 'D'];
}


/**
 * Now stores the positions as an array of objects:
 * [ {instrument: 'MSFT', position: 101.0}, ...]
 * this makes life easier when interfacing with
 * various grid libraries.
 */
export
class PositionsData extends BaseDataProvider {
  constructor(name: string, trades: TradesData) {
    super(name);
    this._columnHeaders = [
      { headerName: 'Inst', field: 'instrument' },
      { headerName: 'Pos', field: 'position'}
    ];
    trades.dataUpdated.connect(this._newTrade, this);
  }

  private _newTrade(sender: TradesData, value: any): void {
    let item = this._find(value.instrument);
    if (item === undefined) {
      item = { instrument: value.instrument, position: 0.0 };
      this._data.push(item);
    }

    if (value.direction === 'Buy') {
      item.position += value.quantity;
    } else {
      item.position -= value.quantity;
    }
    this.dataUpdated.emit(this._data);
  }
}

export
class MarketData extends BaseDataProvider {
  constructor(name: string) {
    super(name);
    this._columnHeaders = [
      { headerName: 'Inst', field: 'instrument' },
      { headerName: 'Mkt Data', field: 'data' }
    ];
    setInterval(() => this._generateUpdates(), 1250);
  }

  private _generateUpdates(): any {
    var instrument = sample(INSTS);
    var value = (Math.random() * 10) - 5;

    let item = this._find(instrument);
    if (item === undefined) {
      item = { instrument: instrument, data: 0.0 };
      this._data.push(item);
    }
    item.data += value;
    this.dataUpdated.emit(this._data);
  }
}


export
class PnlData extends BaseDataProvider {
  constructor(name: string, positions: PositionsData, market: MarketData) {
    super(name);
    this._columnHeaders = [
      { headerName: 'Inst', field: 'instrument' },
      { headerName: 'PnL', field: 'pnl' }
    ];
    positions.dataUpdated.connect(this._positionsUpdate, this);
    market.dataUpdated.connect(this._marketDataUpdate, this);
  }

  private _positionsUpdate(sender: PositionsData, value: any) {
    this._pos = value;
    this._recalculate();
  }

  private _marketDataUpdate(sender: MarketData, value: any) {
    this._mkt = value;
    this._recalculate();
  }

  private _recalculate(): void {

    this._data = [];
    for (let pi = 0; pi < this._pos.length; ++pi) {
      let posInst = this._pos[pi].instrument;
      for (let mi = 0; mi < this._mkt.length; ++mi) {
        if (posInst === this._mkt[mi].instrument) {
          let value = this._pos[pi].position * this._mkt[mi].data;
          this._data.push({ instrument: posInst, pnl: value });
        }
      }
    }
    this.dataUpdated.emit(this._data);
  }

  private _pos: any = [];
  private _mkt: any = [];
}
