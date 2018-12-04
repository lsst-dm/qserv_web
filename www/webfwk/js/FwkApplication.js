define([] ,

function() {

    /**
     * @brief The base class for user-defined applications.
     *
     * @returns {FwkApplication}
     */
    function FwkApplication(name) {

        this.fwk_app_name = name;
        this.fwk_app_container = null;
        this.fwk_app_visible = false;

        this.show = function() {
            if (!this.fwk_app_visible){
                this.fwk_app_visible = true;
                this.fwk_app_on_show();
            }
        };
        this.hide = function() {
            if (this.fwk_app_visible){
                this.fwk_app_visible = false;
                this.fwk_app_on_hide();
            }
        };
        this.update = function() {
            this.fwk_app_on_update();
        };

        // These methods are supposed to be implemented by derived classes

        this.fwk_app_on_show   = function() { console.log('FwkApplication::fwk_app_on_show() NOT IMPLEMENTED'); };
        this.fwk_app_on_hide   = function() { console.log('FwkApplication::fwk_app_on_hide() NOT IMPLEMENTED'); };
        this.fwk_app_on_update = function() { console.log('FwkApplication::fwk_app_on_update() NOT IMPLEMENTED'); };
    }
    return FwkApplication;
});
