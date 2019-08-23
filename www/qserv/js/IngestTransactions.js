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
          <th class="right-aligned">published</th>
          <th class="right-aligned">#chunks</th>
          <th class="right-aligned">id</th>
          <th class="center-aligned">state</th>
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
                {family: '', all_databases: 1},
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

            /* Translate a dictionary of database descriptors into a reverse sorted
             * array of the descriptors. The elements of the resulting array will be stored
             * by the maximum value of the transaction identifiers in the descending order.
             * The idea here is to show newer databases on the top of the table.
             */
            let listOfDatabases = _.sortBy(
                /* The mapping function will return an array of descriptors */
                _.map(
                    databases,
                    function(databaseInfo) { return databaseInfo; }
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
                let database = databaseInfo.info.name;
                let rowCssStyle = databaseInfo.info.is_published ? ' style="background-color: #f8f8f8;" ' : '';
                if (databaseInfo.transactions.length === 0) {
                    html += `
<tr ${rowCssStyle}>
  <th rowspan="2"><pre>${database}</pre></th>
  <td rowspan="2" class="right-aligned"><pre>${databaseInfo.info.is_published ? 'yes': 'no'}</pre></td>
  <td rowspan="2" class="right-aligned"><pre>${databaseInfo.num_chunks}</pre></td>
</tr>
<tr ${rowCssStyle}>
  <th>&nbsp;</th>
  <td>&nbsp;</th>
  <td>&nbsp;</th>
  <td>&nbsp;</th>
</tr>`;
                } else {
                    html += `
<tr ${rowCssStyle}>
  <th rowspan="${databaseInfo.transactions.length+1}"><pre>${database}</pre></th>
  <td rowspan="${databaseInfo.transactions.length+1}" class="right-aligned"><pre>${databaseInfo.info.is_published ? 'yes': 'no'}</pre></td>
  <td rowspan="${databaseInfo.transactions.length+1}" class="right-aligned"><pre>${databaseInfo.num_chunks}</pre></td>
</tr>`;
                    for (let i in databaseInfo.transactions) {
                        let transactionInfo = databaseInfo.transactions[i];
                        let transactionCssClass = 'bg-white';
                        switch (transactionInfo.state) {
                            case 'STARTED':  transactionCssClass = 'bg-transparent'; break;
                            case 'FINISHED': transactionCssClass = 'alert alert-success'; break;
                            case 'ABORTED':  transactionCssClass = 'alert alert-danger'; break;
                        }
                        let beginTimeStr = (new Date(transactionInfo.begin_time)).toLocalTimeString('is');
                        let endTimeStr = transactionInfo.end_time === 0 ? '' : (new Date(transactionInfo.end_time)).toLocalTimeString('iso');
                        html += `
<tr ${rowCssStyle}>
  <th class="right-aligned"><pre>${transactionInfo.id}</pre></th>
  <td class=" center-aligned ${transactionCssClass}"><pre>${transactionInfo.state}</pre></th>
  <td><pre>${beginTimeStr}</pre></th>
  <td><pre>${endTimeStr}</pre></th>
</tr>`;
                    }
                }
            }
            this._table().children('tbody').html(html);
        }
    }
    return IngestTransactions;
});
