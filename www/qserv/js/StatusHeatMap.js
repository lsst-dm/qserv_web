define([
    'webfwk/Class',
    'webfwk/CSSLoader',
    'webfwk/FwkApplication',
    'underscore'],

function(Class,
         CSSLoader,
         FwkApplication) {

    CSSLoader.load('qserv/css/StatusHeatMap.css');

    function StatusHeatMap(name) {

        var _that = this;

        // Allways call the base class's constructor
        FwkApplication.call(this, name);

        /**
         * Override event handler defined in the base class
         *
         * @see FwkApplication.fwk_app_on_show
         */
        this.fwk_app_on_show = function() {
            console.log('show: ' + this.fwk_app_name);
            this.fwk_app_on_update();
        };

        this.fwk_app_on_hide = function() {
            console.log('hide: ' + this.fwk_app_name);
        };

        // Automatically refresh the page at specified interval only

        this._update_ival_sec = 1;
        this._prev_update_sec = 0;

        this.fwk_app_on_update = function() {
            if (this.fwk_app_visible) {
                var now_sec = Fwk.now().sec;
                if (now_sec - this._prev_update_sec > this._update_ival_sec) {
                    this._prev_update_sec = now_sec;
                    this._init();
                    this._load();
                }
            }
        };

        this._initialized = false;
        this._init = function() {
            if (this._initialized) return;
            this._initialized = true;

            this._WIDTH  = window.innerWidth  -  60;
            this._HEIGHT = window.innerHeight - 140;

            var html = `
<canvas id="fwk-status-heatmap" width="`+this._WIDTH+`" height="`+this._HEIGHT+`"></canvas>`;
            this.fwk_app_container.html(html);
        };
        
        this._context_obj = null;
        this._context = function() {
            if (!this._context_obj) {
                this._context_obj = this.fwk_app_container.find('canvas#fwk-status-heatmap')[0].getContext('2d');
            }
            return this._context_obj;
        };

        this._loading = false;
        this._load = function() {

            if (this._loading) return;
            this._loading = true;

            var c = this._context();

            c.clearRect(0, 0, this._WIDTH, this._HEIGHT);
            c.font = '28pt Calibri';
            c.fillStyle = 'black';
            c.fillText('Hammer-Aitoff projection', 850, 60);

            c.beginPath();
            c.moveTo(250*-2.25 + 600, 768 - (250*0. + 425));
            c.lineTo(250* 2.25 + 600, 768 - (250*0. + 425));
            c.lineWidth = 1;
            c.strokeStyle = 'grey';
            c.stroke();

            var lon_min = -180.,
                lon_max =  180.,
                lat_min =  -90.,
                lat_max =   90.;

            var prev_coord_x = undefined,
                prev_coord_y = undefined;

            for (var lat = lat_min; lat <= lat_max; lat += 5.) {
                var rad_lat = lat * Math.PI / 180.;
                for (var lon = lon_min; lon <= lon_max; lon += 10.) {
                    var rad_lon = lon * Math.PI /180.;
                    var common_denominator = Math.sqrt(1. + Math.cos(rad_lat) * Math.cos(rad_lon / 2.));
                    var x = 2. * Math.cos(rad_lat) * Math.sin(rad_lon / 2.) / common_denominator;
                    var y =      Math.sin(rad_lat)                          / common_denominator;

                    var coord_x = 250*x + 600,
                        coord_y = 768 - (250*y + 425);

                    c.beginPath();
                    c.moveTo(coord_x - 1, coord_y);
                    c.lineTo(coord_x + 1, coord_y);
                    c.stroke();

                    if (!_.isUndefined(prev_coord_x)) {
                        c.beginPath();
                        c.moveTo(coord_x,      coord_y);
                        c.lineTo(prev_coord_x, prev_coord_y);
                        c.stroke();
                    }
                    prev_coord_x = coord_x;
                    prev_coord_y = coord_y;
                }
                prev_coord_x = undefined,
                prev_coord_y = undefined;
            }
            for (var lon = lon_min; lon <= lon_max; lon += 10.) {
                var rad_lon = lon * Math.PI /180.;
                for (var lat = lat_min; lat <= lat_max; lat += 5.) {
                    var rad_lat = lat * Math.PI / 180.;
                    var common_denominator = Math.sqrt(1. + Math.cos(rad_lat) * Math.cos(rad_lon / 2.));
                    var x = 2. * Math.cos(rad_lat) * Math.sin(rad_lon / 2.) / common_denominator;
                    var y =      Math.sin(rad_lat)                          / common_denominator;

                    var coord_x = 250*x + 600,
                        coord_y = 768 - (250*y + 425);

                    c.beginPath();
                    c.moveTo(coord_x - 1, coord_y);
                    c.lineTo(coord_x + 1, coord_y);
                    c.stroke();

                    if (!_.isUndefined(prev_coord_x)) {
                        c.beginPath();
                        c.moveTo(coord_x,      coord_y);
                        c.lineTo(prev_coord_x, prev_coord_y);
                        c.stroke();
                    }
                    prev_coord_x = coord_x;
                    prev_coord_y = coord_y;
                }
                prev_coord_x = undefined,
                prev_coord_y = undefined;
            }
            this._loading = false;
        };
    }
    Class.define_class(StatusHeatMap, FwkApplication, {}, {});

    return StatusHeatMap;
});
