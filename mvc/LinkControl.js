REQUIRE('ria.mvc.DomControl');

NAMESPACE('ria.mvc', function () {
    "use strict";

    function stringify(x) {
        return JSON.stringify( x && (x.valueOf ? x.valueOf() : x) );
    }

    function mapLinkArg(x) {
        return Array.isArray(x)
            ? '[' + x.map(stringify).join(',') + ']'
            : stringify(x)
    }

    /** @class ria.mvc.LinkControl */
    CLASS(ABSTRACT,
        'LinkControl', EXTENDS(ria.mvc.DomControl), [

            String, function LINK(args) {
                //noinspection JSConstructorReturnsPrimitive
                return encodeURIComponent(ria.__API.clone(args).map(mapLinkArg).join(','));
            },

            [[String]],
            Array, function parseLink_(link) {
                return JSON.parse(String('[' + decodeURIComponent(link) + ']'));
            },

            VOID, function updateState_(controller, action, args) {
                setTimeout(function(){
                    var state = this.context.getState();
                    state.setController(controller);
                    state.setAction(action);
                    state.setParams(args);
                    this.context.stateUpdated();
                }.bind(this),1)
            }
        ]);
});
