/**
 * Usage:
 * window.$$ = ria.dom.Dom;
 * $$('A')
 *      .on('click', function(node, event) {
 *          return true;
 *      })
 *      .off('click', handler)
 *      .on('click', 'span', function (node, event) {
 *
 *      })
 *      .off('click', 'span', handler)
 */

REQUIRE('ria.dom.Dom');

NAMESPACE('ria.dom', function () {
    "use strict";

    if ('undefined' === typeof jQuery)
        throw Error('jQuery is not defined.');

    var global = ('undefined' !== typeof window ? window.document : null);

    ria.dom.Event = Object; // jQuery modifies event


    $.fn.Dom = function() {
        return ria.dom.Dom(this);
    };


    /** @class ria.dom.jQueryDom */
    CLASS(
        'jQueryDom', EXTENDS(ria.dom.Dom), [

            /* UNSAFE CLASS INITIALIZER */
            OVERRIDE, function $$(instance, clazz, ctor, args) {
                var genericTypes = [],
                    genericSpecs = [];

                var __META = clazz.__META;

                if (!(instance instanceof clazz))
                    instance = ria.__API.getInstanceOf(clazz);

                if (!_RELEASE) {
                    var __pre = __META.__precalc;
                    for (var i = 0; i < __pre.length;) {
                        var name_ = __pre[i],
                            f_ = __pre[i + 1],
                            meta_ = f_.__META;


                        var fn = ria.__API.getPipelineMethodCallProxyFor(f_, meta_, instance, genericTypes, genericSpecs);
                        if (_DEBUG) {
                            Object.defineProperty(instance, name_, { writable: false, configurable: false, enumerable: false, value: fn });
                        } else {
                            instance[name_] = fn;
                        }

                        i += 2;
                    }

                    if (ctor.__META) {
                        ctor = ria.__API.getPipelineMethodCallProxyFor(ctor, ctor.__META, instance, genericTypes, genericSpecs);
                    }
                }

                if (_DEBUG) for(var name in clazz.__META.properties) {
                    if (clazz.__META.properties.hasOwnProperty(name)) {
                        instance[name] = null;
                    }
                }

                ctor.apply(instance, args);

                _DEBUG && Object.seal(instance);

                return instance;
            },

            function $(dom_) {
                BASE();
                VALIDATE_ARG('dom_', [Node, String, ArrayOf(Node), ria.dom.Dom, jQuery], dom_);

                this._dom = jQuery(global);

                if ('string' === typeof dom_) {
                  this._dom  = this.find(dom_).valueOf();
                } else if (Array.isArray(dom_)) {
                  this._dom = dom_;
                } else if (dom_ instanceof Node) {
                  this._dom = [dom_];
                } else if (dom_ instanceof NodeList) {
                  this._dom = ria.__API.clone(dom_);
                } else if (dom_ instanceof ria.dom.Dom) {
                  this._dom = dom_.valueOf();
                } if (dom_ instanceof jQuery) {
                    this._dom = dom_.get();
                }

                Object.defineProperty(this, '$', {
                    get: function () {
                       return jQuery(this._dom);
                    }.bind(this)
                });
            },

            /* Search tree */

            [[String]],
            OVERRIDE, ria.dom.Dom, function find(selector) {
                return new ria.dom.Dom(jQuery(selector, this._dom.$));
            },

            /* parseHTML - make static */

            [[String]],
            OVERRIDE, ria.dom.Dom, function fromHTML(html) {
                this._dom = jQuery(jQuery.parseHTML(html)).get();
                return this;
            },

            /* Form */

            Object, function serialize(){
                var o = {};
                var array = this.$.serializeArray();
                array.forEach(function() {
                    if (o[this.name] !== undefined) {
                        if (!o[this.name].push) {
                            o[this.name] = [o[this.name]];
                        }
                        o[this.name].push(this.value || '');
                    } else {
                        o[this.name] = this.value || '';
                    }
                });
                return o;
            }
        ]);

    ria.dom.Dom.SET_IMPL(ria.dom.jQueryDom);
});
