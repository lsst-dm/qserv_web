define([
    'webfwk/CSSLoader',
    'webfwk/Fwk',
    'webfwk/FwkApplication',
    'underscore'],

function(CSSLoader,
         Fwk,
         FwkApplication,
         _) {

    CSSLoader.load('qserv/css/ReplicationController.css');

    class ReplicationController extends FwkApplication {

        /**
         * @returns the default update interval for the page
         */ 
        static update_ival_sec() { return 10; }

        /**
         * @return the maximum number of events to be returned from the Controller's
         *   log in each request.
         */
        static max_log_events() { return 1000; }

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
                if (now_sec - this._prev_update_sec > ReplicationController.update_ival_sec()) {
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

            this._prevTimestamp = 0;

            let html = `
<div class="row">
  <div class="col">
    <h3>Status</h3>
    <table class="table table-sm table-hover" id="fwk-controller-status">
      <caption class="updating">
        Loading...
      </caption>
      <tbody></tbody>
    </table>
  </div>
</div>
<div class="row">
  <div class="col">
    <h3>Event Log</h3>
    <div>
      <button type="button" class="btn btn-outline-primary btn-sm" id="fwk-controller-log-important"
              data-toggle="button"  aria-pressed="false" autocomplete="off">
        Important Events Only
      </button>
      <button type="button" class="btn btn-primary btn-sm" id="fwk-controller-log-details"
              data-toggle="button" aria-pressed="true" autocomplete="off">
        Hide Event Details
      </button>
    </div>
    <table class="table table-sm table-hover" id="fwk-controller-log">
      <thead class="thead-light">
        <tr>
          <th rowspan="2">Timestamp</th>
          <th rowspan="2">Task</th>
          <th rowspan="2">Operation</th>
          <th rowspan="2">Status</th>
          <th colspan="2">Event Details</th>
        </tr>
        <tr>
          <th>flag</th>
          <th>value</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>`;
            this.fwk_app_container.html(html);

            this._buttonImportant().click(() => {
                this._displayLog();
            });
        }
        
        /**
         * Table for displaying the general status of the Master Replication Controller
         * 
         * @returns JQuery table object
         */
        _tableStatus() {
            if (this._tableStatus_obj === undefined) {
                this._tableStatus_obj = this.fwk_app_container.find('table#fwk-controller-status');
            }
            return this._tableStatus_obj;
        }

        /**
         * Table for displaying event log of the current Master Replication Controller
         * 
         * @returns JQuery table object
         */
        _tableLog() {
            if (this._tableLog_obj === undefined) {
                this._tableLog_obj = this.fwk_app_container.find('table#fwk-controller-log');
            }
            return this._tableLog_obj;
        }

        /**
         * Radio button which has a state. If the button is pressed then only "important"
         * events will be displayed in the log.
         *
         * @returns JQuery button object
         */
        _buttonImportant() {
            if (this._buttonImportant_obj === undefined) {
                this._buttonImportant_obj = this.fwk_app_container.find('#fwk-controller-log-important').button();
            }
            return this._buttonImportant_obj;
        }

        /**
         * Check the state of the corresponding toggler
         *
         * @returns 'true' if the button is on
         */
        _importantEventsOnly() {
            return this._buttonImportant().attr('aria-pressed') === 'true';
        }

        _isImportant(event) {
            if (this._importantKeys === undefined) {
                this._importantKeys = [
                    'failed-qserv-worker'
                ];
            }
            for (let i in event.kv_info) {
                let kv = event.kv_info[i];
                for (let k in kv) {
                    if (_.contains(this._importantKeys, k)) return true;
                }
            }
            return false;
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

            this._tableStatus().children('caption').addClass('updating');

            // Get info on the Master Repliction Controller
            Fwk.web_service_GET(
                "/replication/controller",
                {},
                (data) => {
                    for (let i in data.controllers) {
                        let info = data.controllers[i];
                        if (info.current) {
                            this._displayStatus(info);
                            Fwk.setLastUpdate(this._tableStatus().children('caption'));
                            this._tableStatus().children('caption').removeClass('updating');

                            // Laad the Controler's log as well
                            Fwk.web_service_GET(
                                "/replication/controller/" + info.id,
                                {   "log": 1,
                                    "log_from": this._prevTimestamp + 1,     // 1ms later
                                    "log_max_events": ReplicationController.max_log_events()
                                },
                                (data) => {
                                    if (data.log.length > 0) {
                                        this._prevTimestamp = data.log[0].timestamp;
                                    }
                                    this._displayLog(data.log);
                                },
                                (msg) => {
                                    console.log('request failed', this.fwk_app_name, msg);
                                    this._tableStatus().children('caption').html('<span style="color:maroon">No Response</span>');
                                }
                            );
                            break;
                        }
                    }
                    this._loading = false;
                },
                (msg) => {
                    console.log('request failed', this.fwk_app_name, msg);
                    this._tableStatus().children('caption').html('<span style="color:maroon">No Response</span>');
                    this._tableStatus().children('caption').removeClass('updating');
                    this._loading = false;
                }
            );
        }
        
        _displayStatus(info) {

            if (info !== undefined) this._controllerInfo = info;
            if (this._controllerInfo === undefined) return;

            let started = new Date(this._controllerInfo.start_time);
            let html = `
<tr>
  <th style="text-align:left" scope="row">Status</th>
  <td style="text-align:left"><pre>RUNNING</pre></td>
</tr>
<tr>
  <th style="text-align:left" scope="row">id</th>
  <td style="text-align:left"><pre>` + this._controllerInfo.id + `</pre></td>
</tr>
<tr>
  <th style="text-align:left" scope="row">Started</th>
  <td style="text-align:left"><pre>` + started.toLocalTimeString() + `</pre></td>
</tr>
<tr>
  <th style="text-align:left" scope="row">Host</th>
  <td style="text-align:left"><pre>` + this._controllerInfo.hostname + `</pre></td>
</tr>
<tr>
  <th style="text-align:left" scope="row">PID</th>
  <td style="text-align:left"><pre>` + this._controllerInfo.pid + `</pre></td>
</tr>`;
            this._tableStatus().children('tbody').html(html);
        }

        _displayLog(log) {

            if (log !== undefined) this._controllerLog = log;
            if (this._controllerLog === undefined) return;

            let html = '';
            for (let i in this._controllerLog) {
                let event = this._controllerLog[i];
                if (this._importantEventsOnly() && !this._isImportant(event)) continue;
                let warningCssClass = this._isImportant(event) ? 'class="table-warning"' : '' ;
                let timestamp = new Date(event.timestamp);
                let rowspanAttr = event.kv_info.length === 0
                    ? '' : 'rowspan="' + (event.kv_info.length + 1) + '"';
                html += `
<tr>
  <th ` + rowspanAttr + ` scope="row"><pre>` + timestamp.toLocalTimeString() + `</pre></th>
  <td ` + rowspanAttr + `><pre>` + event.task      + `</pre></td>
  <td ` + rowspanAttr + `><pre>` + event.operation + `</pre></td>
  <td ` + rowspanAttr + `><pre>` + event.status    + `</pre></td>
</tr>`;
                if (event.kv_info.length !== 0) {
                    for (let j in event.kv_info) {
                        let kv = event.kv_info[j];
                        for (let k in kv) {
                            html += `
<tr ` + warningCssClass + `>
  <th scope=row"><pre>` + k + `</pre></th>
  <td>` + kv[k] + `</td>
</tr>`;
                        }
                    }
                }
            }
            this._tableLog().children('tbody').html(html + this._tableLog().children('tbody').html());
        }
    }
    return ReplicationController;
});
