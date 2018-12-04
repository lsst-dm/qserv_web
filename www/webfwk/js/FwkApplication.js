define([] ,

function() {

    /**
     * @brief The base class for user-defined applications.
     *
     * @returns {FwkApplication}
     */
    function FwkApplication(name) {

        this.name = name;
        this.container = null;
        this.visible = false;

        this.show = function() {
            if (!this.visible){
                this.visible = true;
                this.on_show();
            }
        };
        this.hide = function() {
            if (this.visible){
                this.visible = false;
                this.on_hide();
            }
        };
        this.update = function() {
            this.on_update();
        };

        // These methods are supposed to be implemented by derived classes

        this.on_show   = function() { console.log('FwkApplication::on_show() NOT IMPLEMENTED'); };
        this.on_hide   = function() { console.log('FwkApplication::on_hide() NOT IMPLEMENTED'); };
        this.on_update = function() { console.log('FwkApplication::on_update() NOT IMPLEMENTED'); };
    }
    return FwkApplication;
});
