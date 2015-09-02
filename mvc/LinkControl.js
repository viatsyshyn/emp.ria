REQUIRE('ria.mvc.DomControl');

NAMESPACE('ria.mvc', function () {
    "use strict";

    /** @class ria.mvc.LinkControl */
    CLASS(ABSTRACT,
        'LinkControl', EXTENDS(ria.mvc.DomControl), [

            String, function LINK(args) {
                return encodeURIComponent(ria.__API.clone(args).map(function(_) { return Array.isArray(_)
                    ? '[' + _.map(function(x){return JSON.stringify(x.valueOf())}).join(',') + ']'
                    : JSON.stringify(_.valueOf ? _.valueOf() : _) }).join(','));
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