define([
    'webfwk/CSSLoader',
    'webfwk/Fwk',
    'webfwk/FwkApplication',
    'underscore'],

function(CSSLoader,
         Fwk,
         FwkApplication) {

    CSSLoader.load('qserv/css/ToolsSql.css');

    class ToolsSql extends FwkApplication {

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
                this._init();
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
<div id="fwk-tools-sql">
  <div class="row">
    <div class="col">
      <p>This tool allows executing queries directly against the <span style="font-weight:bold;">MariaDB</span>
        service of a <span style="font-weight:bold;">Qserv</span> worker. For queries which produce a result set
        the result will be displayed as a table below the form. Errors will be also reported.
        Please, <span style="font-weight:bold;">DO NOT</span> launch queries which may produce millions of rows.
        An attept to do so will make thsi applicatio unresponsive.
        Use <span style="font-style:italic;">SELECT COUNT(*)</span> first.
      </p>
    </div>
  </div>
  <div class="row">
    <div class="col-3">
      <input type="text" class="form-control" placeholder="Worker" id="worker">
    </div>
    <div class="col-3">
      <input type="text" class="form-control" placeholder="User" id="user">
    </div>
    <div class="col-3">
      <input type="password" class="form-control" placeholder="Password" id="password">
    </div>
    <div class="col-3">
      <button class="btn btn-primary   btn-sm" id="execute">Execute</button>
      <button class="btn btn-secondary btn-sm" id="reset"  >Reset form</button>
    </div>
  </div>
  <div class="row">
    <div class="col">
      <textarea rows="3" class="form-control" placeholder="Query" id="query"></textarea>
    </div>
  </div>
  <div class="row">
    <div class="col">
      <table class="table table-sm table-hover table-bordered" id="fwk-tools-sql-resultset">
        <caption></caption>
        <thead class="thead-light">
        </thead>
        <tbody></tbody>
      </table>
    </div>
  </div>
</div>`;
            this.fwk_app_container.html(html);
            this.fwk_app_container.find('button#execute').click(() => {
                this._load();
            });
            this.fwk_app_container.find('button#reset').click(() => {
                this._worker().val('');
                this._user().val('');
                this._password().val('');
                this._query().val('');
            });
        }

        // Inputs

        _worker() {
            if (this._worker_obj === undefined) {
                this._worker_obj = this.fwk_app_container.find('input#worker');
            }
            return this._worker_obj;
        }
        _user() {
            if (this._user_obj === undefined) {
                this._user_obj = this.fwk_app_container.find('input#user');
            }
            return this._user_obj;
        }
        _password() {
            if (this._password_obj === undefined) {
                this._password_obj = this.fwk_app_container.find('input#password');
            }
            return this._password_obj;
        }
        _query() {
            if (this._query_obj === undefined) {
                this._query_obj = this.fwk_app_container.find('textarea#query');
            }
            return this._query_obj;
        }

        /**
         * The table for displaying result sets of queries
         * @returns JQuery table object
         */
        _table() {
            if (this._table_obj === undefined) {
                this._table_obj = this.fwk_app_container.find('table#fwk-tools-sql-resultset');
            }
            return this._table_obj;
        }

        /**
         * Load data from a web servie then render it to the application's page.
         */
        _load() {
            if (this._loading === undefined) {
                this._loading = false;
            }
            if (this._loading) return;
            this._loading = true;

            if (this._table().children('caption').html() === '') this._table().children('caption').html('updating...');
            this._table().children('caption').removeClass('error').addClass('updating');
            Fwk.web_service_POST(
                "/replication/v1/sql/query",
                {   'worker':   this._worker().val(),
                    'user':     this._user().val(),
                    'password': this._password().val(),
                    'query':    this._query().val()
                },
                (data) => {
                    Fwk.setLastUpdate(this._table().children('caption'));
                    this._table().children('caption').removeClass('updating');
                    this._display(data);
                    this._loading = false;
                },
                (msg) => {
                    this._table().children('caption').removeClass('updating');
                    this._table().children('caption').addClass('error').text(msg);
                    this._loading = false;
                }
            );
        }
        
        /**
         * Analyze and render result sets or error
         */
        _display(data) {
            console.log(data);
            if (data.status !== 'FINISHED::SUCCESS::EXT_STATUS_NONE') {
                this._table().children('thead').html('');
                this._table().children('tbody').html('');
                this._table().children('caption').addClass('error').text(data.result_set.error);
                return;
            }

            let html = `<tr>`;
            for (let columnIdx in data.result_set.fields) {
                html += `<th>${data.result_set.fields[columnIdx].name.value}</th>`;
            }
            html += `</tr>`;
            this._table().children('thead').html(html);

            html = ``;
            for (let rowIdx in data.result_set.rows) {
                let row = data.result_set.rows[rowIdx];
                html += `<tr>`;
                for (let columnIdx in row.cells) {
                    let value = row.nulls[columnIdx] ? 'NULL' : row.cells[columnIdx];
                    html += `<td><pre>${value}</pre></td>`;
                }
                html += `</tr>`;
            }
            this._table().children('tbody').html(html);
        }
    }
    return ToolsSql;
});
