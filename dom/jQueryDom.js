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
                    this._dom = jQuery(dom_);
                } else if (Array.isArray(dom_)) {
                    this._dom = jQuery(dom_);
                } else if (dom_ instanceof Node) {
                    this._dom = jQuery(dom_);
                } else if (dom_ instanceof NodeList) {
                    this._dom = jQuery(dom_);
                } else if (dom_ instanceof ria.dom.Dom) {
                    this._dom = jQuery(dom_.valueOf());
                } else if (dom_ instanceof jQuery) {
                    this._dom = dom_;
                }
            },

            OVERRIDE, Boolean, function exists() {
                return !!this._dom.valueOf()[0];
            },

            String, function getSelector() {
                return this._dom.selector;
            },

            /* DatePicker */
            [[Object, Date]],
            ria.dom.Dom, function datepicker(options, value_){
                this._dom.datepicker(options);
                value_ && this._dom.datepicker('setDate', value_);
                return this;
            },

            /* Search tree */

            [[String]],
            OVERRIDE, ria.dom.Dom, function find(selector) {
                return new ria.dom.Dom(jQuery(selector, this._dom));
            },

            [[String]],
            ria.dom.Dom, function siblings(selector_) {
                return new ria.dom.Dom(this._dom.siblings(selector_));
            },

            /* Events */

            // TODO: need a good way of implementing off()

            /*OVERRIDE, SELF, function on(event, selector, handler_) {
                var old_dom = this._dom;
                this._dom = this.valueOf();
                BASE(event, selector, handler_);
                this._dom = old_dom;
                return this;
            }, */

            [[Number, Function]],
            ria.dom.Dom, function slideDown(time_, complete_){
                time_ ? this._dom.slideDown(time_, complete_) : this._dom.slideDown();
                return this;
            },

            [[Number, Function]],
            ria.dom.Dom, function slideUp(time_, complete_){
                time_ ? this._dom.slideUp(time_, complete_) : this._dom.slideUp();
                return this;
            },

            [[Number]],
            ria.dom.Dom, function show(time_){
                time_ ? this._dom.show(time_) : this._dom.show();
                return this;
            },

            [[Number]],
            ria.dom.Dom, function hide(time_){
                time_ ? this._dom.hide(time_) : this._dom.hide();
                return this;
            },

            [[Function]],
            ria.dom.Dom, function fadeIn(callback_){
                callback_ ? this._dom.fadeIn(callback_) : this._dom.fadeIn();
                return this;
            },

            [[Function]],
            ria.dom.Dom, function fadeOut(callback_){
                callback_ ? this._dom.fadeOut(callback_) : this._dom.fadeOut();
                return this;
            },

            ria.dom.Dom, function clone(){
                return new ria.dom.Dom(this._dom.clone());
            },

            [[String]],
            ria.dom.Dom, function wrap(html){
                this._dom.wrap(html);
                return this;
            },

            [[String]],
            Boolean, function isOrInside(selector){
                return this.is(selector) || this.parent(selector).exists();
            },

            String, function text(){
                return this._dom.text();
            },

            OVERRIDE, ria.dom.Dom, function on(event, selector, handler_) {
                VALIDATE_ARGS(['event', 'selector', 'handler_'], [String, [String, ria.dom.DomEventHandler], ria.dom.DomEventHandler], arguments);
                if(!handler_){
                    handler_ = selector;
                    selector = undefined;
                }

                this._dom.on(event, selector, handler_.__wrapper__ || (handler_.__wrapper__ = function () {
                    var args = [].slice.call(arguments);
                    args.unshift(new ria.dom.Dom(this));
                    return handler_.apply(this, args);
                }));
                return this;
            },

            OVERRIDE, ria.dom.Dom, function off(event, selector_, handler_) {
                VALIDATE_ARGS(['event', 'selector_', 'handler_'], [String, [String, ria.dom.DomEventHandler], ria.dom.DomEventHandler], arguments);
                this._dom.off(event, selector_, handler_ && handler_.__wrapper__);
                return this;
            },

            /*OVERRIDE, SELF, function off(event, selector, handler_) {
                var old_dom = this._dom;
                this._dom = this.valueOf();
                BASE(event, selector, handler_);
                this._dom = old_dom;
                return this;
            },*/

            /* append/prepend */

            OVERRIDE, ria.dom.Dom, function appendTo(dom) {
                VALIDATE_ARG('dom', [ria.dom.Dom, String, Node], dom);

                if(typeof dom == "string")
                    dom = new ria.dom.Dom(dom);

                var dest = dom instanceof Node ? dom : dom.valueOf().shift();
                if(dest){
                    VALIDATE_ARG('dom', [Node], dest);

                    this._dom.appendTo(dest);
                }
                return this;
            },

            ria.dom.Dom, function insertAfter(dom) {
                VALIDATE_ARG('dom', [ria.dom.Dom, String, Node], dom);

                if(typeof dom == "string")
                    dom = new ria.dom.Dom(dom);

                var dest = dom instanceof Node ? dom : dom.valueOf().shift();
                if(dest){
                    VALIDATE_ARG('dom', [Node], dest);

                    this._dom.insertAfter(dest);
                }
                return this;
            },

            OVERRIDE, ria.dom.Dom, function insertBefore(dom) {
                VALIDATE_ARG('dom', [ria.dom.Dom, String, Node], dom);

                if(typeof dom == "string")
                    dom = new ria.dom.Dom(dom);

                var dest = dom instanceof Node ? dom : dom.valueOf().shift();
                if(dest){
                    VALIDATE_ARG('dom', [Node], dest);

                    this._dom.insertBefore(dest);
                }
                return this;
            },

            ria.dom.Dom, function appendChild(dom) {
                VALIDATE_ARG('dom', [ria.dom.Dom, String, Node], dom);

                if(typeof dom == "string")
                    dom = new ria.dom.Dom(dom);

                var el = dom instanceof Node ? dom : dom.valueOf().shift();
                if(el){
                    VALIDATE_ARG('dom', [Node], el);

                    this._dom.append(el);
                }
                return this;
            },

            OVERRIDE, ria.dom.Dom, function prependTo(dom) {
                VALIDATE_ARG('dom', [ria.dom.Dom, String, Node], dom);

                if(typeof dom == "string")
                    dom = new ria.dom.Dom(dom);

                var dest = dom instanceof Node ? dom : dom.valueOf().shift();
                if(dest){
                    VALIDATE_ARG('dest', [Node], dest);

                    this._dom.prependTo(dest);
                }
                return this;
            },

            /* parseHTML - make static */

            [[String]],
            OVERRIDE, ria.dom.Dom, function fromHTML(html) {
                this._dom = jQuery(jQuery.parseHTML(html));
                return this;
            },

            [[String]],
            ria.dom.Dom, function setHTML(html) {
                this._dom.html(html);
                return this;
            },

            function getHTML() {
                return this._dom.html();
            },

            /* DOM manipulations & navigation */

            OVERRIDE, ria.dom.Dom, function empty() {
                this._dom.empty();
                return this;
            },

            [[ria.dom.Dom]],
            OVERRIDE, ria.dom.Dom, function remove(node_) {
                node_ ? node_.remove() : this._dom.remove();
                return this;
            },

            [[SELF]],
            OVERRIDE, SELF, function removeSelf() {
                this._dom.each(function(){ this.parentNode && this.parentNode.removeChild(this); });
                return this;
            },

            // reference https://github.com/julienw/dollardom

            [[String]],
            OVERRIDE, ria.dom.Dom, function descendants(selector__) {

            },
            [[String]],
            OVERRIDE, ria.dom.Dom, function parent(selector_) {
                return selector_ ? new ria.dom.Dom(this._dom.parents(selector_)) : new ria.dom.Dom(this._dom.parent());
            },
            [[String]],
            OVERRIDE, ria.dom.Dom, function next(selector_) {
                return new ria.dom.Dom(this._dom.next(selector_));
            },
            [[String]],
            OVERRIDE, ria.dom.Dom, function previous(selector_) {
                return new ria.dom.Dom(this._dom.prev(selector_));
            },
            [[String]],
            OVERRIDE, ria.dom.Dom, function first(selector_) {
                return new ria.dom.Dom(this._dom.first(selector_));
            },
            [[String]],
            OVERRIDE, ria.dom.Dom, function last(selector_) {},
            [[String]],
            OVERRIDE, Boolean, function is(selector) {
                return this._dom.is(selector);
            },
            [[Object]],
            OVERRIDE, Boolean, function contains(node) {
                VALIDATE_ARG('node', [Node, ria.dom.Dom, ArrayOf(Node)], node);

                var nodes = [];
                if (node instanceof Node) {
                    nodes = [node];
                } else if (Array.isArray(node)) {
                    nodes = node;
                } else if (node instanceof ria.dom.Dom) {
                    nodes = node.valueOf();
                }

                var res = true;
                nodes.forEach(function(node){
                    if(res && !jQuery.contains(this._dom[0], node))
                        res =  false;
                }.bind(this));
                return res;
            },

            /* attributes */

            [[String]],
            OVERRIDE, Boolean, function hasAttr(name) {
                return this._dom[0] && this._dom[0].hasAttribute ? this._dom[0].hasAttribute(name) || null : null;
            },

            OVERRIDE, Object, function getAllAttrs() {},
            [[String]],
            OVERRIDE, Object, function getAttr(name) {
                return this._dom[0] && this._dom[0].getAttribute ? this._dom[0].getAttribute(name) || null : null;
            },
            OVERRIDE, Object, function getValue() {
                return this._dom.val() || null;
            },
            [[Object]],
            OVERRIDE, ria.dom.Dom, function setAllAttrs(obj) {},
            [[String, Object]],
            OVERRIDE, ria.dom.Dom, function setAttr(name, value) {
                this._dom[0] && this._dom.each(function(){
                    if(this.setAttribute ){
                        value ? this.setAttribute(name, value) : this.removeAttribute(name);
                    }
                });
                return this;
            },

            [[String, Object]],
            OVERRIDE, ria.dom.Dom, function setProp(name, value) {
                this._dom.prop(name, value);
                return this;
            },


            [[String]],
            OVERRIDE, ria.dom.Dom, function removeAttr(name) {
                this._dom.removeAttr(name);
                return this;
            },


            [[Object]],
            OVERRIDE, ria.dom.Dom, function setValue(value) {
                this._dom.val(value);
                if(this.getAttr('type') == 'checkbox'){
                    var node = this.parent().find('.hidden-checkbox');
                    node.setValue(value);
                    node.setData('value', value);
                }
                if(this._dom.is('select')){
                    this._dom.trigger('change');
                }
                return this;
            },

            [[Object]],
            OVERRIDE, Number, function height(value_) {
                return value_ ? this._dom.height(value_) : this._dom.height();
            },
            [[Object]],
            OVERRIDE, Number, function width(value_) {
                return value_ ? this._dom.width(value_) : this._dom.width();
            },

            /* data attributes */

            OVERRIDE, Object, function getAllData() {},
            [[String]],
            OVERRIDE, Object, function getData(name) {
                return this._dom.data(name) === undefined ? null : this._dom.data(name);
            },
            [[Object]],
            OVERRIDE, ria.dom.Dom, function setAllData(obj) {},
            [[String, Object]],
            OVERRIDE, ria.dom.Dom, function setData(name, value) {
                this.setAttr('data-' + name, value);
                this._dom.data(name, value);
                return this;
            },

            /* text */
            OVERRIDE, String, function getText() {
                return this._dom.text();
            },

            [[String]],
            OVERRIDE, SELF, function setText(value) {
                this._dom.text(value);
                return this;
            },

            /* classes */

            [[String]],
            OVERRIDE, Boolean, function hasClass(clazz) {
                return this._dom.hasClass(clazz);
            },
            [[String]],
            OVERRIDE, ria.dom.Dom, function addClass(clazz) {
                return this.toggleClass(clazz, true);
            },
            [[Object]],
            OVERRIDE, ria.dom.Dom, function removeClass(clazz) {
				if (clazz instanceof RegExp) {
					throw Error('ria.dom.jQueryDom does not support removeClass(RegExp)');
				}
               return this.toggleClass(clazz, false);
            },

            [[String, Boolean]],
            OVERRIDE, ria.dom.Dom, function toggleClass(clazz, toggleOn_) {
                this._dom.toggleClass(clazz, toggleOn_);
                return this;
            },

            /* css */

            [[String]],
            OVERRIDE, function getCss(property) {
                return this._dom.css(property);
            },
            [[String, Object]],
            OVERRIDE, ria.dom.Dom, function setCss(property, value) {
                this._dom.css(property, value);
                return this;
            },
            [[Object]],
            OVERRIDE, ria.dom.Dom, function updateCss(props) {},

            /* iterator */

            [[ria.dom.DomIterator]],
            OVERRIDE, ria.dom.Dom, function forEach(iterator) {
                this._dom.each(function () {
                    iterator(ria.dom.Dom(this));
                });
                return this;
            },

            [[ria.dom.DomIterator]],
            OVERRIDE, ria.dom.Dom, function filter(iterator) {
                this._dom = this._dom.filter(function () {
                    return iterator(ria.dom.Dom(this));
                });
                return this;
            },

            OVERRIDE, Number, function count() {
                return this._dom.length;
            },

            /* raw nodes */

            OVERRIDE, ArrayOf(Node), function valueOf() {
                return ria.__API.clone(this._dom);
            },

            [[String, Object]],
            ria.dom.Dom, function trigger(event, params_) {
                this._dom.trigger(event, params_);
                return this;
            },

            Boolean, function checked() {
                return !!(this.parent().find('.hidden-checkbox').getData('value')) || false;
            },

            Number, function index() {
                return this._dom.index();
            },

            [[Number]],
            OVERRIDE, function scrollTop(top_) {
                return top_ || top_ == 0 ? this._dom.scrollTop(top_) : this._dom.scrollTop();
            },

            /* Form */

            Object, function serialize(noArray_){
                var o = {};
                var array = this._dom.serializeArray();
                array.forEach(function(item) {
                    if (o[item.name] !== undefined && !noArray_) {
                        if (!o[item.name].push) {
                            o[item.name] = [o[item.name]];
                        }
                        o[item.name].push(item.value || '');
                    } else {
                        o[item.name] = item.value || '';
                    }
                });
                return o;
            },

            /* Text selection*/

            OVERRIDE, ria.dom.Dom, function select() {
                this._dom.select();
                return this;
            },

            [[Number]],
            VOID, function setCursorPosition(pos) {
                var el = this._dom.valueOf()[0];
                if (pos > el.value.length)
                    pos = el.value.length;
                if (el.setSelectionRange) {
                    el.setSelectionRange(pos, pos);
                } else if (el.createTextRange) {
                    // IE
                    var range = el.createTextRange();
                    range.collapse(true);
                    range.moveStart('character', pos);
                    range.moveEnd('character', pos);
                    range.select();
                }
            },

            Number, function getCursorPosition() {
                var el = this._dom.valueOf()[0];
                var pos = 0;
                if('selectionStart' in el) {
                    pos = el.selectionStart;
                } else if('selection' in document) {
                    el.focus();
                    var Sel = document.selection.createRange();
                    var SelLength = document.selection.createRange().text.length;
                    Sel.moveStart('character', -el.value.length);
                    pos = Sel.text.length - SelLength;
                }
                return pos;
            },

            String, function getSelectedText(){
                var el = this._dom.valueOf()[0],text = el.value || '';
                if('selectionStart' in el) {
                    text = text.slice(el.selectionStart, el.selectionEnd);
                } else if('selection' in document) {
                    el.focus();
                    text = document.selection.createRange().text;
                }
                return text;
            }
        ]);

    ria.dom.Dom.SET_IMPL(ria.dom.jQueryDom);
});