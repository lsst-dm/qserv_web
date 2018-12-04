require.config({

    baseUrl: '..',

    waitSeconds: 15,
    urlArgs:     "bust="+new Date().getTime(),

    paths: {
        'jquery':     'https://code.jquery.com/jquery-3.3.1',
        'bootstrap':  'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.bundle',
        'underscore': 'https://underscorejs.org/underscore-min',
        'webfwk':     'webfwk/js',
        'qserv':      'qserv/js'
    },
    shim: {
        'bootstrap':  {
            deps: ['jquery']
        },
        'underscore': {
            exports: '_'
        }
    }
});
require([
    'webfwk/CSSLoader',
    'webfwk/Class',
    'webfwk/SimpleTable',

    // Make sure the core libraries are preloaded so that the applications
    // won't bother with loading them individually

    'bootstrap',
    'underscore'],

function(CSSLoader,
         Class,
         SimpleTable) {

    CSSLoader.load('https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.css');
    CSSLoader.load('webfwk/css/test_fwk.css');

    $(function() {

        var html =
'<nav class="navbar navbar-expand-lg navbar-dark bg-primary sticky-top">' +
'  <a class="navbar-brand" href="#" >Qserv [PDAC]</a>' +
'  <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent"' +
'          aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">' +
'    <span class="navbar-toggler-icon"></span>' +
'  </button>' +
'' +
'  <div class="collapse navbar-collapse" id="navbarSupportedContent">' +
'    <ul class="navbar-nav mr-auto nav" role="tablist">' +
'      <li class="nav-item">' +
'        <a class="nav-link active"' +
'           id="tab-status"' +
'           data-toggle="tab"' +
'           href="#status"' +
'           role="tab"' +
'           aria-controls="status"' +
'           aria-selected="true"' +
'           >Status <span class="sr-only">(current)</span></a>' +
'      </li>' +
'      <li class="nav-item">' +
'        <a class="nav-link"' +
'           id="tab-replication"' +
'           data-toggle="tab"' +
'           href="#replication"' +
'           role="tab"' +
'           aria-controls="replication"' +
'           aria-selected="false"' +
'           >Replication</a>' +
'      </li>' +
'      <li class="nav-item">' +
'        <a class="nav-link"' +
'           id="tab-ingest"' +
'           data-toggle="tab"' +
'           href="#ingest"' +
'           role="tab"' +
'           aria-controls="ingest"' +
'           aria-selected="false"' +
'           >Ingest</a>' +
'      </li>' +
'      <li class="nav-item dropdown">' +
'        <a class="nav-link dropdown-toggle "' +
'           href="#"' +
'           id="navbarDropdown"' +
'           role="button"' +
'           data-toggle="dropdown"' +
'           aria-haspopup="true"' +
'           aria-expanded="false">Admin</a>' +
'        <div class="dropdown-menu" aria-labelledby="navbarDropdown">' +
'          <a class="dropdown-item"' +
'             id="tab-settings"' +
'             data-toggle="tab"' +
'             href="#settings"' +
'             role="tab"' +
'             aria-controls="settings"' +
'             aria-selected="false">Settings</a>' +
'          <div class="dropdown-divider"></div>' +
'          <a class="dropdown-item"' +
'             id="tab-security"' +
'             data-toggle="tab"' +
'             href="#security"' +
'             role="tab"' +
'             aria-controls="security"' +
'             aria-selected="false">Accounts and security</a>' +
'        </div>' +
'      </li>' +
'    </ul>' +
'    <form class="form-inline my-2 my-lg-0">' +
'      <input class="form-control mr-sm-2 form-control-sm" type="search" placeholder="chunk" aria-label="Search"/>' +
'      <button class="btn btn-outline-light my-2 my-sm-0 btn-sm" type="submit">Search</button>' +
'    </form>' +
'  </div>' +
'</nav>' +
'<div class="tab-content" id="nav-tabContent">' +
'  <div class="tab-pane fade show active"' +
'       id="status"' +
'       role="tabpanel"' +
'       aria-labelledby="tab-status">' +
'' +
'    <ul class="nav nav-pills mb-0" id="status-tab" role="tablist">' +
'      <li class="nav-item">' +
'        <a class="nav-link active" id="status-replevel-tab" data-toggle="pill"' +
'           href="#status-replevel" role="tab"' +
'           aria-controls="status-replevel" aria-selected="true">Replication Level</a>' +
'      </li>' +
'      <li class="nav-item">' +
'        <a class="nav-link" id="status-workers-tab" data-toggle="pill"' +
'           href="#status-workers" role="tab"' +
'           aria-controls="status-workers" aria-selected="false">Workers</a>' +
'      </li>' +
'      <li class="nav-item">' +
'        <a class="nav-link" id="status-queries-tab" data-toggle="pill"' +
'           href="#status-queries" role="tab"' +
'           aria-controls="status-queries" aria-selected="false">User Queries</a>' +
'      </li>' +
'      <li class="nav-item">' +
'        <a class="nav-link" id="status-hitmap-tab" data-toggle="pill"' +
'           href="#status-hitmap" role="tab"' +
'           aria-controls="status-hitmap" aria-selected="false">Heat Map</a>' +
'      </li>' +
'    </ul>' +
'    <div class="tab-content" id="status-tabContent">' +
'' +
'      <div class="tab-pane  fade show active" id="status-replevel"' +
'           role="tabpanel" aria-labelledby="status-replevel-tab">' +
'' +
'        <div class="container-fluid" style="padding-top:1em;">' +
'          <div class="row">' +
'            <div class="col-md-4">' +
'              <p>This dynamically updated table shows the <span style="font-weight:bold;">Act</span>ual replication' +
'                levels for chunks across all known <span style="font-weight:bold;">Database</span>s.' +
'                These levels may also be below or above the <span style="font-weight:bold;">Req</span>uired' +
'                level which is set for each database <span style="font-weight:bold;">Family</span> in' +
'                a configuration of the system. The levels may change for some chunks depending on' +
'                a number of worker nodes which are <span style="font-weight:bold;">On-line</span> or' +
'                <span style="font-weight:bold;">Inactive</span> (not responding) at a time when this' +
'                table gets updated.' +
'              </p>' +
'              <p>Numbers under the' +
'                <span style="font-weight:bold;">&plus;&nbsp;Inactive</span> columns' +
'                represent a speculative scenario of <span style="font-style:italic;">what the' +
'                replication level would be if</span> those nodes would also be' +
'                <span style="font-weight:bold;">On-line</span> based on the last successful' +
'                replica disposition scan of those nodes.' +
'              </p>' +
'              <p><span style="font-weight:bold;">HINT:</span> there seems to be a significant' +
'                redundancy in the <span style="font-weight:bold;">Act</span>ual number of' +
'                replicas well above the minimally <span style="font-weight:bold;">Req</span>uired' +
'                level. Consider running the replica <span style="font-weight:bold;">Purge</span>' +
'                tool.' +
'              </p>' +
'              <p><span style="font-weight:bold;">TODO:</span></p>' +
'              <ul>' +
'                <li>add a hyperlink to the Configuration section within this application</li>' +
'                <li>add a hyperlink to the Workers tab to show a status of he workers</li>' +
'                <li>add a hyperlink the replica <span style="font-weight:bold;">Purge</span> tool</li>' +
'              </ul>' +
'            </div>' +
'            <div class="col-md-8">' +
'              <table class="table table-sm table-hover table-bordered" id="level">' +
'                <caption style="caption-side:top; text-align:right; padding-top:0;">' +
'                  Loading...' +
'                </caption>' +
'                <thead class="thead-light">' +
'                  <tr>' +
'                    <th rowspan="3" style="vertical-align:middle">Family</th>' +
'                    <th rowspan="3" style="vertical-align:middle">Req.</th>' +
'                    <th rowspan="3" style="vertical-align:middle">Database</th>' +
'                    <th rowspan="3" style="vertical-align:middle; text-align:right; border-right-color:#A9A9A9">Act.</th>' +
'                    <th colspan="4" style="text-align:right; border-right-color:#A9A9A9">Qserv</th>' +
'                    <th colspan="4" style="text-align:right">Replication Sys.</th>' +
'                  </tr>' +
'                    <th colspan="2" style="text-align:right">On-line</th>' +
'                    <th colspan="2" style="text-align:right; border-right-color:#A9A9A9">&plus;&nbsp;Inactive</th>' +
'                    <th colspan="2" style="text-align:right">On-line</th>' +
'                    <th colspan="2" style="text-align:right">&plus;&nbsp;Inactive</th>' +
'                  </tr>' +
'                  <tr>' +
'                    <th style="text-align:right">#chunks</th>' +
'                    <th style="text-align:right">%</th>' +
'                    <th style="text-align:right">#chunks</th>' +
'                    <th style="text-align:right; border-right-color:#A9A9A9">%</th>' +
'                    <th style="text-align:right">#chunks</th>' +
'                    <th style="text-align:right">%</th>' +
'                    <th style="text-align:right">#chunks</th>' +
'                    <th style="text-align:right">%</th>' +
'                  </tr>' +
'                </thead>' +
'                <tbody>' +
'                </tbody>' +
'              </table>' +
'            </div>' +
'          </div>' +
'        </div>' +
'      </div>' +
'' +
'      <div class="tab-pane fade" id="status-workers"' +
'           role="tabpanel" aria-labelledby="status-workers-tab">' +
'' +
'        <div class="container-fluid" style="padding-top:1em;">' +
'          <div class="row">' +
'            <div class="col-md-4">' +
'              <p>This dynamically updated table shows the status of <span style="font-weight:bold;">Worker</span>' +
'                services in each category. A <span style="font-weight:bold;">Qserv</span> worker' +
'                is supposed to be <span style="font-weight:bold;">OFF-LINE</span> if no response is' +
'                received from the worker during the most recent <span style="font-weight:bold;">Health Monitoring probe</span>.' +
'                In that case a non-zero value (the number of seconds) would be show in column' +
'                <span style="font-weight:bold;">Last Response</span>.' +
'                The state of the <span style="font-weight:bold;">Replication System</span>\'s workers' +
'                is a bit more complex. Workers in this category can be in one of the following' +
'                states: <span style="font-weight:bold;">ENABLED</span>,' +
'                <span style="font-weight:bold;">READ-ONLY</span>, or <span style="font-weight:bold;">DISABLED</span>.' +
'                Note that the <span style="font-weight:bold;">Last Response</span> tracking for this type of' +
'                workers is done in the first two categories only.' +
'                Regardless of a status (or a response delay) of a worker, a number shown in the' +
'                <span style="font-weight:bold;">#replicas</span> column will indicate either the actual number' +
'                of replicas on the corresponding node, or the latest recorded number obtained from the last recorded scan' +
'                of the worker node made by the <span style="font-weight:bold;">Replication System</span> before' +
'                the worker service became non-responsive.' +
'              </p>' +
'            </div>' +
'            <div class="col-md-8">' +
'' +
'             <table class="table table-sm table-hover table-bordered" id="workers">' +
'                <caption style="caption-side:top; text-align:right;">' +
'                  Loading...' +
'                </caption>' +
'                <thead class="thead-light">' +
'                  <tr>' +
'                    <th rowspan="2" style="vertical-align:middle;">Worker</th>' +
'                    <th rowspan="2" style="vertical-align:middle; text-align:right;">#replicas</th>' +
'                    <th colspan="2" style="text-align:right">Qserv</th>' +
'                    <th colspan="2" style="text-align:right">Replication Sys.</th>' +
'                  </tr>' +
'                  <tr>' +
'                    <th style="text-align:right">Status</th>' +
'                    <th style="text-align:right">Last Response [s]</th>' +
'                    <th style="text-align:right">Status</th>' +
'                    <th style="text-align:right">Last Response [s]</th>' +
'                  </tr>' +
'                </thead>' +
'                <tbody></tbody>' +
'              </table>' +
'            </div>' +
'          </div>' +
'        </div>' +
'      </div>' +
'' +
'      <div class="tab-pane fade" id="status-queries"' +
'           role="tabpanel" aria-labelledby="status-queries-tab">' +
'        (TBC) The on-going and most recent user queries launched in Qserv...' +
'      </div>' +
'      <div class="tab-pane fade" id="status-hitmap"' +
'           role="tabpanel" aria-labelledby="status-hitmap-tab">' +
'        2-D map of chunks which are in use by Qserv.' +
'        Use colors to represent multiple uses of the same chunk (chunks with the same' +
'        number which belong to different databases).' +
'        <span style="text-weight:bold;">ATTENTION:</span> Different database families' +
'        would have different maps.' +
'      </div>' +
'' +
'    </div>' +
'  </div>' +
'  <div class="tab-pane fade"' +
'       id="replication"' +
'       role="tabpanel"' +
'       aria-labelledby="tab-replication">' +
'    <div class="container-fluid">' +
'      Here be UI for monitoring and launching replication operations. And also, for managing' +
'      the Master Replication Controller and Worker Services. All of this will be arranged into' +
'      tabs or menus.' +
'    </div>' +
'  </div>' +
'  <div class="tab-pane fade"' +
'       id="ingest"' +
'       role="tabpanel"' +
'       aria-labelledby="tab-ingest">' +
'    <div class="container-fluid">' +
'      Here be UI for setting up and managing new catalog ingest operations.' +
'      An extra layer of tabs or menus will be added if needed.' +
'    </div>' +
'  </div>' +
'  <div class="tab-pane fade"' +
'       id="settings"' +
'       role="tabpanel"' +
'       aria-labelledby="tab-settings">' +
'    <div class="container-fluid">' +
'      Settings, defaults, automatic notifications (by e-mail, etc.)' +
'    </div>' +
'  </div>' +
'  <div class="tab-pane fade"' +
'       id="security"' +
'       role="tabpanel"' +
'       aria-labelledby="tab-security">' +
'    <div class="container-fluid">' +
'      <p>Accounts and Security: who can do what and in which scope.</p>' +
'      <button type="button" class="btn btn-success btn-sm" id="security-goto-status-replevel">Replication Level</button>' +
'      <button type="button" class="btn btn-success btn-sm" id="security-goto-status-workers">Workers</button>' +
'      <div id="security-table1"></div>' +
'      <div id="security-table2"></div>' +
'      <div id="security-table3"></div>' +
'      <div>' +
'        <button type="button" class="btn btn-success btn-sm" id="security-table4-load">Load</button>' +
'        <button type="button" class="btn btn-danger  btn-sm" id="security-table4-erase">Erase</button>' +
'      </div>' +
'      <div id="security-table4"></div>' +
'      <button type="button" class="btn btn-success btn-sm" id="security-table5-load">Load</button>' +
'      <div id="security-table5">Loading...</div>' +
'      <div id="security-table6"></div>' +
'      <div id="security-table7"></div>' +
'    </div>' +
'  </div>' +
'</div>';
        $('body').html(html);

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

        function setLastUpdate(e) {
            var now = (new Date(Date.now())).toLocalTimeString();
            e.html('Updated:&nbsp;<span style="text-weight:bold; color:maroon;">' + now +
                   '</span>');
        }
        function report_error(message) {
            alert(message);
        }
        function web_service_GET(url, params, on_success, on_failure) {
            var jqXHR = $.get(url, params, function(data) {
                /*
                if (data.status != 'success') {
                    if (on_failure) on_failure(data.message);
                    else            report_error(data.message);
                    return;
                }
                */
                if (on_success) on_success(data);
            },
            'JSON').fail(function() {
                var message = 'Web service request to '+url+' failed because of:' + jqXHR.statusText;
                if (on_failure) on_failure(message);
                else            report_error(message);
            });
        }
        function update_status() {
            $('#workers').children('caption').html('Updating...');
            web_service_GET(
                "/replication/v1/worker",
                {},
                function(data) {
                    console.log(data);
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
                    console.log(html);
                    $('#workers').children('tbody').html(html);
                    setLastUpdate($('#workers').children('caption'));
                },
                null
            );
        }
        $('a#status-workers-tab').on('click', function (e) {
            e.preventDefault();
            $(this).tab('show');
            update_status();
        });

        function chunkNum2str(num) {
            return 0 == num ? '&nbsp;' : '' + num;
        }
        function percent2str(percent) {
            return 0 == percent ? '&nbsp;' : '' + percent.toFixed(2);
        }
        function update_status_replevel() {
            $('#level').children('caption').html('Updating...');
            web_service_GET(
                "/replication/v1/level",
                {},
                function(data) {
                    console.log(data);
                    var html = "";
                    for (var family in data.families) {
                        var familyInfo = data.families[family];
                        var familyRowSpan = 1;
                        var familyHtml = '';
                        for (var database in familyInfo.databases) {
                            var databaseInfo = familyInfo.databases[database];
                            var databaseRowSpan = 1;
                            familyRowSpan += databaseRowSpan;

                            // Rows for levels are going to be prepended to show then in the
                            // reverse (descending) order.
                            var databaseHtml = '';

                            for (var level in databaseInfo.levels) {

                                var levelInfo = databaseInfo.levels[level];

                                // Skip empty and insignificant levels
                                if (level < familyInfo.level) {
                                    var totalChunks =
                                        levelInfo.qserv.online.num_chunks +
                                        levelInfo.qserv.all.num_chunks +
                                        levelInfo.replication.online.num_chunks +
                                        levelInfo.replication.all.num_chunks;
                                    if (totalChunks == 0) continue;
                                }

                                // Otherwise count this row
                                databaseRowSpan++;
                                familyRowSpan++;

                                // Apply optional color schemes to rows depending on a value
                                // of the replication level relative to the required one.
                                var cssClass = '';
                                if      (level == 0)                cssClass = 'class="table-danger"';
                                else if (level == familyInfo.level) cssClass = 'class="table-success"';
                                else if (level <  familyInfo.level) cssClass = 'class="table-warning"';

                                databaseHtml =
'<tr ' + cssClass + '> ' +
'  <th style="text-align:center; border-right-color:#A9A9A9" scope="row"><pre>' + level + '</pre></th>' +
'  <td style="text-align:right"><pre>'                             + chunkNum2str(levelInfo.qserv.online.num_chunks)       + '</pre></td>' +
'  <td style="text-align:right"><pre>'                             + percent2str( levelInfo.qserv.online.percent)          + '</pre></td>' +
'  <td style="text-align:right"><pre>'                             + chunkNum2str(levelInfo.qserv.all.num_chunks)          + '</pre></td>' +
'  <td style="text-align:right; border-right-color:#A9A9A9"><pre>' + percent2str( levelInfo.qserv.all.percent)             + '</pre></td>' +
'  <td style="text-align:right"><pre>'                             + chunkNum2str(levelInfo.replication.online.num_chunks) + '</pre></td>' +
'  <td style="text-align:right"><pre>'                             + percent2str( levelInfo.replication.online.percent)    + '</pre></td>' +
'  <td style="text-align:right"><pre>'                             + chunkNum2str(levelInfo.replication.all.num_chunks)    + '</pre></td>' +
'  <td style="text-align:right"><pre>'                             + percent2str( levelInfo.replication.all.percent)       + '</pre></td>' +
'</tr>' + databaseHtml;
                            }
                            familyHtml +=
'<tr>' +
'  <td rowspan="' + databaseRowSpan + '" style="vertical-align:middle">' + database + '</td>' +
'</tr>' + databaseHtml;
                        }
                        html +=
'<tr>' +
'  <td rowspan="' + familyRowSpan + '" style="vertical-align:middle">' + family + '</td>' +
'  <th rowspan="' + familyRowSpan + '" style="vertical-align:middle; text-align:center;" scope="row"><pre>' + familyInfo.level + '</pre></th>' +
'</tr>';
                        html += familyHtml;
                    }
                    console.log(html);
                    $('#level').children('tbody').html(html);
                    setLastUpdate($('#level').children('caption'));
                },
                null
            );
        }
        $('a#status-replevel-tab').on('click', function(e) {
            e.preventDefault();
            $(this).tab('show');
            update_status_replevel();
        });
        update_status_replevel();

        $('#security-goto-status-replevel').button().click(function() {
            $('a#tab-status').tab('show');
            $('a#status-replevel-tab').tab('show');
            update_status_replevel();
        });
        $('#security-goto-status-workers').button().click(function() {
            $('a#tab-status').tab('show');
            $('a#status-workers-tab').tab('show');
            update_status();
        });

        // Test tables

        var table1 = new SimpleTable.constructor(
            'security-table1',

            [{name: '1'},
             {name: '2'},
             {name: '3', sorted: false}],

            [['1(1)','2(2)','3(2)'],
             ['2(1)','3(2)','4(2)'],
             ['3(1)','4(2)','1(2)'],
             ['4(1)','1(2)','2(2)']]
        );
        table1.display();

        var table2 = new SimpleTable.constructor(
            'security-table2',

            [{name: 'id'},
             {name: '2', coldef: [
                {name: '2.1'},
                {name: '2.2'}]},
             {name: '3'},
             {name: '4'}],

            [['1', '1(2.1)', '1(2.2)', '1(3)', '1(4)'],
             ['2', '2(2.1)', '2(2.2)', '2(3)', '2(4)'],
             ['3', '3(2.1)', '3(2.2)', '3(3)', '3(4)'],
             ['4', '4(2.1)', '4(2.2)', '4(3)', '4(4)']]
        );
        table2.display();

        var table3 = new SimpleTable.constructor(
            'security-table3',

            [{name: 'id'},
             {name: '2', coldef: [
                {name: '2.1', coldef: [
                    {name: '2.1.1'},
                    {name: '2.1.2'}]},
                {name: '2.2'}]},
              {name: '3'},
              {name: '4'}],

            [['1', '1(2.1.1)', '1(2.1.2)', '1(2.2)', '1(3)', '1(4)'],
             ['2', '2(2.1.1)', '2(2.1.2)', '2(2.2)', '2(3)', '2(4)'],
             ['3', '3(2.1.1)', '3(2.1.2)', '3(2.2)', '3(3)', '3(4)'],
             ['4', '4(2.1.1)', '4(2.1.2)', '4(2.2)', '4(3)', '4(4)']]
        );
        table3.display();


        function MyCellType() {
            SimpleTable.CellType.call(this);
        }
        Class.define_class(MyCellType, SimpleTable.CellType, {}, {
           to_string:      function(a)   { return '<b>'+a+'</b>'; } ,
           compare_values: function(a,b) { return this.compare_strings(a,b); }}
        ) ;

        var table4 = new SimpleTable.constructor(
            'security-table4',

            [{name: 'Text_URL',   type: SimpleTable.Types.Text_URL},
             {name: 'Number_URL', type: SimpleTable.Types.Number_URL} ,
             {name: 'MyCellType', type: new MyCellType},
             {name: 'Customized', type: {to_string:      function(a)   { return SimpleTable.html.Button(a.data, {name: a.data, classes: 'btn-info btn-sm my_button'}); },
                                         compare_values: function(a,b) { return a.data - b.data ; } ,
                                         after_sort:     function()    { $('.my_button').button().click(function () { alert(this.name); }); }}}],

            // No data rows yet
            null,
            SimpleTable.Status.Empty
        );
        table4.display();

        var data4 = [
            [{text: 'A',         url: 'https://www.slac.stanford.edu'}, {number: 123, url: 'https://www.slac.stanford.edu'}, '3(2)', {data:  3}],
            [{text: 'a',         url: 'https://www.slac.stanford.edu'}, {number: -99, url: 'https://www.slac.stanford.edu'}, '4(2)', {data: 11}],
            [{text: 'xYz',       url: 'https://www.slac.stanford.edu'}, {number:   3, url: 'https://www.slac.stanford.edu'}, '1(2)', {data: 12}],
            [{text: 'let it be', url: 'https://www.slac.stanford.edu'}, {number:   0, url: 'https://www.slac.stanford.edu'}, '2(2)', {data:  1}]
        ] ;
        $('#security-table4-load').button().click(function() {
            table4.load(data4);
        });
        $('#security-table4-erase').button().click(function() {
            table4.erase();
        });

        var table5 = new SimpleTable.constructor(
            'security-table5',

            [{name: 'Number', type: SimpleTable.Types.Number},
             {name: 'Text'}]
        );
        table5.display();

        $('#security-table5-load').button().click(function() {
            table5.erase(SimpleTable.Status.Loading);
            $.ajax({
                type: 'GET',
                url:  'webfwk/ws/table_data.json' ,
                /*
                data: {
                    rows: 12,
                    cols: table5.cols()} ,
                */
                success: function(data) {
                    table5.load(JSON.parse(data));
                },
                error: function() {
                    table5.erase(SimpleTable.Status.error('service is not available'));
                },
                dataType: 'html'
            });
        });

        var table6 = new SimpleTable.constructor(
            'security-table6',

            [{name: '1'} ,
             {name: '2'} ,
             {name: 'hideable', hideable: true},
             {name: '4',                                       align: 'center'},
             {name: '5',        hideable: true, sorted: false, align: 'right'}],

            [['1(1)','2(2)','3(3)',     4,    5],
             ['2(1)','3(2)','4(3)', 12554,  333],
             ['3(1)','4(2)','1(3)',     1,   23],
             ['4(1)','1(2)','2(3)',    21,    0],
             ['7(1)','8(2)','9(3)',    56, 1999]]
        );
        table6.display();

        var table7 = new SimpleTable.constructor(
            'security-table7',
            [{name: '1'},
             {name: 'custom style', style:   'color: red; font-size: 125%'},
             {name: 'last',         hideable: true, sorted: true, align: 'right'}],

            [['1(1)',     4,    5],
             ['2(1)', 12554,  333],
             ['3(1)',     1,   23],
             ['4(1)',    21,    0],
             ['7(1)',    56, 1999]]
        );
        table7.display();
    });
});
