define([
    'webfwk/CSSLoader',
    'webfwk/Fwk',
    'webfwk/FwkApplication',
    'underscore'],

function(CSSLoader,
         Fwk,
         FwkApplication) {

    CSSLoader.load('qserv/css/IngestTransactions.css');

    class IngestTransactions extends FwkApplication {


        /// @returns the default update interval for the page
        static update_ival_sec() { return 2; }

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
                if (now_sec - this._prev_update_sec > IngestTransactions.update_ival_sec()) {
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
  <div class="col">
    <table class="table table-sm table-hover table-bordered" id="fwk-ingest-transactions">
      <thead class="thead-light">
        <tr>
          <th>database</th>
          <th>#chunks</th>
          <th>id</th>
          <th>state</th>
          <th>begin time</th>
          <th>commit/abort time</th>
        </tr>
      </thead>
      <caption class="updating">Loading...</caption>
      <tbody></tbody>
    </table>
  </div>
</div>`;
            this.fwk_app_container.html(html);
        }
        
        /// @returns JQuery table object displaying the transactions
        _table() {
            if (this._table_obj === undefined) {
                this._table_obj = this.fwk_app_container.find('table#fwk-ingest-transactions');
            }
            return this._table_obj;
        }

        /**
         * Load data from a web servie then render it to the application's page.
         */
        _load() {
            if (this._loading === undefined) this._loading = false;
            if (this._loading) return;
            this._loading = true;

            this._table().children('caption').addClass('updating');

            Fwk.web_service_GET(
                "/ingest/v1/trans",
                {},
                (data) => {
                    this._display(data.databases);
                    Fwk.setLastUpdate(this._table().children('caption'));
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
         * @param {Object} databases  transactions and other relevant info for unpublished databases
         */
        _display(databases) {
            let html = '';
            for (let database in databases) {
                let databaseInfo = databases[database];

                let html=`
<tr>
  <th rowspan="${databaseInfo.transactions.length+1}"><pre>${database}</pre></th>
  <td rowspan="${databaseInfo.transactions.length+1}"><pre>${databaseInfo.num_chunks}</pre></td>
</tr>`;
                for (let i in databaseInfo.transactions) {
                    let transactionInfo = databaseInfo.transactions[i];
                    let transactionCssClass = 'bg-white';
                    switch (transactionInfo.state) {
                        case 'STARTED':  transactionCssClass = 'bg-light';   break;
                        case 'FINISHED': transactionCssClass = 'bg-success'; break;
                        case 'ABORTED':  transactionCssClass = 'bg-danger';  break;
                    }
                    html += `
<tr class="${transactionCssClass}">
  <th><pre>${databaseInfo.id}</pre></th>
  <td><pre>${databaseInfo.state}</pre></th>
  <td><pre>${databaseInfo.begin_time}</pre></th>
  <td><pre>${databaseInfo.end_time}</pre></th>
</tr>`;
                }
            }
            this._table().children('tbody').html(html);
        }
    }
    return IngestTransactions;
});
