
import {
  ISignal, Signal
} from 'phosphor-signaling';


/**
 * A list of instruments to generate data for.
 */
const INSTS = ['MSFT', 'AAPL', 'IBM', 'BHP', 'JPM', 'BAML'];

/**
 * Number of decimal places to use.
 */
const DP = 2;

/**
 * Right align column definition.
 */
const RIGHT_ALIGN = { 'text-align': 'right' };

/**
 * Pick a random element of an array of strings.
 */
export
function sample(items: string[]): string {
  return items[Math.floor(Math.random() * items.length)];
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

/**
 * The interface that changes to the data will implement.
 */
export
interface IDatum {
  label: string;
  value: number;
}

/**
 * The type used in the signals between data sources.
 *
 * The type is either a trade, or an array of label-data pairs.
 */
type IDelta = ITrade | IDatum[];


/**
 * Column Definition interface.
 */
export
interface IColDef {
  /**
   * The string representation of the column.
   */
  headerName: string;
  /**
   * The attribute name of the row which holds data
   * for this column.
   */
  field: string;
  /**
   * The aggregation function to use.
   */
  aggFunc?: string;
  /**
   * An object containing cell-style information.
   */
  cellStyle?: any;
  /**
   * A string defining 'asc' or 'desc' for ascending / descending.
   */
  sort?: string;
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
  dataUpdated: ISignal<IDataProvider, IDelta>;
  /**
   * The name of this data provider.
   */
  name: string;
  /**
   * TODO : make consistent.
   */
  set_target(item: any): void;
  /**
   * The number of views subscribing to this data.
   */
  subscribers: number;
  /**
   * Subscribe to this data provider.
   */
  subscribe(): void;
  /**
   * Unsubscribe from this data provider.
   */
  unsubscribe(): void;
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
  static dataChangedSignal = new Signal<IDataProvider, IDelta>();

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
    return this._data;
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
   * Subscribe to this data provider.
   */
  subscribe() {
    this.subscribers += 1;
  }

  /**
   * Unsubscribe from this data provider.
   */
  unsubscribe() {
    this.subscribers -= 1;
  }

  /**
   * Set the target Bokeh datasource. If a plot is given, will search the
   * glyphs until it finds one with a data source and then use that.
   * If null is given, uses the single plot in the page (errors if
   * there are multiple plots).
   */
  set_target(obj: Bokeh.Component | Bokeh.ColumnDataSource): void {
     if (obj === null) {
         // Find the one Bokeh plot on the page
         let plot_keys = Object.keys(Bokeh.index);

         if (plot_keys.length == 1) {
             return this.set_target(Bokeh.index[plot_keys[0]].model);
         } else {
             throw new Error("set_target(null) only works if there is exactly one Bokeh plot, found " + plot_keys.length);
         }
     } else if (obj instanceof Bokeh.Plot) {
         // Find a datasource on the plot, assuming all glyphs in the plot share one data source
         for (let r of obj.renderers) {
            if (r instanceof Bokeh.GlyphRenderer) {
                return this.set_target(r.data_source);
            }
         }
     } else if (obj instanceof Bokeh.ColumnDataSource) {
         // Reset current
         if (this._data_source) {
             for (let key in this._data) {
                 if (this._data_source.hasOwnProperty(key)) {
                    this._data_source.data[key] = []
                 }
             }
         }
         // Store
         this._data_source = obj;
         // Reset new
         if (this._data_source) {
             for (let key in this._data) {
                 if (this._data_source.hasOwnProperty(key)) {
                    this._data_source.data[key] = []
                 }
             }
         }
     } else {
         throw new Error("Invalid data source given in set_target(): " + obj);
     }
  }

  private _update_target_data_source(sender: BaseDataProvider, data: any): void {
      if (this._data_source) {
          // XXX: Bokeh.Data needed until TS 2.0
          const to_stream: Bokeh.Data = {t: [Date.now()]};
          for (let data_item of data) {
              const key = data_item.label;
              if (this._data_source.data.hasOwnProperty(key)) {
                 to_stream[key] = [data_item.value];
             }
          }
          this._data_source.stream(to_stream, 100); // todo: how much history?
      }
  }

  /**
   * Returns the item matching the name, or `undefined`.
   */
  protected _find(name: string): any {
    for (let i = 0; i < this._data.length; ++i) {
      if (this._data[i].label === name) {
        return this._data[i];
      }
    }
  }

  name: string = null;
  subscribers = 0;
  protected _data: any = [];
  protected _data_source: Bokeh.ColumnDataSource = null;
  protected _columnHeaders: IColDef[] = [];
}





export
class TradesData extends BaseDataProvider {

  initialise(): void {
    this._columnHeaders = [
      { headerName: 'Id', field: 'ident', cellStyle: RIGHT_ALIGN, sort: 'desc' },
      { headerName: 'Trader', field: 'trader', cellStyle: RIGHT_ALIGN },
      { headerName: 'Inst', field: 'instrument', cellStyle: RIGHT_ALIGN },
      { headerName: 'Qty', field: 'quantity', aggFunc: 'sum', cellStyle: RIGHT_ALIGN },
      { headerName: 'Price', field: 'price', aggFunc: 'sum', cellStyle: RIGHT_ALIGN },
      { headerName: 'Direction', field: 'direction', cellStyle: RIGHT_ALIGN },
      { headerName: 'Book', field: 'book', cellStyle: RIGHT_ALIGN }
    ];
    this._initialiseData();
    setInterval(() => this._generateMultipleUpdates(), 3000);
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
    let pad = new Array(5).join('0');
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
      { headerName: 'Inst', field: 'label', cellStyle: RIGHT_ALIGN },
      { headerName: 'Pos', field: 'value', aggFunc: 'sum', cellStyle: RIGHT_ALIGN }
    ];
    trades.dataUpdated.connect(this._newTrade, this);
  }

  private _newTrade(sender: TradesData, newTrade: any): void {
    let item: IDatum = this._find(newTrade.instrument);
    if (item === undefined) {
      item = { label: newTrade.instrument, value: 0.0 };
      this._data.push(item);
    }

    if (newTrade.direction === 'Buy') {
      item.value += newTrade.quantity;
    } else {
      item.value -= newTrade.quantity;
    }
    item.value = parseFloat(item.value.toFixed(DP));
    this.dataUpdated.emit(this._data);
  }
}

export
class MarketData extends BaseDataProvider {
  constructor(name: string) {
    super(name);
    this._columnHeaders = [
      { headerName: 'Inst', field: 'label', cellStyle: RIGHT_ALIGN },
      { headerName: 'Mkt Data', field: 'value', cellStyle: RIGHT_ALIGN }
    ];
    setInterval(() => this._generateUpdates(), 1250);
  }

  private _generateUpdates(): any {
    let instrument = sample(INSTS);
    let val = (Math.random() * 10) - 5;

    let item = this._find(instrument);
    if (item === undefined) {
      item = { label: instrument, value: 0.0 };
      this._data.push(item);
    }
    item.value += val;
    item.value = parseFloat(item.value.toFixed(DP));
    this.dataUpdated.emit(this._data);
  }
}


export
class PnlData extends BaseDataProvider {
  constructor(name: string, positions: PositionsData, market: MarketData) {
    super(name);
    this._columnHeaders = [
      { headerName: 'Inst', field: 'label', cellStyle: RIGHT_ALIGN },
      { headerName: 'PnL', field: 'value', aggFunc: 'sum', cellStyle: RIGHT_ALIGN }
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
      let posInst = this._pos[pi].label;
      for (let mi = 0; mi < this._mkt.length; ++mi) {
        if (posInst === this._mkt[mi].label) {
          let value = this._pos[pi].value * this._mkt[mi].value;
          value = parseFloat(value.toFixed(DP));
          this._data.push({ label: posInst, value: value });
        }
      }
    }
    this.dataUpdated.emit(this._data);
  }

  private _pos: any = [];
  private _mkt: any = [];
}
