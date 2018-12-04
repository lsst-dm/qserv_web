define([
    'webfwk/Class',
    'webfwk/CSSLoader',
    'webfwk/FwkApplication',
    'underscore'],

function(Class,
         CSSLoader,
         FwkApplication) {

    CSSLoader.load('qserv/css/StatusWorkers.css');

    function StatusWorkers(name) {

        var _that = this;

        // Allways call the base class's constructor
        FwkApplication.call(this, name);

        /**
         * Override event handler defined in the base class
         *
         * @see FwkApplication.on_show
         */
        this.on_show = function() {
            console.log('show: ' + this.name);
            this.on_update();
        };

        this.on_hide = function() {
            console.log('hide: ' + this.name);
        };

        // Automatically refresh the page at specified interval only

        this._update_ival_sec = 10;
        this._prev_update_sec = 0;

        this.on_update = function() {
            if (this.visible) {
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
            var html =
'<div class="row">' +
'  <div class="col-md-4">' +
'    <p>This dynamically updated table shows the status of <span style="font-weight:bold;">Worker</span>' +
'      services in each category. A <span style="font-weight:bold;">Qserv</span> worker' +
'      is supposed to be <span style="font-weight:bold;">OFF-LINE</span> if no response is' +
'      received from the worker during the most recent <span style="font-weight:bold;">Health Monitoring probe</span>.' +
'      In that case a non-zero value (the number of seconds) would be show in column' +
'      <span style="font-weight:bold;">Last Response</span>.' +
'      The state of the <span style="font-weight:bold;">Replication System</span>\'s workers' +
'      is a bit more complex. Workers in this category can be in one of the following' +
'      states: <span style="font-weight:bold;">ENABLED</span>,' +
'      <span style="font-weight:bold;">READ-ONLY</span>, or <span style="font-weight:bold;">DISABLED</span>.' +
'      Note that the <span style="font-weight:bold;">Last Response</span> tracking for this type of' +
'      workers is done in the first two categories only.' +
'      Regardless of a status (or a response delay) of a worker, a number shown in the' +
'      <span style="font-weight:bold;">#replicas</span> column will indicate either the actual number' +
'      of replicas on the corresponding node, or the latest recorded number obtained from the last recorded scan' +
'      of the worker node made by the <span style="font-weight:bold;">Replication System</span> before' +
'      the worker service became non-responsive.' +
'    </p>' +
'  </div>' +
'  <div class="col-md-8">' +
'    <table class="table table-sm table-hover table-bordered" id="fwk-status-workers">' +
'      <caption style="caption-side:top; text-align:right;">' +
'        Loading...' +
'      </caption>' +
'      <thead class="thead-light">' +
'        <tr>' +
'          <th rowspan="2" style="vertical-align:middle;">Worker</th>' +
'          <th rowspan="2" style="vertical-align:middle; text-align:right;">#replicas</th>' +
'          <th colspan="2" style="text-align:right">Qserv</th>' +
'          <th colspan="2" style="text-align:right">Replication Sys.</th>' +
'        </tr>' +
'        <tr>' +
'          <th style="text-align:right">Status</th>' +
'          <th style="text-align:right">Last Response [s]</th>' +
'          <th style="text-align:right">Status</th>' +
'          <th style="text-align:right">Last Response [s]</th>' +
'        </tr>' +
'      </thead>' +
'      <tbody></tbody>' +
'    </table>' +
'  </div>' +
'</div>';
            this.container.html(html);
        };
        
        this._table_obj = null;
        this._table = function() {
            if (!this._table_obj) {
                this._table_obj = this.container.find('table#fwk-status-workers');
            }
            return this._table_obj;
        };

        this._loading = false;
        this._load = function() {

            if (this._loading) return;
            this._loading = true;

            this._table().children('caption').html('Updating...');
            Fwk.web_service_GET(
                "/replication/v1/worker",
                {},
                function(data) {
                    var html = '';
                    for (var i in data) {
                        var workerInfo = data[i];

                        var qservCssClass       = '';
                        var replicationCssClass = '';

                        if (workerInfo.qserv.probe_delay_s != 0) {
                            qservCssClass       = 'class="table-warning"';
                        }
                        if (workerInfo.replication.probe_delay_s != 0) {
                            replicationCssClass = 'class="table-warning"';
                        }
                        if ((workerInfo.qserv.probe_delay_s != 0) && (workerInfo.replication.probe_delay_s != 0)) {
                            qservCssClass       = 'class="table-danger"';
                            replicationCssClass = 'class="table-danger"';
                        }
                        var qservStatus = 'ON-LINE';
                        if (workerInfo.qserv.probe_delay_s != 0) {
                            qservStatus = 'OFF-LINE';
                        }
                        var replicationStatus = 'ENABLED';
                        if (workerInfo.replication.isEnabled) {
                            if (workerInfo.replication.isReadOnly) replicationStatus += 'READ-ONLY';
                        } else {
                            replicationStatus = 'DISABLED';
                        }
                        html +=
'<tr>' +
'  <td>'                                                           + workerInfo.worker                    + '</td>' +
'  <td style="text-align:right"><pre>'                             + workerInfo.replication.num_replicas  + '</pre></td>' +
'  <td style="text-align:right" ' + qservCssClass       + '>'      + qservStatus                          + '</td>' +
'  <td style="text-align:right" ' + qservCssClass       + '><pre>' + workerInfo.qserv.probe_delay_s       + '</pre></td>' +
'  <td style="text-align:right" ' + replicationCssClass + '>'      + replicationStatus                    + '</td>' +
'  <td style="text-align:right" ' + replicationCssClass + '><pre>' + workerInfo.replication.probe_delay_s + '</pre></td>' +
'</tr>';
                    }
                    _that._table().children('tbody').html(html);
                    Fwk.setLastUpdate(_that._table().children('caption'));
                    _that._loading = false;
                },
                function(msg) {
                    Fwk.report_error(msg);
                    _that._loading = false;
                }
            );
        };
    }
    Class.define_class(StatusWorkers, FwkApplication, {}, {});

    return StatusWorkers;
});
