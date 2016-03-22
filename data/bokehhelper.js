var bokeh_make_plot = function(opts, vw) {
    window.vw = vw;  // debug
     
    _ = Bokeh.require('underscore');
    function _create_view(model) {
        view = new model.default_view({model: model});
        base.index[model.id] = view;
        return view;
    }
    function add_glyphs (plot, sources, glyphs) {
        glyphs = _process_glyphs(glyphs, sources);
        plot.add_renderers(glyphs);
    }
    function add_tools (plot, tools) {
        tool_objs = []
        for (var i=0; i < tools.length; i++) {
            tool_obj = base.Collections(tools[i] + "Tool").create({plot: plot})
            tool_objs.push(tool_obj)
        }        
        plot.set('tools', tool_objs);
        plot.get('tool_manager').set('tools', tools);
        plot.get('tool_manager')._init_tools();        
    }
    function _get_sources (sources, glyph_source) {
        if (glyph_source && glyph_source.type == 'ColumnDataSource') { return glyph_source; }
        if (_.isString(glyph_source)) { return sources[glyph_source]; }
        return base.Collections("ColumnDataSource").create({data: glyph_source})
    }    
    function _process_glyphs (glyphs, sources) {
        renderers = []

        for (var i=0; i<glyphs.length; i++) {
            glyph = glyphs[i];
            glyph_type = glyph.type;
            source = _get_sources(sources, glyph.source);

            glyph_args = _.omit(glyph, 'source', 'selection', 'inspection', 'nonselection');
            glyph_obj = base.Collections(glyph_type).create(glyph_args);

            renderer_args = {data_source: source,  glyph: glyph_obj};
            
            xx = ['selection', 'inspection', 'nonselection'];
            for (var j=0; j<xx.length; j++) {
                x = xx[j]; 
                if (glyph[x]) {
                    //# TODO: (bev) accept existing glyphs
                    //# TODO: (bev) accept glyph mod functions
                    if (glyph[x].type) {
                         x_args = _.omit(glyph[x], 'type')
                         x_obj = base.Collections(glyph[x].type).create(x_args)
                    } else {
                        x_obj = _.clone(glyph_obj)
                        x_obj.set(glyph[x])
                    }
                    renderer_args[x] = x_obj
                }
            }
            renderer = base.Collections("GlyphRenderer").create(renderer_args)
            renderers.push(renderer)
        }
        return renderers;
    }
    
    // Import base so we can instantiate backbone models
    base = Bokeh.require('base');
    
    // Create plot
    options = options = {};    
    options.title = opts['title'];
    options.responsive = false;  // we resize the plot
    options.x_range = base.Collections("DataRange1d").create({});
    options.y_range = base.Collections("DataRange1d").create({});
    plot_model = base.Collections('Plot').create(options);
    
    // Get or create source
    source = opts.source;
    if (!source) {source = bokeh_make_source({t:[1,2,3,4,5,6], foo:[4,5,6,3,6,2]});}
    
    // Create lines and add to plot
    var colors = ['#aa0000','#00aa00', '#0000aa', '#aaaa00', '#aa00aa', '#00aaaa']; 
    var lines = [];
    var i = -1;
    for (key in source.get('data')) {
        if (key != 'x') {
            i += 1;
            lines.push({type:'Line', x:{field:'t'}, y:{field:key}, source: source,
                        line_color: colors[i%6], line_width: 2});
        }
    }
    add_glyphs(plot_model, [source], lines);   
    
    // Add tools --- DOES NOT WORK
    add_tools(plot_model, ['Pan', 'BoxSelect', 'WheelZoom']);
    
    // Set plot on ranges, so they are aware of renderes so they can determine bounds
    options.x_range.set('plots', []);
    options.y_range.set('plots', []);
    options.x_range.set('plots', [plot_model]);
    options.y_range.set('plots', [plot_model]);
    
    // Attach the plot canvas to DOM
    plot = _create_view(plot_model);
    
    // For debugging
    window.options = options;
    window.plot = plot;
    window.source = source;    
    window.lines = lines;
    return plot;
}

function bokeh_make_source (data) {
    base = Bokeh.require('base');
    return base.Collections("ColumnDataSource").create({data: data});
}
