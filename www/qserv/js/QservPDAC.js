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
         ReplicationController,
         ReplicationTools,
         ReplicationConfig,
         ToolsSql) {

    CSSLoader.load('https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.css');
    CSSLoader.load('qserv/css/QservPDAC.css');

    $(function() {

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
                    new ToolsSql('Query Qserv Workers')
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
                console.log('Fwk.on_init');
                Fwk.show('Tools', 'Query Qserv Workers');
            }
        );
    });
});
