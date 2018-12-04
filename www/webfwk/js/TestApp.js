define([
    'webfwk/Class',
    'webfwk/CSSLoader',
    'webfwk/FwkApplication',
    'underscore'],

function(Class,
         CSSLoader,
         FwkApplication) {

    CSSLoader.load('webfwk/css/TestApp.css');

    function TestApp(name) {

        var _that = this;

        // Allways call the base class's constructor
        FwkApplication.call(this, name);

        /**
         * Override event handler defined in the base class
         *
         * @see FwkApplication.on_show
         */
        this.on_show = function() {
            console.log('show: ' + this.name);
            this.on_update();
        };

        this.on_hide = function() {
            console.log('hide: ' + this.name);
        };

        // Automatically refresh the page at specified interval only

        this._update_ival_sec = 10;
        this._prev_update_sec = 0;

        this.on_update = function() {
            if (this.visible) {
                var now_sec = Fwk.now().sec;
                if (now_sec - this._prev_update_sec > this._update_ival_sec) {
                    this._prev_update_sec = now_sec;
                    this._init();
                    this._load();
                }
            }
        };

        this._initialized = false;
        this._init = function() {
            if (this._initialized) return;
            this._initialized = true;
            this.container.html(
                '<p>This is a placeholder for application <span class="fwk-test-app-name">'+this.name+'</span></p>'
            );
        };

        this._load = function() {
            console.log('load: ' + this.name);
        };
    }
    Class.define_class(TestApp, FwkApplication, {}, {});

    return TestApp;
});

