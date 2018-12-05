define([
    'webfwk/Class',
    'webfwk/CSSLoader',
    'webfwk/FwkApplication',
    'underscore'],

function(Class,
         CSSLoader,
         FwkApplication) {

    // This is a typical patern - complement each application with
    // the application-speciic CSS. The CSS is supposed to cover artifacts
    // within the application's container.
    CSSLoader.load('webfwk/css/FwkApplicationControlApp.css');

    function FwkApplicationControlApp(name) {

        // This is defined to allow accessing the object's context
        // from the lambda functions.
        var _that = this;

        // Allways call the base class's constructor
        FwkApplication.call(this, name);

        /**
         * Override event handler defined in the base class
         *
         * @see FwkApplication.fwk_app_on_show
         */
        this.fwk_app_on_show = function() {

            // Note that the application name (this.fwk_app_name) comes from the base class
            console.log('show: ' + this.fwk_app_name);

            this.fwk_app_on_update();
        };

        /**
         * Override event handler defined in the base class
         *
         * @see FwkApplication.fwk_app_on_hide
         */
        this.fwk_app_on_hide = function() {
            console.log('hide: ' + this.fwk_app_name);
        };

        // Automatically refresh the page at specified interval only
        this._update_ival_sec = 10;
        this._prev_update_sec = 0;

        /**
         * Override event handler defined in the base class
         *
         * @see FwkApplication.fwk_app_on_update
         */
        this.fwk_app_on_update = function() {

            // Note that the application's state (this.fwk_app_visible) comes from the base class
            if (this.fwk_app_visible) {
                var now_sec = Fwk.now().sec;
                if (now_sec - this._prev_update_sec > this._update_ival_sec) {
                    this._prev_update_sec = now_sec;
                    this._init();
                }
            }
        };

        // Page initialization happesn only once

        this._appPaths = null;
        this._initialized = false;
        this._init = function() {
            if (this._initialized) return;
            this._initialized = true;

            // Note that the application's container (this.fwk_app_container) object (JQuery) comes
            // from the base class
            var html = `
<p>Buttons shown on this page demonstrate the Framework's capability of
  switching between applications.
<p>`;
            this._appPaths = Fwk.appPaths();
            for (var i in this._appPaths) {
                var path = this._appPaths[i];
                var label = path[0] + (_.isUndefined(path[1]) ? '' : '&nbsp;/&nbsp;' + path[1]);
                html += `
<div class="fwk-uitests-appcontrol">
  <button type="button" class="btn btn-secondary btn-sm" id="`+i+`">`+label+`</button>
</div>`;
            }
            this.fwk_app_container.html(html);
            this.fwk_app_container.find('button').on('click', function(e) {
                var i = $(this).attr('id');
                var path = _that._appPaths[i];
                Fwk.show(path[0], path[1]);
            });
        };
    }
    
    // Finally, make this class a subclass of FwkApplication
    Class.define_class(FwkApplicationControlApp, FwkApplication, {}, {});

    // Export the new class to clients via RequireJS
    return FwkApplicationControlApp;
});

