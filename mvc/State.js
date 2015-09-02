NAMESPACE('ria.mvc', function() {
    "use strict";

    /**
     * @class ria.mvc.State
     */
    CLASS(
        'State', [
            String, 'controller',
            String, 'action',
            Array, 'params',
            Boolean, 'dispatched',

            function $() {
                BASE();
                this.dispatched = false;
            },

            function setPublic(val){
                //todo: remove this
            }


        ]);
});