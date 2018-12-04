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
    'webfwk/SimpleTableTest',
    'webfwk/StatusReplicationLevel',
    'webfwk/StatusWorkers',
    'webfwk/TestApp',

    // Make sure the core libraries are preloaded so that the applications
    // won't bother with loading them individually

    'bootstrap',
    'underscore'],

function(CSSLoader,
         Fwk,
         SimpleTableTest,
         StatusReplicationLevel,
         StatusWorkers,
         TestApp) {

    CSSLoader.load('https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.css');
    CSSLoader.load('webfwk/css/test_fwk.css');

    $(function() {

        var apps = [
            {   name: 'Status',
                apps: [
                    new StatusReplicationLevel('Replication Level'),
                    new StatusWorkers('Workers'),
                    new TestApp('User Queries'),
                    new TestApp('Heat Map')
                ]
            },

            new TestApp('Replication'),
            new TestApp('Ingest'),

            {   name: 'UI Tests',
                apps: [
                    new SimpleTableTest('SimpleTable'),
                    new TestApp('SmartTabble')
                ]
            }
        ];
        Fwk.build(
            'Qserv [PDAC]',
            apps,
            function() {
                console.log('Fwk.on_init');
                Fwk.show('Status', 'Replication Level');
            }
        );
    });
});
