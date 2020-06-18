define([
    'webfwk/CSSLoader',
    'webfwk/Fwk',
    'webfwk/FwkApplication',
    'underscore'],

function(CSSLoader,
         Fwk,
         FwkApplication,
         _) {

    CSSLoader.load('qserv/css/StatusUserQueries.css');

    class StatusUserQueries extends FwkApplication {

        /**
         * @returns the default update interval for the page
         */ 
        static update_ival_sec() { return 5; }

        /**
         * @returns the maximum number of past queries to be returned
         */ 
        static limit4past() { return 200; }

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
                if (now_sec - this._prev_update_sec > StatusUserQueries.update_ival_sec()) {
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

            this._scheduler2color = {
                'Snail':   '#007bff',
                'Slow':    '#17a2b8',
                'Med':     '#28a745',
                'Fast':    '#ffc107',
                'Group':   '#dc3545',
                'Loading': 'default'
            };

            let html = `
<div class="row">
  <div class="col">
    <table class="table table-sm table-hover" id="fwk-status-queries">
      <caption class="updating">
        Loading...
      </caption>
      <thead class="thead-light">
        <tr>
          <th>started</th>
          <th>progress</th>
          <th>sched</th>
          <th style="text-align:right;">elapsed</th>
          <th style="text-align:right;">left (est.)</th>
          <th style="text-align:right;">ch[unks]</th>
          <th style="text-align:right;">ch/min</th>
          <th style="text-align:right;">qid</th>
          <th>query</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>
<div class="row">
  <div class="col">
    <h3>Past queries (last ${StatusUserQueries.limit4past()} entries)</h3>
    <table class="table table-sm table-hover" id="fwk-status-queries-past">
      <thead class="thead-light">
        <tr>
          <th>submitted</th>
          <th>status</th>
          <th style="text-align:right;">elapsed</th>
          <th>type</th>
          <th style="text-align:right;">qid</th>
          <th>query</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>`;
            this.fwk_app_container.html(html);
        }

        /**
         * Table for displaying the progress of the on-going user queries
         * 
         * @returns JQuery table object
         */
        _tableQueries() {
            if (this._tableQueries_obj === undefined) {
                this._tableQueries_obj = this.fwk_app_container.find('table#fwk-status-queries');
            }
            return this._tableQueries_obj;
        }

        /**
         * Table for displaying the completed, failed, etc. user queries
         * 
         * @returns JQuery table object
         */
        _tablePastQueries() {
            if (this._tablePastQueries_obj === undefined) {
                this._tablePastQueries_obj = this.fwk_app_container.find('table#fwk-status-queries-past');
            }
            return this._tablePastQueries_obj;
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

            this._tableQueries().children('caption').addClass('updating');
            Fwk.web_service_GET(
                "/replication/qserv/master/query",
                {limit4past: StatusUserQueries.limit4past(),timeout_sec: 2},
                (data) => {
                    this._display(data);
                    Fwk.setLastUpdate(this._tableQueries().children('caption'));
                    this._tableQueries().children('caption').removeClass('updating');
                    this._loading = false;
                },
                (msg) => {
                    this._tableQueries().children('caption').html('<span style="color:maroon">No Response</span>');
                    this._tableQueries().children('caption').removeClass('updating');
                    this._tableQueries().children('caption').removeClass('updating');
                    this._loading = false;
                }
            );
        }

        /**
         * Display the queries
         */
        _display(data) {

            let html = '';
            for (let i in data.queries) {
                let query = data.queries[i];
                let progress = Math.floor(100. * query.completedChunks  / query.totalChunks);
                let scheduler = _.isUndefined(query.scheduler) ? 'Loading...' : query.scheduler.substring('Sched'.length);
                let scheduler_color = _.has(this._scheduler2color, scheduler) ?
                    this._scheduler2color[scheduler] :
                    this._scheduler2color['Loading'];

                let elapsed = this._elapsed(query.samplingTime_sec - query.queryBegin_sec);
                let leftSeconds;
                if (query.completedChunks > 0 && query.samplingTime_sec - query.queryBegin_sec > 0) {
                    leftSeconds = Math.floor(
                            (query.totalChunks - query.completedChunks) /
                            (query.completedChunks / (query.samplingTime_sec - query.queryBegin_sec))
                    );
                }
                let left = this._elapsed(leftSeconds);
                let trend = this._trend(query.queryId, leftSeconds);
                let performance = this._performance(query.completedChunks, query.samplingTime_sec - query.queryBegin_sec);
                html += `
<tr>
  <td><pre>` + query.queryBegin + `</pre></td>
  <th scope="row">
    <div class="progress" style="height: 22px;">
      <div class="progress-bar" role="progressbar" style="width: ${progress}%" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
        ${progress}%
      </div>
    </div>
  </th>
  <td style="background-color:${scheduler_color};">${scheduler}</td>
  <th style="text-align:right; padding-top:0; padding-left:10px;">${elapsed}</th>
  <td style="text-align:right; padding-top:0; padding-left:10px;">${left}${trend}</td>
  <th scope="row" style="text-align:right;  padding-left:10px;"><pre>${query.completedChunks}/${query.totalChunks}</pre></th>
  <td style="text-align:right;" ><pre>${performance}</pre></td>
  <th scope="row" style="text-align:right;"><pre>${query.queryId}</pre></th>
  <td><pre class="wrapped" style="color:#aaa">` + query.query + `</pre></td>
</tr>`;
            }
            this._tableQueries().children('tbody').html(html);

            html = '';
            for (let i in data.queries_past) {
                let query = data.queries_past[i];
                let elapsed = this._elapsed(query.completed_sec - query.submitted_sec);
                let failedQueryCss = query.status !== "COMPLETED" ? 'class="table-danger"' : "";
                html += `
<tr ${failedQueryCss}>
  <td style="padding-right:10px;"><pre>` + query.submitted + `</pre></td>
  <td style="padding-right:10px;"><pre>${query.status}</pre></td>
  <th style="text-align:right; padding-top:0;">${elapsed}</th>
  <td><pre>` + query.qType + `</pre></td>
  <th scope="row" style="text-align:right;"><pre>${query.queryId}</pre></th>
  <td><pre class="wrapped" style="color:#aaa">` + query.query + `</pre></td>
</tr>`;
            }
            this._tablePastQueries().children('tbody').html(html);
        }
        
        /**
         * @param {Number} seconds
         * @returns {String} the amount of time elapsed by a query, formatted as: 'hh:mm:ss'
         */
        _elapsed(totalSeconds) {
            if (_.isUndefined(totalSeconds)) return '<span>&nbsp;</span>';
            let hours   = Math.floor(totalSeconds / 3600);
            let minutes = Math.floor((totalSeconds - 3600 * hours) / 60);
            let seconds = (totalSeconds - 3600 * hours - 60 * minutes) % 60;
            let displayHours   = hours !== 0;
            let displayMinutes = displayHours || minutes !== 0;
            let displaySeconds = true;
            return '<span>' +
                   (displayHours   ? (hours   < 10 ? '0' : '') + hours   + 'h' : '') + ' ' +
                   (displayMinutes ? (minutes < 10 ? '0' : '') + minutes + 'm' : '') + ' ' +
                   (displaySeconds ? (seconds < 10 ? '0' : '') + seconds + 's' : '') +
                   '</span>';
        }
        
        /**
         * 
         * @param {Number} qid  a unique identifier of a qiery. It's used to pull a record
         * for the previously (of any) recorded number of second estimated before the query
         * would expected to finish.
         * @param {Number} totalSeconds
         * @returns {String} an arrow indicating the trend to slow down or accelerate
         */
        _trend(qid, nextTotalSeconds) {
            if (!_.isUndefined(nextTotalSeconds)) {
                if (this._prevTotalSeconds === undefined) {
                    this._prevTotalSeconds = {};
                }
                let prevTotalSeconds = _.has(this._prevTotalSeconds, qid) ? this._prevTotalSeconds[qid] : nextTotalSeconds;
                this._prevTotalSeconds[qid] = nextTotalSeconds;
                if (prevTotalSeconds < nextTotalSeconds) {
                    return '<span class="trend_up">&nbsp;&uarr;</span>';
                } else if (prevTotalSeconds > nextTotalSeconds) {
                    return '<span class="trend_down">&nbsp;&darr;</span>';
                }
            }
            return '<span>&nbsp;&nbsp;</span>';
        }

        /**
         * @param {integer} chunks
         * @param {integer} totalSeconds
         * @returns {integer} the number of chunks per minute (or 0 if the totalSeconds is 0)
         */
        _performance(chunks, totalSeconds) {
            if (chunks === 0 || totalSeconds === 0) return 0;
            return Math.floor(chunks / (totalSeconds / 60.));
        }
    }
    return StatusUserQueries;
});
