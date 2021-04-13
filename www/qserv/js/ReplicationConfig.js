define([
    'webfwk/CSSLoader',
    'webfwk/Fwk',
    'webfwk/FwkApplication',
    'underscore'],

function(CSSLoader,
         Fwk,
         FwkApplication,
         _) {

    CSSLoader.load('qserv/css/ReplicationConfig.css');

    class ReplicationConfig extends FwkApplication {

        /**
         * @returns the default update interval for the page
         */ 
        static update_ival_sec() { return 10; }

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
                if (now_sec - this._prev_update_sec > ReplicationConfig.update_ival_sec()) {
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
    <h3>General Parameters</h3>
    <table class="table table-sm table-hover" id="fwk-controller-config-general">
      <caption class="updating">
        Loading...
      </caption>
      <thead class="thead-light">
        <tr>
          <th>parameter</th>
          <th>value</th>
          <th>description</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>
<div class="row">
  <div class="col">
    <h3>Workers</h3>
    <table class="table table-sm table-hover" id="fwk-controller-config-workers">
      <thead class="thead-light">
        <tr>
          <th>name</th>
          <th>enabled</th>
          <th>read-only</th>
          <th>Repl svc</th>
          <th>:port</th>
          <th>File svc</th>
          <th>:port</th>
          <th>Qserv Db svc</th>
          <th>:port</th>
          <th>Ingest svc</th>
          <th>:port</th>
          <th>Exporter svc</th>
          <th>:port</th>
          <th>HTTP Ingest svc</th>
          <th>:port</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>
<div class="row">
  <div class="col">
    <h3>Catalogs</h3>
    <table class="table table-sm table-hover table-borderless" id="fwk-controller-config-catalogs">
      <thead class="thead-light">
        <tr>
          <th>Family</th>
          <th>stripes</th>
          <th>sub-stripes</th>
          <th>repl level</th>
          <th>Database</th>
          <th>published</th>
          <th>Table</th>
          <th>partitioned</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>`;
            this.fwk_app_container.html(html);
        }

        /**
         * Table for displaying the general Configuration parameters
         * 
         * @returns JQuery table object
         */
        _tableGeneral() {
            if (this._tableGeneral_obj === undefined) {
                this._tableGeneral_obj = this.fwk_app_container.find('table#fwk-controller-config-general');
            }
            return this._tableGeneral_obj;
        }

        /**
         * Table for displaying Configuration parameters of the workers
         * 
         * @returns JQuery table object
         */
        _tableWorkers() {
            if (this._tableWorkers_obj === undefined) {
                this._tableWorkers_obj = this.fwk_app_container.find('table#fwk-controller-config-workers');
            }
            return this._tableWorkers_obj;
        }

       /**
         * Table for displaying Configuration parameters of the catalogs
         * 
         * @returns JQuery table object
         */
        _tableCatalogs() {
            if (this._tableCatalogs_obj === undefined) {
                this._tableCatalogs_obj = this.fwk_app_container.find('table#fwk-controller-config-catalogs');
            }
            return this._tableCatalogs_obj;
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

            this._tableGeneral().children('caption').addClass('updating');
            Fwk.web_service_GET(
                "/replication/config",
                {},
                (data) => {
                    this._display(data);
                    Fwk.setLastUpdate(this._tableGeneral().children('caption'));
                    this._tableGeneral().children('caption').removeClass('updating');
                    this._loading = false;
                },
                (msg) => {
                    this._tableGeneral().children('caption').html('<span style="color:maroon">No Response</span>');
                    this._tableGeneral().children('caption').removeClass('updating');
                    this._tableGeneral().children('caption').removeClass('updating');
                    this._loading = false;
                }
            );
        }

        /**
         * Display the configuration
         */
        _display(data) {
            const config = data.config;
            let html = '';
            for (const category in config.general) {
                for (const param in config.general[category]) {
                    const value = config.general[category][param];
                    html += `
<tr>
  <th style="text-align:left" scope="row"><pre>` + category + '.' + param + `</pre></th>
  <td><pre>` + value + `</pre></td>
  <td>` + config.meta[category][param].description + `</td>
</tr>`;
                }
            }
            this._tableGeneral().children('tbody').html(html);

            html = '';
            for (let i in config.workers) {
                let worker = config.workers[i];
                let workerEnabledCssClass  = worker.is_enabled   ? '' : 'class="table-warning"';
                let workerReadOnlyCssClass = worker.is_read_only ? 'class="table-warning"' : '';
                html += `
<tr>
  <th style="text-align:left" scope="row"><pre>` + worker.name + `</pre></th>
  <td ` + workerEnabledCssClass  + `><pre>` + (worker.is_enabled ? 'yes' : 'no') + `</pre></td>
  <td ` + workerReadOnlyCssClass + `><pre>` + (worker.is_read_only ? 'yes' : 'no') + `</pre></td>
  <td><pre>` + worker.svc_host + `</pre></td>
  <td><pre>` + worker.svc_port + `</pre></td>
  <td><pre>` + worker.fs_host + `</pre></td>
  <td><pre>` + worker.fs_port + `</pre></td>
  <td><pre>` + worker.db_host + `</pre></td>
  <td><pre>` + worker.db_port + `</pre></td>
  <td><pre>` + worker.loader_host + `</pre></td>
  <td><pre>` + worker.loader_port + `</pre></td>
  <td><pre>` + worker.exporter_host + `</pre></td>
  <td><pre>` + worker.exporter_port + `</pre></td>
  <td><pre>` + worker.http_loader_host + `</pre></td>
  <td><pre>` + worker.http_loader_port + `</pre></td>

</tr>`;
            }
            this._tableWorkers().children('tbody').html(html);

            // Organize family descriptors as a dictionary where the key would be
            // the name of a family. Extend each family descriptor with an array
            // storying the dependent database descriptors.
            // will get stored
            let families = {};
            for (let i in config.database_families) {
                let familyInfo = config.database_families[i];
                familyInfo['databases'] = [];
                families[familyInfo.name] = familyInfo;
            }
            for (let i in config.databases) {
                let databaseInfo = config.databases[i];
                families[databaseInfo.family_name]['databases'].push(databaseInfo);
            }

            html = '';
            for (let i in families) {
                let family = families[i];
                let familyRowSpan = 1;

                let familyHtml = '';
                for (let j in family['databases']) {
                    let database = family['databases'][j];
console.log(database);
                    let databaseRowSpan = 1;
                    familyRowSpan += databaseRowSpan;

                    let databaseHtml = '';
                    for (let k in database.tables) {
                        let table = database.tables[k];
                        databaseRowSpan++;
                        familyRowSpan++;
                        databaseHtml += `
<tr ` + (k == database.tables.length - 1 ? ' style="border-bottom: solid 1px #dee2e6"' : '') + `>
  <th scope="row"><pre>${table.name}</pre></th>
  <td><pre>` + (table.is_partitioned ? 'yes' : 'no') + `</pre></td>
</tr>`;
                    }
                    familyHtml += `
<tr style="border-bottom: solid 1px #dee2e6">
  <td rowspan="${databaseRowSpan}" style="vertical-align:middle;">${database.database}</td>
  <td rowspan="${databaseRowSpan}" style="vertical-align:middle; border-right: solid 1px #dee2e6">${database.is_published ? 'yes' : 'no'}</td>
</tr>` + databaseHtml;
                }
                html += `
<tr style="border-bottom: solid 1px #dee2e6">
  <th rowspan="${familyRowSpan}" style="vertical-align:middle" scope="row">${family.name}</th>
  <td rowspan="${familyRowSpan}" style="vertical-align:middle"><pre>${family.num_stripes}</pre></td>
  <td rowspan="${familyRowSpan}" style="vertical-align:middle"><pre>${family.num_sub_stripes}</pre></td>
  <th rowspan="${familyRowSpan}" style="vertical-align:middle; border-right: solid 1px #dee2e6" scope="row"><pre>${family.min_replication_level}</pre></th>
</tr>` + familyHtml;
            }
            this._tableCatalogs().children('tbody').html(html);
        }
    }
    return ReplicationConfig;
});

