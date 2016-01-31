/**
 * Created by viatsyshyn on 24.10.13.
 */

NAMESPACE('ria.dom', function () {
    "use strict";

    function def(data, def) {
        return ria.__API.merge(data || {}, def);
    }

	var window = _GLOBAL;
    var Node = _BROWSER ? _GLOBAL.Node : Object;

    /** @class ria.dom.Events */
    CLASS(
        FINAL, 'Events', [
            READONLY, String, 'clazz',
            READONLY, String, 'type',
            READONLY, Object, 'data',

            [[String, String, Object]],
            function $(clazz, type, data_) {
                BASE();
                this.clazz = clazz;
                this.type = type;
                this.data = def(data_, {});
            },

            [[Node]],
            function triggerOn(node) {
                try {
                    if (document.createEvent) {
                        try {
                            var event = new (window[this.clazz])(this.type, this.data);
                        } catch (e) {
                            // this is ms ie 10+ way
                            event = document.createEvent(this.clazz);
                            event.initEvent(this.type, !!this.data.bubbles, !!this.data.cancelable);
                        }
                        node.dispatchEvent(event);
                    } else {
                        // this is IE9- way
                        var evt = document.createEventObject();
                        node.fireEvent("on" + evt.type, evt);
                    }
                } catch (e) {
                    Assert(true, e.toString());
                }
            },

            SELF, function CLICK(data_) {
                return new SELF('MouseEvent', 'click', def(data_, {
                    'view': window,
                    'bubbles': true,
                    'cancelable': true
                }))
            },

            SELF, function FOCUS(data_) {
                return new SELF('FocusEvent', 'focus', def(data_, {
                    'view': window,
                    'bubbles': true,
                    'cancelable': true
                }));
            },

            SELF, function BLUR(data_) {
                return new SELF('BlurEvent', 'blur', def(data_, {
                    'view': window,
                    'bubbles': true,
                    'cancelable': true
                }));
            },

            SELF, function CHANGE(data_) {
                return new SELF('UIEvent', 'change', def(data_, {
                    'view': window,
                    'bubbles': true,
                    'cancelable': true
                }));
            },

            SELF, function KEY_UP(data_) {
                return new SELF('KeyboardEvent', 'keyup', def(data_, {
                    'view': window,
                    'bubbles': true,
                    'cancelable': true
                }));
            },

            SELF, function KEY_DOWN(data_) {
                return new SELF('KeyboardEvent', 'keydown', def(data_, {
                    'view': window,
                    'bubbles': true,
                    'cancelable': true
                }));
            },

            SELF, function SUBMIT(data_) {
                return new SELF('UIEvent', 'submit', def(data_, {
                                    'view': window,
                                    'bubbles': true,
                                    'cancelable': true
                                }));
            }
        ])
});
