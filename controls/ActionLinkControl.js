REQUIRE('ria.mvc.LinkControl');

NAMESPACE('ria.controls', function () {

    var lastClickedNode = null;
    var ME = null;

    /** @class ria.controls.ActionLinkControl */
    CLASS(
        'ActionLinkControl', EXTENDS(ria.mvc.LinkControl), [
            function $() {
                BASE();
                ME = this;
            },

            [ria.mvc.DomEventBind('click', 'A[data-link]:not(.disabled, .pressed)')],
            [[ria.dom.Dom, ria.dom.Event]],
            Boolean, function onActionLinkClick(node, event) {
                lastClickedNode = node;

                var args = this.parseLink_(node.getData('link')),
                    controller = args.shift(),
                    action = args.shift();

                this.updateState_(controller, action, args);

                event.preventDefault();
                return false;
            },

            ria.dom.Dom, function LAST_CLICKED() {
                return lastClickedNode;
            },

            [[Object]],
            function PREPARE(attributes, args) {
                attributes.href=attributes.href || 'javascript:';
                attributes['data-link'] = ria.mvc.LinkControl.LINK(args);
                return ME.prepareAttributes_(attributes);
            }
        ]);
});