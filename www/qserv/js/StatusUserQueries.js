define([
    'webfwk/CSSLoader',
    'webfwk/Fwk',
    'webfwk/FwkApplication',
    'underscore'],

function(CSSLoader,
         Fwk,
         FwkApplication) {

    CSSLoader.load('qserv/css/StatusUserQueries.css');

    class StatusUserQueries extends FwkApplication {

        /**
         * @returns the default update interval for the page
         */ 
        static update_ival_sec() { return 5; }

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

            let html = `
<div class="row">
  <div class="col">
    <table class="table table-sm table-hover" id="fwk-status-queries">
      <caption class="updating">
        Loading...
      </caption>
      <thead class="thead-light">
        <tr>
          <th>progress</th>
          <th style="text-align:right;">chunks</th>
          <th style="text-align:right;">started</th>
          <th style="text-align:right;">elapsed</th>
          <th style="text-align:right;">chunks/min</th>
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
                "/replication/v1/qserv/master/query",
                {},
                (data) => {
                    this._display(data.queries);
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
        _display(queries) {

            let html = '';
            for (let i in queries) {
                let query = queries[i];
                let progress = Math.floor(100. * query.completedChunks  / query.totalChunks);
                let elapsed = this._elapsed(query.lastUpdate_sec - query.queryBegin_sec);
                let performance = this._performance(query.completedChunks, query.lastUpdate_sec - query.queryBegin_sec);
                html += `
<tr>
  <th scope="row">
    <div class="progress" style="height: 22px;">
      <div class="progress-bar" role="progressbar" style="width: ${progress}%" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
        ${progress}%
      </div>
    </div>
  </th>
  <th scope="row" style="text-align:right; "><pre>${query.completedChunks} / ${query.totalChunks}</pre></th>
  <td style="text-align:right;"><pre>` + query.queryBegin + `</pre></td>
  <th scope="row" style="text-align:right;" ><pre>${elapsed}</pre></th>
  <th scope="row" style="text-align:right;" ><pre>${performance}</pre></th>
  <td><pre class="wrapped" style="color:#aaa">` + query.query + `</pre></td>
</tr>`;
            }
            this._tableQueries().children('tbody').html(html);
        }
        
        /**
         * @param {integer} seconds
         * @returns {string} the query elapsed time as string formatted: 'hh:mm:ss'
         */
        _elapsed(totalSeconds) {
            let hours   = Math.floor(totalSeconds / 3600);
            let minutes = Math.floor((totalSeconds - 3600 * hours) / 60);
            let seconds = (totalSeconds - 3600 * hours - 60 * minutes) % 60;
            return (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
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
