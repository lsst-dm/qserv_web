define([
    'webfwk/CSSLoader',
    'webfwk/Fwk',
    'webfwk/FwkApplication',
    'underscore'],

function(CSSLoader,
         Fwk,
         FwkApplication,
         _) {

    CSSLoader.load('qserv/css/IngestStatus.css');

    class IngestStatus extends FwkApplication {


        /// @returns the default update interval for the page
        static update_ival_sec() { return 10; }

        constructor(name) {
            super(name);
        }

        /// @see FwkApplication.fwk_app_on_show
        fwk_app_on_show() {
            console.log('show: ' + this.fwk_app_name);
            this.fwk_app_on_update();
        }

        /// @see FwkApplication.fwk_app_on_hide
        fwk_app_on_hide() {
            console.log('hide: ' + this.fwk_app_name);
        }

        /// @see FwkApplication.fwk_app_on_update
        fwk_app_on_update() {
            if (this.fwk_app_visible) {
                if (this._prev_update_sec === undefined) {
                    this._prev_update_sec = 0;
                }
                let now_sec = Fwk.now().sec;
                if (now_sec - this._prev_update_sec > IngestStatus.update_ival_sec()) {
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
            if (this._initialized === undefined) this._initialized = false;
            if (this._initialized) return;
            this._initialized = true;
            this._prevTimestamp = 0;
            let html = `
<div class="row">
  <div class="col" id="fwk-ingest-status">
    <div id="status">Loading...</div>
    <div id="coll"></div>
  </div>
</div>`;
            this.fwk_app_container.html(html);
        }
        
        /// @returns JQuery object displaying the last update time of the page
        _status() {
            if (this._status_obj === undefined) {
                this._status_obj = this.fwk_app_container.find('div#fwk-ingest-status').children('div#status');
            }
            return this._status_obj;
        }

        /// @returns JQuery object with a collection of databases
        _coll() {
            if (this._coll_obj === undefined) {
                this._coll_obj = this.fwk_app_container.find('div#fwk-ingest-status').children('div#coll');
            }
            return this._coll_obj;
        }

        /**
         * Load data from a web service then render it to the application's page.
         */
        _load() {
            if (this._loading === undefined) this._loading = false;
            if (this._loading) return;
            this._loading = true;

            this._status().addClass('updating');

            Fwk.web_service_GET(
                "/ingest/trans",
                {family: '', all_databases: 0, is_published: 0, contrib: 1, contrib_long: 0},
                (data) => {
                    this._display(data.databases);
                    Fwk.setLastUpdate(this._status());
                    this._status().removeClass('updating');
                    this._loading = false;
                },
                (msg) => {
                    console.log('request failed', this.fwk_app_name, msg);
                    this._status().html('<span style="color:maroon">No Response</span>');
                    this._status().removeClass('updating');
                    this._loading = false;
                }
            );
        }

        /**
         * Render the data received from a server
         * @param {Object} databases  transactions and other relevant info for unpublished databases
         */
        _display(databases) {

            /* Translate a dictionary of database descriptors into a reverse sorted
             * array of the descriptors. The elements of the resulting array will be stored
             * by the maximum value of the transaction identifiers in the descending order.
             * The idea here is to show newer databases on the top of the table.
             */
            let listOfDatabases = _.sortBy(
                /* The mapping function will return an array of descriptors */
                _.map(
                    databases,
                    function(databaseInfo, database) {
                        // Inject database name into the object since it will be lost
                        // after translating the dictonary into a list. Note that database
                        // names serve as keys in the dictionary.
                        databaseInfo.name = database;
                        return databaseInfo;
                    }
                ),
                function(databaseInfo) {
                    /* The reduction function will return the maximum transaction identifier,
                     * or 0 of no transactions were recorded. */
                    return _.reduce(
                        databaseInfo.transactions,
                        function(maxTransactionId, transaction) { return Math.max(maxTransactionId, transaction.id); },
                        0
                    );
                }
            ).reverse();
            let html = '';
            for (let databaseIdx in listOfDatabases) {

                let databaseInfo = listOfDatabases[databaseIdx];
                let database = databaseInfo.name;

                // Transaction timestamps are computed below based on the above made sorting
                // of transactions in the DESC order by the begin time.
                let firstTransBeginStr = 'n/d';
                let firstTransBeginAgoStr = '&nbsp;';
                let lastTransBeginStr = 'n/d';
                let lastTransBeginAgoStr = '&nbsp;';
                if (databaseInfo.transactions.length > 0) {

                    let firstTransBegin = databaseInfo.transactions[databaseInfo.transactions.length-1].begin_time;
                    firstTransBeginStr = (new Date(firstTransBegin)).toLocalTimeString('short');
                    firstTransBeginAgoStr = IngestStatus.timeAgo(firstTransBegin);

                    let lastTransBegin = databaseInfo.transactions[0].begin_time;
                    lastTransBeginStr = (new Date(lastTransBegin)).toLocalTimeString('short');
                    lastTransBeginAgoStr = IngestStatus.timeAgo(lastTransBegin);
                }

                // Other counters are computed based on what's found in the transaction
                // summary sections.
                let databaseDataSize = 0;
                let databaseNumRows = 0;
                let databaseNumFiles = 0;
                let databaseNumFailedFiles = 0;
                let databaseNumTransStarted = 0;
                let databaseNumTransFinished = 0;
                let databaseNumTransAborted = 0;
                let firstIngestTime = 0;
                let lastIngestTime = 0;
                let tableStats = {};
                let workerStats = {};
                for (let transactionIdx in databaseInfo.transactions) {

                    let transactionInfo = databaseInfo.transactions[transactionIdx];
                    switch (transactionInfo.state) {
                        case 'STARTED':  databaseNumTransStarted++;  break;
                        case 'FINISHED': databaseNumTransFinished++; break;
                        case 'ABORTED':  databaseNumTransAborted++;  break;
                    }

                    // For other summary data ignore transactions that has been aborted
                    if (transactionInfo.state === 'ABORTED') continue;

                    let contrib = transactionInfo.contrib;
                    let summary = transactionInfo.contrib.summary;

                    databaseDataSize += summary.data_size_gb;
                    databaseNumRows  += summary.num_rows;
                    databaseNumFiles += summary.num_regular_files +
                                        summary.num_chunk_files +
                                        summary.num_chunk_overlap_files;
                    databaseNumFailedFiles += summary.num_failed_files;
                    let thisFirstContribTime = summary.first_contrib_begin;
                    if (thisFirstContribTime > 0) {
                        firstIngestTime = firstIngestTime === 0 ?
                            thisFirstContribTime : Math.min(firstIngestTime, thisFirstContribTime);
                    }
                    lastIngestTime = Math.max(lastIngestTime, summary.last_contrib_end);

                    // Collect per-table-level stats
                    for (let table in summary.table) {
                        // This object has data for both chunk and chunk overlaps. So we need
                        // to absorbe both.
                        let tableInfo = summary.table[table];
                        if (_.has(tableStats, table)) {
                            tableStats[table].data  += tableInfo.data_size_gb;
                            tableStats[table].rows  += tableInfo.num_rows;
                            tableStats[table].files += tableInfo.num_files;
                        } else {
                            tableStats[table] = {
                                'data':  tableInfo.data_size_gb,
                                'rows':  tableInfo.num_rows,
                                'files': tableInfo.num_files
                            };
                        }
                        if (_.has(tableInfo, 'overlap')) {
                            let tableOverlaps = table + '&nbsp;(overlaps)';
                            if (_.has(tableStats, tableOverlaps)) {
                                tableStats[tableOverlaps].data  += tableInfo.overlap.data_size_gb;
                                tableStats[tableOverlaps].rows  += tableInfo.overlap.num_rows;
                                tableStats[tableOverlaps].files += tableInfo.overlap.num_files;
                            } else {
                                tableStats[tableOverlaps] = {
                                    'data':  tableInfo.overlap.data_size_gb,
                                    'rows':  tableInfo.overlap.num_rows,
                                    'files': tableInfo.overlap.num_files
                                };
                            }
                        }
                    }

                    // Collect per-worker-level stats
                    for (let worker in summary.worker) {
                        let workerInfo = summary.worker[worker];
                        let numWorkerFiles = workerInfo.num_regular_files +
                                             workerInfo.num_chunk_files +
                                             workerInfo.num_chunk_overlap_files;
                        if (_.has(workerStats, worker)) {
                            workerStats[worker].data  += workerInfo.data_size_gb;
                            workerStats[worker].rows  += workerInfo.num_rows;
                            workerStats[worker].files += numWorkerFiles;
                        } else {
                            workerStats[worker] = {
                                'data':  workerInfo.data_size_gb,
                                'rows':  workerInfo.num_rows,
                                'files': numWorkerFiles
                            };
                        }
                    }
                }
                let firstIngestTimeStr = 'n/d';
                let firstIngestTimeAgoStr = '&nbsp;';
                if (firstIngestTime > 0) {
                    firstIngestTimeStr = (new Date(firstIngestTime)).toLocalTimeString('short');
                    firstIngestTimeAgoStr = IngestStatus.timeAgo(firstIngestTime);
                }
                let lastIngestTimeStr = 'n/d';
                let lastIngestTimeAgoStr = '&nbsp;';
                if (lastIngestTime > 0) {
                    lastIngestTimeStr = (new Date(lastIngestTime)).toLocalTimeString('short');
                    lastIngestTimeAgoStr = IngestStatus.timeAgo(lastIngestTime);
                }
                let perfStr = 'n/a';
                if ((firstIngestTime > 0) && (lastIngestTime > 0) && (lastIngestTime > firstIngestTime)) {
                    let perfGBps = databaseDataSize / ((lastIngestTime - firstIngestTime) / 1000.);
                    perfStr = (1000. * perfGBps).toFixed(2) + ' MB/s';
                }
                html += `
    <div class="database">
      <h2>Database:&nbsp;<span class="perf-value">${database}</span></h2>
      <div class="row block">
        <div class="col-md-auto">
          <table class="table table-sm table-hover">
            <tbody>
              <tr><th>Data [GB]</th><td class="right-aligned"><pre>${databaseDataSize.toFixed(2)}</pre></td><td>&nbsp;</td></tr>
              <tr><th>Rows</th><td class="right-aligned"><pre>${databaseNumRows}</pre></td><td>&nbsp;</td></tr>
              <tr><th>Contributions</th><td class="right-aligned"><pre>${databaseNumFiles}</pre></td><td><pre class="files-ingested">INGESTED</pre></td></tr>
              <tr><th>&nbsp;</th><td class="right-aligned"><pre>${databaseNumFailedFiles}</pre></td><td><pre class="files-failed">FAILED</pre></td></tr>
            </tbody>
          </table>
        </div>
        <div class="col-md-auto">
          <table class="table table-sm table-hover">
            <tbody>
              <tr><th>Alloc.chunks</th><td class="right-aligned"><pre>${databaseInfo.num_chunks}</pre></td><td>&nbsp;</td></tr>
              <tr><th>Transactions</th><td class="right-aligned"><pre>${databaseNumTransFinished}</pre></td><td><pre class="trans-finished">FINISHED</pre></td></tr>
              <tr><th>&nbsp;</th><td class="right-aligned"><pre>${databaseNumTransAborted}</pre></td><td><pre class="trans-aborted">ABORTED</pre></td</tr>
              <tr><th>&nbsp;</th><td class="right-aligned"><pre>${databaseNumTransStarted}</pre></td><td><pre class="trans-started">STARTED</pre></td></tr>
            </tbody>
          </table>
        </div>
        <div class="col-md-auto">
          <table class="table table-sm table-hover">
            <tbody>
              <tr><th>First trans</th><td class="right-aligned"><pre class="object">${firstTransBeginStr}</pre></td><td class="right-aligned"><pre class="comment>">${firstTransBeginAgoStr}</pre></td></tr>
              <tr><th>Last trans</th><td class="right-aligned"><pre class="object">${lastTransBeginStr}</pre></td><td class="right-aligned"><pre class="comment>">${lastTransBeginAgoStr}</pre></td></tr>
              <tr><th>First contrib</th><td class="right-aligned"><pre class="object">${firstIngestTimeStr}</pre></td><td class="right-aligned"><pre class="comment>">${firstIngestTimeAgoStr}</pre></td></tr>
              <tr><th>Last contrib</th><td class="right-aligned"><pre class="object">${lastIngestTimeStr}</pre></td><td class="right-aligned"><pre class="comment>">${lastIngestTimeAgoStr}</pre></td></tr>
            </tbody>
          </table>
        </div>
        <div class="col-md-auto perf">
          <h2><span class="perf-title">avg.perf:&nbsp;</span><span class="perf-value">${perfStr}</span></h2>
        </div>
      </div>`;

            /* Skip displaying the empty table of tables and workers if no stats is available
             * for both.
             */
            if (_.isEmpty(tableStats) && _.isEmpty(workerStats)) continue;

            html += `
      <div class="row block">
        <div class="col">
          <table class="table table-sm table-hover">
            <thead class="thead-light">
              <tr>
                <th style="border-top:none">&nbsp;</th>
                <th class="right-aligned" style="border-top:none">data [GB]</th>
                <th class="right-aligned" style="border-top:none">rows</th>
                <th class="right-aligned" style="border-top:none">contribs</th>
              </tr>
            </thead>
            <thead>
              <tr>
                <th colspan="4" style="border-bottom:none">table</th>
              </tr>
            </thead>
            <tbody>`;

                for (let table in tableStats) {
                    html += `
              <tr>
                <td class="level-2"><pre class="object">${table}</pre></td>
                <td class="right-aligned"><pre>${tableStats[table].data.toFixed(2)}</pre></td>
                <td class="right-aligned"><pre>${tableStats[table].rows}</pre></td>
                <td class="right-aligned"><pre>${tableStats[table].files}</pre></td>
              </tr>`;
                }
                html += `
            </tbody>
            <thead>
              <tr>
                <th colspan="4" style="border-bottom:none">worker</th>
              </tr>
            </thead>
            <tbody>`;
                for (let worker in workerStats) {
                    html += `
              <tr>
                <td class="level-2"><pre class="object">${worker}</pre></td>
                <td class="right-aligned"><pre>${workerStats[worker].data.toFixed(2)}</pre></td>
                <td class="right-aligned"><pre>${workerStats[worker].rows}</pre></td>
                <td class="right-aligned"><pre>${workerStats[worker].files}</pre></td>
              </tr>`;
                }
                html += `
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
            }
            this._coll().html(html);
        }

        static timeAgo(timestamp) {
            let ivalSec = Fwk.now().sec - Math.floor(timestamp / 1000);
            if (ivalSec <         0) return '&lt;error&gt;';
            if (ivalSec <        60) return 'just now';
            if (ivalSec <      3600) return Math.floor(ivalSec / 60) + ' mins ago';
            if (ivalSec < 24 * 3600) return Math.floor(ivalSec / 3600) + ' hrs ago';
            return Math.floor(ivalSec / (24 * 3600)) + ' days ago';
        }
    }
    return IngestStatus;
});
