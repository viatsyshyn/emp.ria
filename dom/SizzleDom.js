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

    if ('undefined' === typeof Sizzle)
        throw Error('Sizzle is not defined.');

    /** @class ria.dom.SizzleDom */
    CLASS(
        'SizzleDom', EXTENDS(ria.dom.Dom), [

            /* UNSAFE CLASS INITIALIZER */
            OVERRIDE, function $$(instance, clazz, ctor, args) {
                var genericTypes = [],
                    genericSpecs = [];

                var __META = clazz.__META;

                if (!(instance instanceof clazz))
                    instance = ria.__API.getInstanceOf(clazz);

                if (!_RELEASE) {
                    var __pre = __META.__precalc;
                    for(var i = 0 ; i < __pre.length;) {
                        var name_ = __pre[i],
                            f_ = __pre[i+1],
                            meta_ = f_.__META;

                        var fn = ria.__API.getPipelineMethodCallProxyFor(f_, meta_, instance, genericTypes, genericSpecs);
                        if (_DEBUG) {
                            Object.defineProperty(instance, name_, { writable : false, configurable: false, enumerable: false, value: fn });
                        } else {
                            instance[name_] = fn;
                        }

                        i+=2;
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
                BASE(dom_);
            },

            /* Search tree */

            OVERRIDE, function find_(selector) {
                return new SELF(Sizzle(selector, this._dom[0]));
            },

            [[String]],
            OVERRIDE, Boolean, function is(selector) {
                return this._dom.some(function (el) {
                    try {
                        return Sizzle['matchesSelector'](el, selector);
                    } catch (e) {
                        _DEBUG && console.error(e.toString());
                        return false;
                    }
                });
            }
        ]);

    ria.dom.Dom.SET_IMPL(ria.dom.SizzleDom);
});