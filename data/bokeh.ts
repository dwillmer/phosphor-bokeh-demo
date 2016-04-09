export function bokeh_make_plot(title: string, source?: Bokeh.ColumnDataSource): Bokeh.Plot {
    // Create plot
    const plot = Bokeh.Plotting.figure({
        tools: "pan,wheel_zoom,box_select,reset",
        title: title,
        plot_width: 400,
        plot_height: 400,
        background_fill_color: "#eeeeff",
    });

    // Add axis and grid
    const xaxis = new Bokeh.DatetimeAxis({axis_line_color: null, axis_label: 'time'});
    const yaxis = new Bokeh.LinearAxis({axis_line_color: null, axis_label: 'price'});
    plot.add_layout(xaxis, "below");
    plot.add_layout(yaxis, "left");
    plot.add_layout(new Bokeh.Grid({ticker: xaxis.ticker, dimension: 0}));
    plot.add_layout(new Bokeh.Grid({ticker: yaxis.ticker, dimension: 1}));

    // Get or create source
    if (!source) {
        source = new Bokeh.ColumnDataSource({data: {t:[1,2,3,4,5,6], foo:[4,5,6,3,6,2]}});
    }

    // Add a line for each entry in the source
    const colors = ['#aa0000','#00aa00', '#0000aa', '#aaaa00', '#aa00aa', '#00aaaa'];
    let i = -1;
    for (let key in source.data) {
        if (key != 't') {
            i += 1;
            plot.line({field: 't'}, {field: key},
                      {source: source, legend: key, line_color: colors[i%6], line_width: 2});
        }
    }

    return plot;
}
