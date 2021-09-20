define([
    'webfwk/CSSLoader',
    'webfwk/Fwk',
    'webfwk/FwkApplication',
    'underscore'],

function(CSSLoader,
         Fwk,
         FwkApplication,
         _) {

    CSSLoader.load('qserv/css/IngestContributions.css');

    class IngestContributions extends FwkApplication {


        /// @returns the default update interval for the page
        static update_ival_sec() { return 60; }

        constructor(name) {
            super(name);
            this._data = undefined;
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
                if (now_sec - this._prev_update_sec > IngestContributions.update_ival_sec()) {
                    this._prev_update_sec = now_sec;
                    this._init();
                    this._load();
                }
            }
        }

        loadTransaction(id) {
            this._init();
            this._set_trans_id(id);
            this._load();
        }

        /**
         * The first time initialization of the page's layout
         */
        _init() {
            if (this._initialized === undefined) this._initialized = false;
            if (this._initialized) return;
            this._initialized = true;
            this._prevTimestamp = 0;

            /* <span style="color:maroon">&sum;</span>&nbsp; */

            let html = `
<div class="row">
  <div class="col">
    <div class="form-row">
      <div class="form-group col-md-2">
        <label for="contrib-database">Database:</label>
        <input type="text" id="contrib-database"  class="form-control" disabled value="">
      </div>
      <div class="form-group col-md-1">
        <label for="trans-id">Transaction Id:</label>
        <input type="number" id="trans-id"  class="form-control" value="0" disabled>
      </div>
      <div class="form-group col-md-1">
        <label for="contrib-num-select"># Contrib:</label>
        <input type="text" id="contrib-num-select" class="form-control" value="0 / 0" disabled>
      </div>
      <div class="form-group col-md-1">
        <label for="contrib-worker">Worker:</label>
          <select id="contrib-worker" class="form-control form-control-view">
            <option value="" selected></option>
          </select>
      </div>
      <div class="form-group col-md-2">
        <label for="contrib-table">Table:</label>
        <select id="contrib-table" class="form-control form-control-view">
          <option value="" selected></option>
        </select>
      </div>
      <div class="form-group col-md-1">
        <label for="contrib-chunk">Chunk:</label>
        <input type="number" id="contrib-chunk"  class="form-control form-control-view" value="">
      </div>
      <div class="form-group col-md-1">
        <label for="contrib-overlap">Overlap:</label>
        <select id="contrib-overlap" class="form-control form-control-view">
          <option value="" selected></option>
          <option value="0">No</option>
          <option value="1">Yes</option>
        </select>
      </div>
      <div class="form-group col-md-1">
        <label for="contrib-async">Type:</label>
        <select id="contrib-async" class="form-control form-control-view">
          <option value="" selected></option>
          <option value="0">SYNC</option>
          <option value="1">ASYNC</option>
        </select>
      </div>
      <div class="form-group col-md-2">
        <label for="contrib-status">Status:</label>
        <select id="contrib-status" class="form-control form-control-view">
          <option value="" selected></option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="CREATE_FAILED">CREATE_FAILED</option>
          <option value="START_FAILED">START_FAILED</option>
          <option value="READ_FAILED">READ_FAILED</option>
          <option value="LOAD_FAILED">LOAD_FAILED</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="EXPIRED">EXPIRED</option>
          <option value="FINISHED">FINISHED</option>
          <option value="!FINISHED">! FINISHED</option>
        </select>
      </div>
    </div>
  </div>
</div>
<div class="row">
  <div class="col">
    <table class="table table-sm table-hover table-bordered" id="fwk-ingest-contributions">
      <thead class="thead-light">
        <tr>
          <th rowspan="2">Worker</th>
          <th rowspan="2">Table</th>
          <th rowspan="2" class="right-aligned">Chunk</th>
          <th rowspan="2" class="right-aligned">Overlap</th>
          <th rowspan="2" class="right-aligned">Type</th>
          <th rowspan="2">Status</th>
          <th colspan="8" class="center-aligned">Timing</th>
          <th colspan="2" class="center-aligned">Size</th>
          <th colspan="2" class="center-aligned">I/O&nbsp;[MiB/s]</th>
          <th rowspan="2">Error</th>
          <th rowspan="2">Url</th>
        </tr>
        <tr>
          <th><elem style="color:red;">&darr;</elem></th>
          <th class="right-aligned">Created</elem></th>
          <th class="right-aligned"><elem style="color:red;">&rarr;</elem></th>
          <th class="right-aligned">Started</th>
          <th class="right-aligned"><elem style="color:red;">&rarr;</elem></th>
          <th class="right-aligned">Read</th>
          <th class="right-aligned"><elem style="color:red;">&rarr;</elem></th>
          <th class="right-aligned">Loaded</th>
          <th class="right-aligned">Bytes</th>
          <th class="right-aligned">Rows</th>
          <th class="right-aligned">Read</th>
          <th class="right-aligned">Load</th>
        </tr>
      </thead>
      <caption>No transaction</caption>
      <tbody></tbody>
    </table>
  </div>
</div>`;
        let cont = this.fwk_app_container.html(html);
            cont.find(".form-control-view").change(() => {
                if (!_.isUndefined(this._data)) this._display(this._data);
            });
        }
        
        /// @returns JQuery table object displaying the transactions
        _table() {
            if (this._table_obj === undefined) {
                this._table_obj = this.fwk_app_container.find('table#fwk-ingest-contributions');
            }
            return this._table_obj;
        }

        _form_control(elem_type, id) {
            if (this._form_control_obj === undefined) this._form_control_obj = {};
            if (!_.has(this._form_control_obj, id)) {
                this._form_control_obj[id] = this.fwk_app_container.find(elem_type + '#' + id);
            }
            return this._form_control_obj[id];
        }
        _get_trans_id()    { return this._form_control('input', 'trans-id').val(); }
        _set_trans_id(val) { this._form_control('input', 'trans-id').val(val); }

        _set_num_select(val, total) { this._form_control('input', 'contrib-num-select').val(val + ' / ' + total); }
        _set_database(val)          { this._form_control('input', 'contrib-database').val(val); }

        _get_worker() { return this._form_control('select', 'contrib-worker').val(); }
        _set_workers(workers, val) {
            console.log('workers', workers);
            let html = `<option value=""></option>`;
            for (let worker in workers) {
                console.log('worker', worker);
                html += `<option value="${worker}">${worker}</option>`;
            }
            this._form_control('select', 'contrib-worker').html(html).val(val);
        }

        _get_table() { return this._form_control('select', 'contrib-table').val(); }
        _set_tables(tables, val) {
            console.log('tables', tables);
            let html = `<option value=""></option>`;
            for (let table in tables) {
                console.log('table', table);
                html += `<option value="${table}">${table}</option>`;
            }
            this._form_control('select', 'contrib-table').html(html).val(val);
        }

        _get_chunk()   { return this._form_control('input', 'contrib-chunk').val(); }
        _get_overlap() { return this._form_control('select', 'contrib-overlap').val(); }
        _get_async()   { return this._form_control('select', 'contrib-async').val(); }
        _get_status()  { return this._form_control('select', 'contrib-status').val(); }

        /**
         * Load data from a web servie then render it to the application's page.
         */
        _load() {
            // Updates make no sense if no transaction identifier provided
            if (this._get_trans_id() === '0') {
                this._table().children('tbody').html('');
                return;
            }

            if (this._loading === undefined) this._loading = false;
            if (this._loading) return;
            this._loading = true;

            this._table().children('caption').html('<span style="color:maroon">Loading...</span>');
            this._table().children('caption').addClass('updating');

            Fwk.web_service_GET(
                "/ingest/trans/" + this._get_trans_id(),
                {contrib: 1, contrib_long: 1},
                (data) => {
                    if (!data.success) {
                        this._table().children('caption').html('<span style="color:maroon">No such transaction</span>');
                        this._table().children('tbody').html('');
                    } else {
                        // There should be just one database in the collection.
                        for (let database in data.databases) {
                            this._set_database(database);
                            this._data = data.databases[database].transactions[0]
                            this._display(this._data);
                            const workers = {};
                            const tables = {};
                            for (let i in this._data.contrib.files) {
                                let file = this._data.contrib.files[i];
                                workers[file.worker] = 1;
                                tables[file.table] = 1;
                            }
                            this._set_workers(workers, this._get_worker());
                            this._set_tables(tables, this._get_table());
                            break;
                        }
                        Fwk.setLastUpdate(this._table().children('caption'));
                    }
                    this._table().children('caption').removeClass('updating');
                    this._loading = false;
                },
                (msg) => {
                    console.log('request failed', this.fwk_app_name, msg);
                    this._table().children('caption').html('<span style="color:maroon">No Response</span>');
                    this._table().children('caption').removeClass('updating');
                    this._loading = false;
                }
            );
        }

        /**
         * Render the data received from a server
         * @param {Object} info transaction descriptor
         */
        _display(info) {
            console.log(info);
            const MiB = 1024 * 1024;

            const worker = this._get_worker();
            const workerIsSet = worker !== '';

            const table = this._get_table();
            const tableIsSet = table !== '';

            const chunkIsSet = this._get_chunk() !== '';
            const chunk = chunkIsSet ? parseInt(this._get_chunk()) : '';

            const overlapIsSet = this._get_overlap() !== '';
            const overlap = overlapIsSet ? parseInt(this._get_overlap()) : '';

            const asyncIsSet = this._get_async() !== '';
            const async = asyncIsSet ? parseInt(this._get_async()) : '';

            const status = this._get_status();
            const statusNotFinishedIsSet = status == '!FINISHED';
            const statusIsSet = status !== '';

            let numSelect = 0;
            let html = '';
            for (let idx in info.contrib.files) {
                let file = info.contrib.files[idx];

                // Apply optional content filters
                if (workerIsSet && file.worker !== worker) continue;
                if (tableIsSet && file.table !== table) continue;
                if (chunkIsSet && file.chunk !== chunk) continue;
                if (overlapIsSet && file.overlap !== overlap) continue;
                if (asyncIsSet && file.async !== async) continue;
                if (statusIsSet) {
                    if (statusNotFinishedIsSet) {
                        if (file.status === 'FINISHED') continue;
                    } else if(file.status != status) {
                        continue;
                    }
                }
                numSelect++;

                let overlapStr = file.overlap ? 1 : 0;
                let asyncStr = file.async ? 'ASYNC' : 'SYNC';
                let statusCssClass = '';
                switch (file.status) {
                    case 'FINISHED':    statusCssClass = ''; break;
                    case 'IN-PROGRESS': statusCssClass = 'alert alert-success'; break;
                    default:            statusCssClass = 'alert alert-danger';  break;
                }
                const createDateTimeStr = (new Date(file.create_time)).toLocalTimeString('iso').split(' ');
                const createDateStr = createDateTimeStr[0];
                const createTimeStr = createDateTimeStr[1];
                const startTimeStr  = file.start_time === 0 ? '' : (new Date(file.start_time)).toLocalTimeString('iso').split(' ')[1];
                const readTimeStr   = file.read_time === 0 ? '' : (new Date(file.read_time)).toLocalTimeString('iso').split(' ')[1];
                const loadTimeStr   = file.load_time === 0 ? '' : (new Date(file.load_time)).toLocalTimeString('iso').split(' ')[1];
                const startDeltaStr = file.start_time && file.create_time ? ((file.start_time - file.create_time) / 1000).toFixed(1) : '';
                const readDeltaStr  = file.read_time  && file.start_time  ? ((file.read_time  - file.start_time)  / 1000).toFixed(1) : '';
                const loadDeltaStr  = file.load_time  && file.read_time   ? ((file.load_time  - file.read_time)   / 1000).toFixed(1) : '';
                let readPerfStr = '';
                let loadPerfStr = '';
                if (file.status === 'FINISHED') {
                    let readSec = (file.read_time - file.start_time) / 1000.;
                    let loadSec = (file.load_time - file.read_time)  / 1000.;
                    readPerfStr = (readSec > 0 ? (file.num_bytes / MiB) / readSec : 0).toFixed(1);
                    loadPerfStr = (loadSec > 0 ? (file.num_bytes / MiB) / loadSec : 0).toFixed(1);
                }
        html += `
<tr class="${statusCssClass}">
  <td><pre>${file.worker}</pre></td>
  <td><pre>${file.table}</pre></td>
  <td class="right-aligned"><pre>${file.chunk}</pre></td>
  <td class="right-aligned"><pre>${overlapStr}</pre></td>
  <td class="right-aligned"><pre>${asyncStr}</pre></th>
  <td><pre>${file.status}</pre></td>
  <th><pre>${createDateStr}</pre></th>
  <td class="right-aligned"><pre>${createTimeStr}</pre></td>
  <th class="right-aligned"><pre>${startDeltaStr}</pre></th>
  <td class="right-aligned"><pre>${startTimeStr}</pre></td>
  <th class="right-aligned"><pre>${readDeltaStr}</pre></th>
  <td class="right-aligned"><pre>${readTimeStr}</pre></td>
  <th class="right-aligned"><pre>${loadDeltaStr}</pre></th>
  <td class="right-aligned"><pre>${loadTimeStr}</pre></td>
  <td class="right-aligned"><pre>${file.num_bytes}</pre></td>
  <td class="right-aligned"><pre>${file.num_rows}</pre></td>
  <th class="right-aligned"><pre>${readPerfStr}</pre></th>
  <th class="right-aligned"><pre>${loadPerfStr}</pre></th>
  <td style="color:maroon;">${file.error}</td>
  <td><pre>${file.url}</pre></td>
</tr>`;
            }
            this._table().children('tbody').html(html);
            this._set_num_select(numSelect, info.contrib.files.length);
        }
    }
    return IngestContributions;
});
