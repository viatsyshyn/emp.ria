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

REQUIRE('ria.dom.Events');

NAMESPACE('ria.dom', function () {
    "use strict";

	var window = _GLOBAL,
		global = _BROWSER ? _GLOBAL.document : null;

    var Node = _BROWSER ? window.Node : Object;
    var Event = _BROWSER ? window.Event : Object;

    function toCamelCase(str) {
        return str.replace(/(\-[a-z])/g, function($1){
            return $1.substring(1).toUpperCase();
        });
    }

    var addWheelListener = _BROWSER ? function(window,document) {

        var prefix = "", _addEventListener, onwheel, support;

        // detect event model
        if (window.addEventListener ) {
            _addEventListener = "addEventListener";
        } else {
            _addEventListener = "attachEvent";
            prefix = "on";
        }

        // detect available wheel event
        support = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
                document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
            	"DOMMouseScroll"; // let's assume that remaining browsers are older Firefox

        function addWheelListener ( elem, callback, useCapture ) {
            _addWheelListener( elem, support, callback, useCapture );

            // handle MozMousePixelScroll in older Firefox
            if( support == "DOMMouseScroll" ) {
                _addWheelListener( elem, "MozMousePixelScroll", callback, useCapture );
            }
        };

        function _addWheelListener( elem, eventName, callback, useCapture ) {
            elem[ _addEventListener ]( prefix + eventName, support == "wheel" ? callback : function( originalEvent ) {
                !originalEvent && ( originalEvent = window.event );

                // create a normalized event object
                var event = {
                    // keep a ref to the original event object
                    originalEvent: originalEvent,
                    target: originalEvent.target || originalEvent.srcElement,
                    type: "wheel",
                    deltaMode: originalEvent.type == "MozMousePixelScroll" ? 0 : 1,
                    deltaX: 0,
                    delatZ: 0,
                    preventDefault: function() {
                        originalEvent.preventDefault ?
                            originalEvent.preventDefault() :
                            originalEvent.returnValue = false;
                    }
                };

                // calculate deltaY (and deltaX) according to the event
                if ( support == "mousewheel" ) {
                    event.deltaY = - 1/40 * originalEvent.wheelDelta;
                    // Webkit also support wheelDeltaX
                    originalEvent.wheelDeltaX && ( event.deltaX = - 1/40 * originalEvent.wheelDeltaX );
                } else {
                    event.deltaY = originalEvent.detail;
                }

                // it's time to fire the callback
                return callback( event );

            }, useCapture || false );
        }

        return addWheelListener;
    }(window, global) : null;


    if (_BROWSER) {
    var docElem = global.documentElement,
        __find = function (s, n) {
            return n.querySelectorAll(s);
        },
        __is = docElem ? (docElem.webkitMatchesSelector || docElem.mozMatchesSelector
            || docElem.oMatchesSelector || docElem.msMatchesSelector) : function () { return false };
    }

    function checkEventHandlerResult(event, result) {
        if (result === false) {
            event.stopPropagation && event.stopPropagation();
            event.preventDefault && event.preventDefault();
        }
    }

    function nulls(_) {
        return _ != null;
    }

    function firstOrDef(array, def) {
        var x = array.shift();
        return x !== undefined ? x : def;
    }

    /** @class ria.dom.Event */
    ria.dom.Event = Event;

    /** @class ria.dom.DomIterator */
    DELEGATE(
        Object, function DomIterator(node) {});

    /** @class ria.dom.DomEventHandler */
    DELEGATE(
        [[Object, ria.dom.Event]],
        Boolean, function DomEventHandler(node, event) {});

    /** @class ria.dom.Keys */
    ENUM(
        'Keys', {
            BACKSPACE: 8,
            ESC: 27,
            COMMA: 188,
            DELETE: 46,
            DOWN: 40,
            END: 35,
            ENTER: 13,
            ESCAPE: 27,
            HOME: 36,
            LEFT: 37,
            NUMPAD_ADD: 107,
            NUMPAD_DECIMAL: 110,
            NUMPAD_DIVIDE: 111,
            NUMPAD_ENTER: 108,
            NUMPAD_MULTIPLY: 106,
            NUMPAD_SUBTRACT: 109,
            PAGE_DOWN: 34,
            PAGE_UP: 33,
            PERIOD: 190,
            RIGHT: 39,
            SPACE: 32,
            TAB: 9,
            UP: 38
        });


    /**
     * @class ria.dom.NewGID
     * @returns {String}
     */
    ria.dom.NewGID = function () {
        console.info('ria.dom.NewGID() is deprecated, please use ria.dom.Dom.GID() instead.');
        return ria.dom.Dom.GID();
    };

    var GID_ = new Date().getTime(),
        DomImpl_ = null,
        HandlerId = Math.floor(Math.random() * 1000) + 10000;

    /** @class ria.dom.Dom */
    CLASS(
        'Dom', [
            // $$ - instance factory
            function $$(instance, clazz, ctor, args) {
                if (DomImpl_ == SELF)
                    throw Error('');

                instance = DomImpl_.apply(undefined, args);
                ria.__SYNTAX && ria.__SYNTAX.checkReturn(ria.dom.Dom, instance);
                return instance;
            },

            function $(dom_) {
                BASE();
                VALIDATE_ARG('dom_', [Node, String, ArrayOf(Node), SELF, NodeList], dom_);
                this._dom = [global];

                if ('string' === typeof dom_) {
                    this._dom  = this.find(dom_).valueOf();
                } else if (Array.isArray(dom_)) {
                    this._dom = dom_;
                } else if (dom_ instanceof Node) {
                    this._dom = [dom_];
                } else if (dom_ instanceof NodeList) {
                    this._dom = ria.__API.clone(dom_);
                } else if (dom_ instanceof SELF) {
                    this._dom = dom_.valueOf();
                } else if (Array.isArray(dom_)) {
                    this._dom = dom_;
                }
            },

            /* Search tree */

            function find_(selector) {
                return new ria.dom.Dom(__find(selector, this._dom[0]));
            },

            [[String]],
            SELF, function find(selector) {
                if (!this.count())
                    return new ria.dom.Dom([]);

                return this.find_(selector);
            },

            /* Events */

            SELF, function on(event, selector, handler_) {
                VALIDATE_ARGS(['event', 'selector', 'handler_'], [String, [String, ria.dom.DomEventHandler], ria.dom.DomEventHandler], arguments);
                var events = event.split(' ').filter(nulls);
                if(!handler_){
                    handler_ = selector;
                    selector = undefined;
                }

                var hid = handler_.__domEventHandlerId = handler_.__domEventHandlerId || (++HandlerId).toString(36);

                this._dom.forEach(function(element){
                    events.forEach(function(evt){

                        element.__domEvents = element.__domEvents || {};
                        var eventId = evt + ':' + hid + '@' + (selector || '');
                        if (element.__domEvents[eventId])
                            return ;

                        var h = element.__domEvents[eventId] = function (e) {
                            var target = new ria.dom.Dom(e.target);
                            if(selector === undefined)
                                return checkEventHandlerResult(e, handler_(target, e));

                            if (target.is(selector))
                                return checkEventHandlerResult(e, handler_(target, e));

                            var selectorTarget = new ria.dom.Dom(element)
                                .find(selector)
                                .filter(function (_) { return _.contains(e.target); })
                                .valueOf()
                                .pop();

                            if (selectorTarget)
                                return checkEventHandlerResult(e, handler_(new ria.dom.Dom(selectorTarget), e));
                        };

                        if (evt == 'ria::wheel') {
                            addWheelListener(element, h, false);
                        } else {
                            element.addEventListener(evt, h, 'change select focus blur'.search(evt) >= 0);
                        }
                    })
                });
                return this;
            },

            SELF, function off(event, selector, handler_) {
                VALIDATE_ARGS(['event', 'selector', 'handler_'], [String, [String, ria.dom.DomEventHandler], ria.dom.DomEventHandler], arguments);
                var events = event.split(' ').filter(nulls);
                if(!handler_){
                    handler_ = selector;
                    selector = undefined;
                }

                var hid = handler_.__domEventHandlerId;
                if (!hid)
                    return ;

                this._dom.forEach(function(element){
                    events.forEach(function(evt){
                        if (!element.__domEvents)
                            return ;

                        if (evt == 'ria::wheel') {
                            _DEBUG && console.warn('ria.dom.Dom .off() is not supported for "ria::wheel" event');
                            return ;
                        }

                        var eventId = evt + ':' + hid + '@' + (selector || '');
                        var h;
                        if (h = element.__domEvents[eventId])
                            element.removeEventListener(evt, h, 'change select focus blur'.search(evt) >= 0);

                        delete element.__domEvents[eventId];
                    })
                });
                return this;
            },

            /* append/prepend */

            SELF, function appendTo(dom) {
                VALIDATE_ARG('dom', [SELF, String, Node], dom);

                if(typeof dom == "string")
                    dom = new ria.dom.Dom(dom);

                var dest = dom instanceof Node ? dom : dom.valueOf().shift();
                VALIDATE_ARG('dom', [Node], dest);

                if (!dest)
                    return this;

                this._dom.forEach(function(item){
                    dest && dest.appendChild(item);
                });
                return this;
            },

            SELF, function prependTo(dom) {
                VALIDATE_ARG('dom', [SELF, String, Node], dom);

                if(typeof dom == "string")
                    dom = new ria.dom.Dom(dom);

                var dest = dom instanceof Node ? dom : dom.valueOf().shift();
                VALIDATE_ARG('dest', [Node], dest);

                if (!dest)
                    return this;

                var first = dest.firstChild;
                if (!first)
                    return this.appendTo(dest);

                this._dom.forEach(function(item){
                    dest && dest.insertBefore(item, first);
                });

                return this;
            },

            SELF, function insertBefore(dom) {
                VALIDATE_ARG('dom', [SELF, String, Node], dom);

                if(typeof dom == "string")
                    dom = new ria.dom.Dom(dom);

                var dest = dom instanceof Node ? dom : dom.valueOf().shift();
                VALIDATE_ARG('dest', [Node], dest);

                if (!dest)
                    return this;

                this._dom.forEach(function(item){
                    dest.parentNode.insertBefore(item, dest);
                });

                return this;
            },

            /* parseHTML - make static */

            [[String]],
            SELF, function fromHTML(html) {
                this._dom = [];

                var div = document.createElement('div');
                div.innerHTML = html;
                var count = div.childElementCount;
                for(var i=0; i<count; i++){
                    var node = div.removeChild(div.childNodes[0]);
                    node && this._dom.push(node);
                }

                return this;
            },

            /* DOM manipulations & navigation */

            SELF, function empty() {
                this._dom.forEach(function(element){ element.innerHTML = ''; });
                return this;
            },

            [[SELF]],
            SELF, function remove(node) {
                this._dom.forEach(function(element) {
                    node.valueOf().forEach(function (_) { element.removeChild(_); })
                });
                return this;
            },

            [[SELF]],
            SELF, function removeSelf() {
                this._dom.forEach(function(element){ element.parentNode && element.parentNode.removeChild(element); });
                return this;
            },

            OVERRIDE, Boolean, function equals(other) {
                if (!(other instanceof ria.dom.Dom))
                    return false;

                if (this.count() != other.count())
                    return false;

                var others = other.valueOf();
                return this._dom.every(function(el) { return others.indexOf(el) >= 0; });
            },

            [[SELF]],
            Boolean, function areEquals(el) {
                _DEBUG && console.info('Method areEquals is deprecated. Consider using equals() instead');
                return this.equals(el);
            },

            // reference https://github.com/julienw/dollardom

            [[String]],
            SELF, function descendants(selector_) {
                var dom = this._dom;
                try {
                    this._dom = [].concat.apply([], dom.map(function (element) {
                        return [].slice.call(element.childNodes);
                    }));
                    return this.filter(function ($node) {
                        return selector_ ? $node.is(selector_) : true;
                    });
                } finally {
                    this._dom = dom;
                }
            },

            [[String]],
            SELF, function parent(selector_) {
                var me = this;
                return selector_
                    ? ria.dom.Dom(selector_).filter(function ($node) { return $node.contains(me); })
                    : ria.dom.Dom(this._dom.map(function (_) { return _.parentNode }));
            },

            Object, function offset() {
                if(!this._dom[0])
                    return null;

                var box = this._dom[0].getBoundingClientRect();
                var body = document.body;
                var docElem = document.documentElement;

                var scrollTop = window.pageYOffset || docElem.scrollTop;
                var scrollLeft = window.pageXOffset || docElem.scrollLeft;

                var clientTop = docElem.clientTop || body.clientTop || 0;
                var clientLeft = docElem.clientLeft || body.clientLeft || 0;

                var top  = box.top +  scrollTop - clientTop;
                var left = box.left + scrollLeft - clientLeft;

                return { top: Math.round(top), left: Math.round(left) }
            },

            Number, function height() {
                return this._dom[0] ? this._dom[0].getBoundingClientRect().height : null;
            },

            Number, function width() {
                return this._dom[0] ? this._dom[0].getBoundingClientRect().width : null;
            },

            [[String]],
            SELF, function next(selector_) {},

            [[String]],
            SELF, function previous(selector_) {},

            [[String]],
            SELF, function first(selector_) {
                if (!selector_)
                    return new ria.dom.Dom([this.valueOf().shift()]);

                throw new Exception('not implemented');
            },

            [[String]],
            SELF, function last(selector_) {
                if (!selector_)
                    return new ria.dom.Dom([this.valueOf().pop()]);

                throw new Exception('not implemented');
            },

            [[String]],
            Boolean, function is(selector) {
                return this._dom.some(function (el) {
                    return __is.call(el, selector);
                });
            },

            [[Object]],
            Boolean, function contains(node) {
                VALIDATE_ARG('node', [Node, SELF, ArrayOf(Node)], node);

                var nodes = [];
                if (node instanceof Node) {
                    nodes = [node];
                } else if (Array.isArray(node)) {
                    nodes = node;
                } else if (node instanceof SELF) {
                    nodes = node.valueOf();
                }

                return this._dom.some(function (el) {
                    return nodes.some(function (_) { return el.contains(_); });
                });
            },

            Boolean, function exists() {
                return !!this._dom[0];
            },

            Object, function getValue() {
                return this._dom.map(function (_) { return _.value; }).shift() || null;
            },

            [[Object]],
            SELF, function setValue(value) {
                this._dom.forEach(function (_) { _.value = value; });
                return this;
            },

            [[Object]],
            SELF, function setFormValues(values) {
                for(var valueName in values){
                    if(values.hasOwnProperty(valueName)){
                        this.find('[name="' + valueName + '"]').setValue(values[valueName]);
                    }
                }
                return this;
            },

            [[ria.dom.Events]],
            SELF, function triggerEvent(event) {
                this.valueOf().forEach(function (node) {
                    event.triggerOn(node);
                });
                return this;
            },

            /* attributes */

            [[String]],
            Boolean, function hasAttr(name) {
                return this._dom.some(function (_) { return _.hasAttribute(name)});
            },

            Object, function getAllAttrs() {},

            [[String]],
            Object, function getAttr(name) {
                return firstOrDef(
                    this._dom.map(function (_) { return _.getAttribute(name)}), null);
            },

            [[Object]],
            SELF, function setAllAttrs(obj) {
                var f = this.setAttr, scope = this;
                Object.getOwnPropertyNames(obj).forEach(function (k) { f.call(scope, k, obj[k]); });
                return this;
            },

            [[String, Object]],
            SELF, function setAttr(name, value) {
                this._dom.forEach(function (node) { node.setAttribute(name, value); });
                return this;
            },

            [[String]],
            SELF, function removeAttr(name) {
                this._dom.forEach(function (node) { node.removeAttribute(name); });
                return this;
            },

            [[String]],
            SELF, function toggleAttr(name, set_) {
                this.forEach(function (_) {
                    set_ = set_ === undefined ? !_.hasAttr(name) : set_;
                    return set_ ? _.setAttr(name, name) : _.removeAttr(name);
                });

                return this;
            },

            /* props */
            [[String]],
            Object, function getProp(name) {
                return firstOrDef(
                    this._dom.map(function (_) { return _[name]}), null);
            },

            [[String]],
            SELF, function setProp(name, value) {
                this._dom.forEach(function (_) { return _[name] = value});
                return this;
            },

            /* data attributes */

            Boolean, function hasData(name) {
                return this.hasAttr('data-' + name);
            },

            Object, function getAllData() {},

            [[String]],
            Object, function getData(name) {
                return this.getAttr('data-' + name);
            },

            [[Object]],
            SELF, function setAllData(obj) {
                var f = this.setData, scope = this;
                Object.getOwnPropertyNames(obj).forEach(function (_) { f.call(scope, _, obj[_]); });
                return this;
            },

            [[String, Object]],
            SELF, function setData(name, value) {
                return this.setAttr('data-' + name, value);
            },

            [[String]],
            SELF, function removeData(name) {
                return this.removeAttr('data-' + name);
            },

            /* text */
            String, function getText() {
                return firstOrDef(this._dom.map(function (_) { return _.textContent; }), null);
            },

            [[String]],
            SELF, function setText(value) {
                this._dom.forEach(function (_) {_.textContent = value; });
                return this;
            },

            /* classes */

            [[String]],
            Boolean, function hasClass(clazz) {
                return (' ' + this.getAttr('class') + ' ').replace(/\s+/g, ' ').indexOf(' ' + clazz + ' ') >= 0;
            },

            [[String]],
            SELF, function addClass(clazz) {
                return this.toggleClass(clazz, true);
            },

            [[Object, Boolean]],
            SELF, function removeClass(clazz) {
                VALIDATE_ARG('clazz', [String, RegExp], clazz);
                if (clazz instanceof RegExp) {
                    this.forEach(function (_) {
                        if (_.hasAttr('class'))
                            _.setAttr('class', (_.getAttr('class') || '').split(/\s+/).filter(function(_){ return !clazz.test(_) }).join(' '));
                    });

                    return this;
                }

                return this.toggleClass(clazz, false);
            },

            [[String, Boolean]],
            SELF, function toggleClass(clazz, toggleOn_) {
                this.forEach(function (_) {
                    var hasClass = _.hasClass(clazz);
                    var tOn = (toggleOn_ === undefined ? !hasClass : toggleOn_);

                    if (tOn && !hasClass) {
                        _.setAttr('class', _.getAttr('class') + " " + clazz);
                    } else if (!tOn && hasClass) {
                        _.setAttr('class', _.getAttr('class').split(/\s+/).filter(function(_){ return _ != clazz }).join(' '));
                    }
                });

                return this;
            },

            /* css */

            [[String]],
            function getCss(property) {
                return this._dom
                    .map(function (_) { return window.getComputedStyle(_); })
                    .map(function (style) { return !style ? null : style.getPropertyValue(property); })
                    .shift() || null;
            },

            [[String, Object]],
            SELF, function setCss(property, value) {
                this._dom.forEach(function (_) {
                    if (property.indexOf('-') > 0) {
                        _.style[toCamelCase(property)] = value;
                    }
                    _.style[property] = value;
                });
                return this;
            },

            [[Object]],
            SELF, function updateCss(props) {
                var f = this.setCss, scope = this;
                Object.getOwnPropertyNames(props).forEach(function (_) { f.call(scope, _, props[_]); });
                return this;
            },

            [[Number]],
            function scrollTop(top_) {
                return null;
            },

            /* iterator */

            [[ria.dom.DomIterator]],
            SELF, function forEach(iterator) {
                var old = this._dom, scope = this;
                this._dom.slice().forEach(function (_) {
                    scope._dom = [_];
                    iterator(scope);
                });
                this._dom = old;
                return this;
            },

            [[ria.dom.DomIterator]],
            SELF, function filter(iterator) {
                var old = this._dom, scope = this;
                try {
                    return new ria.dom.Dom(this._dom.filter(function (_) {
                        scope._dom = [_];
                        return iterator(scope);
                    }));
                } finally {
                    this._dom = old;
                }
            },

            [[ria.dom.DomIterator]],
            Array, function map(iterator) {
                var old = this._dom, scope = this;
                try {
                    return this._dom.map(function (_) {
                        scope._dom = [_];
                        return iterator(scope);
                    });
                } finally {
                    this._dom = old;
                }
            },

            Number, function count() {
                return this._dom.length;
            },

            /* raw nodes */

            ArrayOf(Node), function valueOf() {
                return this._dom.slice();
            },

            [[SELF]],
            VOID, function SET_IMPL(impl) {
                DomImpl_ = impl;
            },

            String, function GID() {
                return 'gid-' + (GID_++).toString(36);
            }
        ]);

    /** @class ria.dom.SimpleDom */
    CLASS(
        'SimpleDom', EXTENDS(ria.dom.Dom), [

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
                dom_ ? BASE(dom_) : BASE();
            }
        ]);

    ria.dom.Dom.SET_IMPL(ria.dom.SimpleDom);

    ria.dom.setDomImpl = function (impl) {
        _DEBUG && console.warn('ria.dom.setDomImpl is deprecated. User ria.dom.Dom.SET_IMPL() instead');
        ria.dom.Dom.SET_IMPL(impl);
    };
});