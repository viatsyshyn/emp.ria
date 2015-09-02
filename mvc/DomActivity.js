REQUIRE('ria.mvc.MvcException');
REQUIRE('ria.mvc.Activity');
REQUIRE('ria.dom.Dom');
REQUIRE('ria.mvc.DomEventBind');

REQUIRE('ria.async.Timer');

REQUIRE('ria.reflection.ReflectionClass');

NAMESPACE('ria.mvc', function () {
    "use strict";

    var MODEL_WAIT_CLASS = 'activity-model-wait';

    function camel2dashed(_) {
        return _.replace(/[a-z][A-Z]/g, function(str, offset) {
           return str[0] + '-' + str[1].toLowerCase();
        }).toLowerCase();
    }

    /** @class ria.mvc.DomAppendTo */
    ANNOTATION(
        [[String]],
        function DomAppendTo(node) {});

    /** @class ria.mvc.DomActivity */
    CLASS(
        'DomActivity', EXTENDS(ria.mvc.Activity), [
            ria.dom.Dom, 'dom',

            function $() {
                BASE();

                this._activityClass = null;
                this._domAppendTo = null;
                this._domEvents = [];
                this.processAnnotations_(new ria.reflection.ReflectionClass(this.getClass()));

                this._loaderTimer = null;
            },

            [[String]],
            ria.dom.Dom, function find(selector) {
                return this.dom.find(selector);
            },

            [[ria.reflection.ReflectionClass]],
            VOID, function processAnnotations_(ref) {
                this._activityClass = camel2dashed(ref.getShortName());

                if (!ref.isAnnotatedWith(ria.mvc.DomAppendTo))
                    throw new ria.mvc.MvcException('ria.mvc.DomActivity expects annotation ria.mvc.DomAppendTo');

                this._domAppendTo = new ria.dom.Dom(ref.findAnnotation(ria.mvc.DomAppendTo).pop().node);

                this._domEvents = ref.getMethodsReflector()
                    .filter(function (_) { return _.isAnnotatedWith(ria.mvc.DomEventBind)})
                    .map(function(_) {
                        if (_.getArguments().length < 2)
                            throw new ria.mvc.MvcException('Methods, annotated with ria.mvc.DomBindEvent, are expected to accept at least two arguments (node, event)');

                        var annotation = _.findAnnotation(ria.mvc.DomEventBind).pop();
                        return {
                            event: annotation.event,
                            selector: annotation.selector_,
                            methodRef: _
                        }
                    })
            },

            [[ria.async.Future]],
            OVERRIDE, ria.async.Future, function refreshD(future) {

                this._loaderTimer = new ria.async.Timer.$once(300, function (timer, lag) {
                    this.dom.addClass(MODEL_WAIT_CLASS);
                    this._loaderTimer = null;
                }, this);

                return BASE(future);
            },

            OVERRIDE, VOID, function onRender_(model) {
                this.dom.removeClass(MODEL_WAIT_CLASS);

                BASE(model);

                if (this._loaderTimer) {
                    this._loaderTimer.cancel();
                    this._loaderTimer = null;
                }
            },
            ABSTRACT, ria.dom.Dom, function onDomCreate_() {},

            [[String]],
            VOID, function addPartialRefreshLoader(msg_) {},

            [[ria.async.Future, String]],
            OVERRIDE, ria.async.Future, function partialRefreshD(future, msg_) {

                this.addPartialRefreshLoader(msg_);

                return BASE(future, msg_);
            },

            OVERRIDE, VOID, function onCreate_() {
                BASE();

                var dom = this.dom = this.onDomCreate_().addClass(this._activityClass);

                var instance = this;
                this._domEvents.forEach(function (_) {
                    dom.on(_.event, _.selector || null, _.wrapper || (_.wrapper = function (node, event) {
                        return _.methodRef.invokeOn(instance, ria.__API.clone(arguments));
                    }));
                })
            },

            OVERRIDE, VOID, function onStart_() {
                BASE();
                this.dom.appendTo(this._domAppendTo);
            },

            [[Object, String]],
            OVERRIDE, VOID, function onPartialRender_(data, msg_) {
                BASE(data, msg_);
                this.dom.removeClass('loading');
            },

            OVERRIDE, VOID, function onModelComplete_(msg_) {
                BASE(msg_);

                this.dom.find('FORM.working').removeClass('working');
            },

            OVERRIDE, VOID, function onStop_(){
                BASE();
                this._domAppendTo.remove(this.dom.empty());
            }

        ]);
});