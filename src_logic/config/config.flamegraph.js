'use strict';

module.exports = {
    flamegraph: {
        fonttype: 'Verdana'     // font type
        , fontsize: 12            // base text size
        , imagewidth: '100%'          // max width, pixels
        , frameheight: 16.0          // max height is dynamic
        , fontwidth: 0.59          // avg width relative to fontsize
        , minwidth: 0.1           // min function width, pixels
        , countname: 'samples'     // what are the counts in the data?
        , colors: 'hot'         // color theme
        , bgcolor1: '#eeeeee'     // background color gradient start
        , bgcolor2: '#eeeeb0'     // background color gradient stop
        , timemax: Infinity      // (override the) sum of the counts
        , factor: 1             // factor to scale counts by
        , hash: true          // color by function name
        , titletext: 'Flame Graph' // centered heading
        , nametype: 'Function:'   // what are the names in the data?

        // below are not supported at this point
        , palette: false         // if we use consistent palettes (default off)
        , palette_map: {}            // palette map hash
        , pal_file: 'palette.map' // palette map file name

        , removenarrows: true        // removes narrow functions instead of adding a 'hidden' class

        , profile: {
            shortStack: true
            , unresolveds: false
            , v8internals: false
            , v8gc: true
            , sysinternals: false
        }
    }
}