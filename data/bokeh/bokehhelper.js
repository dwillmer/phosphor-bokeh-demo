var bokeh_make_plot = function(opts) {
         
    _ = Bokeh.require('underscore');
    function _create_view(model) {
        view = new model.default_view({model: model});
        Bokeh.index[model.id] = view;
        return view;
    }
    function add_layout(plot, renderer, place) {
        if (typeof place === 'undefined') {place = 'center';}
        if (renderer.props().plot !== undefined) {
            renderer.set('plot', plot);
        }
        plot.add_renderers([renderer]);
        if (place != 'center') {
            plot.set(place, plot.get(place).concat([renderer]));
        }
    }    
    function add_glyph(plot, glyph, source) {
        var renderer = Bokeh.Collections('GlyphRenderer').create({data_source: source, glyph: glyph});
        plot.add_renderers([renderer]);
        return renderer;
    }
    function add_tools(plot, tools) {
        for (var i=0; i<tools.length; i++) {
            var tool = tools[i];
            tool.set('plot', plot);            
        }
        plot.set("tools", plot.get("tools").concat(tools));
        // TODO: tools not shown: need more?
    }
            
    // Create plot
    options = options = {};    
    options.title = opts['title'];
    options.responsive = false;  // we resize the plot
    options.x_range = Bokeh.Collections("DataRange1d").create({});
    options.y_range = Bokeh.Collections("DataRange1d").create({});
    options.background_fill_color = "#eeeeff";
    plot = Bokeh.Collections('Plot').create(options);
    
    // Axis and grid
    var xaxis = Bokeh.Collections('DatetimeAxis').create({axis_line_color: null});
    var yaxis = Bokeh.Collections('LinearAxis').create({axis_line_color: null});
    add_layout(plot, xaxis, 'below');
    add_layout(plot, yaxis, 'left');
    var xgrid = Bokeh.Collections('Grid').create({ticker: xaxis.get('ticker'), dimension: 0});
    var ygrid = Bokeh.Collections('Grid').create({ticker: yaxis.get('ticker'), dimension: 1});
    add_layout(plot, xgrid);
    add_layout(plot, ygrid);
    
    // Get or create source
    source = opts.source;
    if (!source) {source = bokeh_make_source({t:[1,2,3,4,5,6], foo:[4,5,6,3,6,2]});}
    
    // Create lines and add to plot
    var colors = ['#aa0000','#00aa00', '#0000aa', '#aaaa00', '#aa00aa', '#00aaaa']; 
    var lines = [];
    var i = -1;
    for (key in source.get('data')) {
        if (key != 't') {
            i += 1;
            var line = Bokeh.Collections('Line').create({x:{field:'t'}, y:{field:key},
                                                         line_color: colors[i%6], line_width: 2});
            lines.push(line);
            add_glyph(plot, line, source);
        }
    }

    // Add tools
    var tools = ['Pan', 'BoxSelect', 'WheelZoom'];
    for (var i=0; i<tools.length; i++) {
        tools[i] = Bokeh.Collections(tools[i] + 'Tool').create({plot: plot});
    }
    add_tools(plot, tools);

    // Set plot on ranges, so they are aware of renderes so they can determine bounds
    options.x_range.set('plots', []);
    options.y_range.set('plots', []);
    options.x_range.set('plots', [plot]);
    options.y_range.set('plots', [plot]);
    
    // Attach the plot canvas to DOM
    plot_view = _create_view(plot);
    
    // For debugging
    window.options = options;
    window.plot = plot_view;
    window.source = source;    
    window.lines = lines;
    return plot_view;
}

function bokeh_make_source (data) {
    return Bokeh.Collections("ColumnDataSource").create({data: data});
}
