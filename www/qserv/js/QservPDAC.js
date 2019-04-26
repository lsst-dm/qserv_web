require.config({

    baseUrl: '..',

    waitSeconds: 15,
    urlArgs:     "bust="+new Date().getTime(),

    paths: {
        'jquery':     'https://code.jquery.com/jquery-3.3.1',
        'bootstrap':  'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.bundle',
        'underscore': 'https://underscorejs.org/underscore-min',
        'webfwk':     'webfwk/js',
        'qserv':      'qserv/js'
    },
    shim: {
        'bootstrap':  {
            deps: ['jquery']
        },
        'underscore': {
            exports: '_'
        }
    }
});
require([
    'webfwk/CSSLoader',
    'webfwk/Fwk',
    'webfwk/FwkApplicationControlApp',
    'webfwk/FwkTestApp',
    'webfwk/SimpleTableTestApp',
    `qserv/StatusHeatMap`,
    'qserv/StatusReplicationLevel',
    'qserv/StatusWorkers',
    'qserv/QservWorkerSchedulers',
    'qserv/QservWorkerQueries',
    'qserv/ReplicationController',
    'qserv/ReplicationTools',
    'qserv/ReplicationConfig',
    'qserv/ToolsSql',

    // Make sure the core libraries are preloaded so that the applications
    // won't bother with loading them individually

    'bootstrap',
    'underscore'],

function(CSSLoader,
         Fwk,
         FwkApplicationControlApp,
         FwkTestApp,
         SimpleTableTestApp,
         StatusHeatMap,
         StatusReplicationLevel,
         StatusWorkers,
         QservWorkerSchedulers,
         QservWorkerQueries,
         ReplicationController,
         ReplicationTools,
         ReplicationConfig,
         ToolsSql) {

    CSSLoader.load('https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.css');
    CSSLoader.load('qserv/css/QservPDAC.css');

    $(function() {

        function parseURLParameters() {

            let queryString = window.location.search;
            if (typeof queryString !== 'undefined' && queryString && queryString.length > 2) {
                let queries = queryString.substring(1).split("&");
                for (let i=0; i < queries.length; i++) {
                    let keyVal = queries[i].split('=');
                    if (keyVal.length === 2) {
                        let key = keyVal[0];
                        let val = decodeURIComponent(keyVal[1]);
                        if (key === 'page' && val.length > 2) {
                            let menus = val.split(':');
                            if (menus.length === 2) {
                                console.log("menus: ", menus);
                                return menus;
                            }
                        }
                    }
                }
            }
        }
        var apps = [
            {   name: 'Status',
                apps: [
                    new StatusReplicationLevel('Replication Level'),
                    new StatusWorkers('Workers'),
                    new FwkTestApp('User Queries Monitor'),
                    new StatusHeatMap('Heat Map')
                ]
            },
            {   name: 'Replication',
                apps: [
                    new ReplicationController('Controller'),
                    new ReplicationTools('Tools'),
                    new ReplicationConfig('Configuration')
                ]
            },
            new FwkTestApp('Ingest'),
            {   name: 'Tools',
                apps: [
                    new FwkTestApp('Query Qserv'),
                    new ToolsSql('Query Worker Databases')
                ]
            },
            {   name: 'Qserv Monitor',
                apps: [
                    new QservWorkerSchedulers('Schedulers'),
                    new QservWorkerQueries('Queries in Worker Queues')
                ]
            },
            {   name: 'UI Tests',
                apps: [
                    new SimpleTableTestApp('SimpleTable'),
                    new FwkTestApp('SmartTabble'),
                    new FwkApplicationControlApp('Application Control')
                ]
            }
        ];
        Fwk.build(
            'Qserv [PDAC]',
            apps,
            function() {
                let menus = parseURLParameters();
                if (typeof menus !== 'undefined') {
                    Fwk.show(menus[0], menus[1]);
                } else {
                    Fwk.show('Replication', 'Controller');
                }
            }
        );
    });
});
