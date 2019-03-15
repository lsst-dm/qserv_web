define([
    'webfwk/CSSLoader',
    'webfwk/Fwk',
    'webfwk/FwkApplication',
    'underscore'],

function(CSSLoader,
         Fwk,
         FwkApplication) {

    CSSLoader.load('qserv/css/StatusHeatMap.css');

    class StatusHeatMap extends FwkApplication {

        /**
         * @returns the default update interval for the page
         */ 
        static update_ival_sec() { return 1; }

        constructor(name) {
            super(name);
        }

        /**
         * Override event handler defined in the base class
         *
         * @see FwkApplication.fwk_app_on_show
         */
        fwk_app_on_show() {
            console.log('show: ' + this.fwk_app_name);
            this.fwk_app_on_update();
        }

        /**
         * Override event handler defined in the base class
         *
         * @see FwkApplication.fwk_app_on_hide
         */
        fwk_app_on_hide() {
            console.log('hide: ' + this.fwk_app_name);
        }

        /**
         * Override event handler defined in the base class
         *
         * @see FwkApplication.fwk_app_on_update
         */
        fwk_app_on_update() {
            if (this.fwk_app_visible) {
                if (this._prev_update_sec === undefined) {
                    this._prev_update_sec = 0;
                }
                let now_sec = Fwk.now().sec;
                if (now_sec - this._prev_update_sec > StatusHeatMap.update_ival_sec()) {
                    this._prev_update_sec = now_sec;
                    this._init();
                    this._load();
                }
            }
        }

        /**
         * The first time initialization of the page's layout
         */
        _init() {
            if (this._initialized === undefined) {
                this._initialized = false;
            }
            if (this._initialized) return;
            this._initialized = true;

            this._WIDTH  = window.innerWidth  -  60;
            this._HEIGHT = window.innerHeight - 140;

            let html = `
<canvas id="fwk-status-heatmap" width="`+this._WIDTH+`" height="`+this._HEIGHT+`"></canvas>`;
            this.fwk_app_container.html(html);
        }

        /**
         * 
         * @returns JQuery object for the 2D drawing context
         */
        _context() {
            if (this._context_obj === undefined) {
                this._context_obj = this.fwk_app_container.find('canvas#fwk-status-heatmap')[0].getContext('2d');
            }
            return this._context_obj;
        }

         /**
         * Load data from a web servie then render it to the application's
         * page.
         */
       _load() {

            if (this._loading === undefined) {
                this._loading = false;
            }
            if (this._loading) return;
            this._loading = true;

            let c = this._context();

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

            let lon_min = -180.,
                lon_max =  180.,
                lat_min =  -90.,
                lat_max =   90.;

            let prev_coord_x = undefined,
                prev_coord_y = undefined;

            for (let lat = lat_min; lat <= lat_max; lat += 5.) {
                let rad_lat = lat * Math.PI / 180.;
                for (let lon = lon_min; lon <= lon_max; lon += 10.) {
                    let rad_lon = lon * Math.PI /180.;
                    let common_denominator = Math.sqrt(1. + Math.cos(rad_lat) * Math.cos(rad_lon / 2.));
                    let x = 2. * Math.cos(rad_lat) * Math.sin(rad_lon / 2.) / common_denominator;
                    let y =      Math.sin(rad_lat)                          / common_denominator;

                    let coord_x = 250*x + 600,
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
            for (let lon = lon_min; lon <= lon_max; lon += 10.) {
                let rad_lon = lon * Math.PI /180.;
                for (let lat = lat_min; lat <= lat_max; lat += 5.) {
                    let rad_lat = lat * Math.PI / 180.;
                    let common_denominator = Math.sqrt(1. + Math.cos(rad_lat) * Math.cos(rad_lon / 2.));
                    let x = 2. * Math.cos(rad_lat) * Math.sin(rad_lon / 2.) / common_denominator;
                    let y =      Math.sin(rad_lat)                          / common_denominator;

                    let coord_x = 250*x + 600,
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
        }
    }
    return StatusHeatMap;
});
