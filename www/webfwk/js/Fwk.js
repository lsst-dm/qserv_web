define([
    'webfwk/Class',
    'webfwk/CSSLoader' ,
    'webfwk/FwkApplication',
    'underscore'],

function(Class,
         CSSLoader,
         FwkApplication) {

    CSSLoader.load('webfwk/css/Fwk.css');

    /**
     * Extend class Date with a method returning a local time as a string of
     * the following format:
     *
     *   2018-NOV-30  10:12:22
     *
     * @returns {String}
     */
    Date.prototype.toLocalTimeString = function() {
        if (this.pad == undefined) {
            this.pad = function(v)  {
                return v < 10 ? '0' + v : '' + v;
            };
        }
        if (this.month2str == undefined) {
            this.month2str = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
        }
        return '' + this.getFullYear() + '-' + this.month2str[this.getMonth()] + '-' + this.pad(this.getDate()) + '&nbsp;&nbsp;' +
               this.pad(this.getHours()) + ':' + this.pad(this.getMinutes()) + ':' + this.pad(this.getSeconds());
    };

    
    /**
     * The main class of the framework
     *
     * @returns {FwkL#7.FwkCreator}
     */
    function FwkCreator() {

        var _that = this;

        /**
         * Return the current time info
         *
         * @returns {object}
         */
        this.now = function () {
            var date = new Date();
            var msec = date.getTime();
            return { date: date, sec: Math.floor(msec/1000), msec: msec % 1000 }; 
        };

        /// A catalog of applications to be populated by method FwkCreator.build()
        this._apps = {
            current: 0
        };

        /*
         * This method will initialize DOM and setup handlers based on the following
         * (sample) catalog of applications passed as parameter 'apps':
         *
         *  @code
         *  [
         *      {   name: 'Status',
         *           apps: [
         *              new TestApp('Replication Level'),
         *              new TestApp('Workers'),
         *              new TestApp('User Queries'),
         *              new TestApp('Heat Map')
         *          ]
         *      },
         *
         *      new TestApp('Replication'),
         *      new TestApp('Ingest'),
         *
         *      {   name: 'UI Tests',
         *          apps: [
         *              new TestApp('SimpleTable'),
         *              new TestApp('SmartTabble')
         *          ]
         *      }
         *  ]
         *  @code
         *
         * This definition will result in the following internal structure:
         *
         *  @code
         *  {
         *      current: 0,
         *      0: {
         *          name: 'Status',
         *          current: 0,
         *          0:  new TestApp('Replication Level'),
         *          1:  new TestApp('Workers'),
         *          2:  new TestApp('User Queries'),
         *          3:  new TestApp('Heat Map')
         *      },
         *      1:  new TestApp('Replication'),
         *      2:  new TestApp('Ingest'),
         *      3: {
         *          name: 'UI Tests',
         *          current: 0,
         *          0: new TestApp('SimpleTable'),
         *          1: new TestApp('SmartTabble')
         *      }
         *  }
         *  @code        
         */
        this.build = function(name, apps, on_init) {

        // Generate top-level menus
        //
        // NOTE: assume the very first application is selected by default.
        // This may be replaced with an explicit initialization in the future.

        var html =
'<nav class="navbar navbar-expand-lg navbar-dark bg-primary sticky-top">' +
'  <a class="navbar-brand" href="#" >' + name + '</a>' +
'  <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#fwk-navbarSupportedContent"' +
'          aria-controls="fwk-navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">' +
'    <span class="navbar-toggler-icon"></span>' +
'  </button>' +
'  <div class="collapse navbar-collapse" id="fwk-navbarSupportedContent">' +
'    <ul class="navbar-nav mr-auto nav" role="tablist">';

            for (var idx1 in apps) {
                var app1 = apps[idx1];
                html +=
'      <li class="nav-item">' +
'        <a class="fwk-nav-1 nav-link ' + (idx1 == 0 ? 'active' : '') + '"' +
'           name="' + idx1 + '"' +
'           id="fwk-tab-' + idx1 + '"' +
'           data-toggle="tab"' +
'           href="#fwk-' + idx1 + '"' +
'           role="tab"' +
'           aria-controls="fwk-' + idx1 + '"' +
'           aria-selected="' + (idx1 == 0 ? 'true' : 'false') + '"' +
'           >' + app1.name + '</a>' +
'      </li>';
                if (app1 instanceof FwkApplication) {
                    this._apps[idx1] = app1;
                } else {
                    this._apps[idx1] = {
                        name:    app1.name,
                        current: 0
                    };
                    for (var idx2 in app1.apps) {
                        var app2 = app1.apps[idx2];
                        this._apps[idx1][idx2] = app2;
                    }
                }
            }
            html +=
'    </ul>' +
'    <form class="form-inline my-2 my-lg-0">' +
'      <input class="form-control mr-sm-2 form-control-sm" type="search" placeholder="chunk" aria-label="Search"/>' +
'      <button class="btn btn-outline-light my-2 my-sm-0 btn-sm" type="submit">Search</button>' +
'    </form>' +
'  </div>' +
'</nav>';

            // Generate the applicaton content areas and second-level menus (if any)

            html +=
'<div class="tab-content" id="fwk-nav-tabContent">';

            for (var idx1 in apps) {
                var app1 = apps[idx1];
                html +=
'  <div class="fwk-cont tab-pane fade ' + (idx1 == 0 ? 'show active' : '') + '"' +
'       id="fwk-' + idx1 + '"' +
'       role="tabpanel"' +
'       aria-labelledby="fwk-tab-' + idx1 + '">';
                if (app1 instanceof FwkApplication) {
                    html +=
'    <div class="container-fluid"' +
'         id="fwk-' + idx1 + '-cont">' +
'      Here be the content of: ' + app1.name +
'    </div>';
                } else {
                    html +=
'    <ul class="nav nav-pills mb-0" id="fwk-' + idx1 + '-tab" role="tablist">';
                    for (var idx2 in app1.apps) {
                        var app2 = app1.apps[idx2];
                        html +=
'      <li class="nav-item">' +
'        <a class="fwk-nav-2 nav-link ' + (idx2 == 0 ? 'show active' : '') + '"' +
'           name="' + idx2 + '"' +
'           id="fwk-' + idx1 + '-' + idx2 + '-tab" data-toggle="pill"' +
'           href="#fwk-' + idx1 + '-' + idx2 + '" role="tab"' +
'           aria-controls="fwk-' + idx1 + '-' + idx2 + '" aria-selected="true">' + app2.name + '</a>' +
'      </li>';
                    }
                    html +=
'    </ul>' +
'    <div class="tab-content" id="fwk-' + idx1 + '-tabContent">';
                    for (var idx2 in app1.apps) {
                        var app2 = app1.apps[idx2];
                        html +=
'      <div class="tab-pane fade ' + (idx2 == 0 ? 'show active' : '') + '" id="fwk-' + idx1 + '-' + idx2 + '"' +
'           role="tabpanel" aria-labelledby="fwk-' + idx1 + '-' + idx2 + '-tab">' +
'        <div class="container-fluid" style="padding-top:1em;" id="fwk-' + idx1 + '-' + idx2 + '-cont">' +
'          Here be the content of: ' + app2.name +
'        </div>' +
'      </div>';
                    }
                    html +=
'    </div>';
                }
                html +=
'  </div>';
            }
            html +=
'</div>';
            // Render this before finalizing the applications' setup
            $('body').html(html);

            // Setup containers or each applications. This can be done only
            // after rendering the initial layout.
            for (var idx1 in apps) {
                var app1 = apps[idx1];
                if (app1 instanceof FwkApplication) {
                    app1.container =$('#fwk-' + idx1 + '-cont');
                } else {
                    for (var idx2 in app1.apps) {
                        var app2 = app1.apps[idx2];
                        app2.container = $('#fwk-' + idx1 + '-' + idx2 + '-cont');
                    }
                }
            }

            // Set up event handlers for menus
            $('a.fwk-nav-1').on('click', function (e) {

                var from = _that._apps.current;
                var to   = $(e.currentTarget).attr('name');

                if (_that._apps[from] instanceof FwkApplication)
                    _that._apps[from].hide();
                else
                    _that._apps[from][_that._apps[from].current].hide();

                if (_that._apps[to] instanceof FwkApplication)
                    _that._apps[to].show();
                else
                    _that._apps[to][_that._apps[to  ].current].show();

                _that._apps.current = to;
            });
            $('a.fwk-nav-2').on('click', function (e) {

                var from = _that._apps[_that._apps.current].current;
                var to   = $(e.currentTarget).attr('name');

                if (to != from) {
                    _that._apps[_that._apps.current][from].hide();
                    _that._apps[_that._apps.current][to  ].show();
                    _that._apps[_that._apps.current].current = to;
                }
            });
            on_init();
        };
        
        /**
         * Switch to the specified application
         *
         * @param cxt1  level-1 menu context name
         * @param cxt2  (optional) level-2 menu context name
         */
        this.show = function(cxt1, cxt2) {
            for (var k1 in this._apps) {
                var v1 = this._apps[k1];
                if (v1 instanceof FwkApplication) {
                    if (v1.name === cxt1) {
                        // Activate Level-1 application
                        $('a#fwk-tab-'+k1).tab('show');
                        v1.show();
                        return;
                    }
                } else if (_.isObject(v1)) {
                    for (var k2 in v1) {
                        var v2 = v1[k2];
                        if (v2 instanceof FwkApplication) {
                            if (v2.name === cxt2) {
                                // Activate Level-2 application
                                $('a#fwk-'+k1+'-'+k2+'-tab').tab('show');
                                v2.show();
                                return;
                            }
                        }
                    }
                }
            }
        };

        /**
         * Put the current local time at the specified element
         
         * @param obj  JQuery element where the update string be placed
         */
        this.setLastUpdate = function(obj) {
            var now = (new Date(Date.now())).toLocalTimeString();
            obj.html('Updated:&nbsp;<span style="text-weight:bold; color:maroon;">'+now+'</span>');
        };

        /**
         * The default error reporting interface
         *
         * @param message  a message to be reported
         */
        function report_error(message) {
            console.log(message);
            alert(message);
        }
        
        /**
         * Initiate an asynchronous GET request
         *
         * @param url         the GET request
         * @param params      (optinal) dictionary of parameters to be sent to a server
         * @param on_success  (opional) callback function to be called on success
         * @param on_failure  (opional) callback function to be called on errors
         */
        this.web_service_GET = function (url, params, on_success, on_failure) {
            var jqXHR = $.get(url, params, function(data) {
                if (on_success) on_success(data);
            },
            'JSON').fail(function() {
                var message = 'Web service request to '+url+' failed because of:' + jqXHR.statusText;
                if (on_failure) on_failure(message);
                else            report_error(message);
            });
        };


        /* -----------------------------
         *   APPLICATIONS UPDATE TIMER
         * -----------------------------
         */

        this._update_timer = null;

        this.on_update = function() {            
            for (var k1 in this._apps) {
                var v1 = this._apps[k1];
                if (v1 instanceof FwkApplication) {
                    // Level 1 application
                    v1.update();
                } else if (_.isObject(v1)) {
                    for (var k2 in v1) {
                        var v2 = v1[k2];
                        if (v2 instanceof FwkApplication) {
                            // Level 2 application
                            v2.update();
                        }
                    }
                }
            }
        };

        this._update_timer_restart = function() {
            if (this.on_update) {
                this._update_timer = window.setTimeout('Fwk._update_timer_event()', 1000);
            }
        };

        /*
         * Process an event. Do not notify subscribers at the first invocation.
         *
         * @returns {undefined}
         */
        this._update_timer_event = function() {
            this.on_update();
            this._update_timer_restart();
        };
    }

    /* ATTENTION: This will only create an instance of the framework. No actions
     * or DOM modifications will be taken until it's finally built and activated.
     * 
     * Also register the instance in the global scope. Note that this may
     * be reconsidered in the future.
     */
    if (!window.Fwk) window.Fwk = new FwkCreator();

    return window.Fwk;
});
