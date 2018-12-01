/**
 * The starting point for the appication. The function needs to be called
 * just once whne the applications starts.
 *
 * @returns {undefined}
 */
function main() {

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

    function chunkNum2str(num) { return 0 == num ? '&nbsp;' : '' + num; }

    function percent2str(percent) { return 0 == percent ? '&nbsp;' : '' + percent.toFixed(2); }

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
    $('a#status-replevel-tab').on('click', function (e) {

        e.preventDefault();
        $(this).tab('show');

        update_status_replevel();
    });

    update_status_replevel();
}