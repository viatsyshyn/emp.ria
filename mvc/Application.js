/**
 * MVC Application basis
 *
 * @author Volodymyr Iatsyshyn
 * @email viatsyshyn@hellowebapps.com
 * @date 31 �� 2011
 * @fileoverview MVC Application basis
 */

REQUIRE('ria.reflection.ReflectionClass');

REQUIRE('ria.mvc.MvcException');

REQUIRE('ria.mvc.IContextable');
REQUIRE('ria.mvc.ISession');
REQUIRE('ria.mvc.IStateSerializer');
REQUIRE('ria.mvc.IView');

REQUIRE('ria.mvc.IContext');
REQUIRE('ria.mvc.Dispatcher');
REQUIRE('ria.mvc.Session');
REQUIRE('ria.mvc.View');
REQUIRE('ria.mvc.IStateSerializer');
REQUIRE('ria.mvc.Controller');

NAMESPACE('ria.mvc', function () {
    "use strict";

    var window = _GLOBAL,
        History = window.History;

    /** @class ria.mvc.UncaughtException */
    EXCEPTION(
        'UncaughtException', [
            READONLY, 'srcUrl',
            READONLY, 'lineNo',

            function $(msg, srcUrl, lineNo, colNo, e_) {
                BASE('Uncaught error: ' + msg + '\nAt ' + srcUrl + '@' + lineNo + ':' + colNo, e_);

                this.srcUrl = srcUrl;
                this.lineNo = lineNo;
            }
        ]);

    /**@namespace ria.mvc.Application */
    CLASS(
        GENERIC('TContext', ImplementerOf(ria.mvc.IContext), 'TSerializer', ImplementerOf(ria.mvc.IStateSerializer)),
        'Application', [

            TSerializer, 'serializer',
            TContext, 'context',

            function $() {
                BASE();
                this.serializer = this.initSerializer_();
                this._dispatcher = this.initDispatcher_();
                this.context = this.initContext_();
            },

            TSerializer, function initSerializer_() {
                var serializer = new TSerializer;
                serializer.setSeparator('/');
                return serializer;
            },

            ria.mvc.Dispatcher, function initDispatcher_() {
                return new ria.mvc.Dispatcher;
            },

            ria.mvc.ISession, function initSession_() {
                return new ria.mvc.Session;
            },

            ria.mvc.IView, function initView_() {
                return new ria.mvc.View;
            },

            TContext, function initContext_() {
                var context = new TContext;
                context.setDispatcher(this._dispatcher);
                context.setSession(this.initSession_());
                context.setDefaultView(this.initView_());
                context.setServiceCreateDelegate(this._dispatcher.createService);
                context.getDefaultView().setContext(context);
                return context;
            },

            //[[HashChangeEvent]],
            VOID, function onHashChanged_(event) {
                this.dispatch(event.newUrl);
            },

            SELF, function session(obj) {
                var session = this.context.getSession();
                for(var key in obj) if (obj.hasOwnProperty(key)) {
                    session.set(key, obj[key], false);
                }
                return this;
            },

            VOID, function run() {
                var me = this;
                ria.async.Future.$fromData(null)
                    .then(function () {
                        return me.onInitialize_();
                    })
                    .then(function () {
                        return me._dispatcher.loadControls();
                    })
                    .then(function () {
                        return me._dispatcher.loadControllers();
                    })
                    .then(function () {
                        me._dispatcher.initControls(me.context);
                        return null;
                    })
                    .then(function () {
                        return me.onStart_();
                    })
                    .then(function () {
                        return me._dispatcher.initControllers(me.context);
                    })
                    .then(function() {
                        me.onResume_();
                        return null;
                    })
                    .catchError(function (e) {
                        this.onError_(new ria.mvc.MvcException('Failed to start application', e));
                        return ria.async.BREAK;
                    }, this)
                    .then(function() {
                        me.dispatch();
                        return null;
                    });
            },

            [[String]],
            VOID, function dispatch(route_) {
                var route = route_ || window.location.hash.substr(1);
                try {
                    var state = this.serializer.deserialize(route);
                    state.setPublic(true);
                    this._dispatcher.dispatch(state, this.context);
                } catch (e) {
                    this.onError_(new ria.mvc.MvcException('Failed to dispatch request: ' + JSON.stringify(route), e));
                }
            },

            ria.async.Future, function onInitialize_() {
                if (_BROWSER) window.addEventListener("hashchange", this.onHashChanged_, false);
                //if (_BROWSER) window.addEventListener("beforeunload", this.onBeforeUnload_, false);
                //if (_BROWSER) window.addEventListener("pagehide", this.onStop_, false); !?!?!?
                //if (_BROWSER) window.addEventListener("unload", this.onDispose_, false);

                //if (_BROWSER) window.addEventListener("activate", this.onResume_, false);
                //if (_BROWSER) window.addEventListener("unload", this.onDispose_, false);

                if (_BROWSER) window.onerror = function (error, src, lineNo, colNo, ex) {
                    //_DEBUG && console.error('Uncaught error', ria.__API.clone(arguments), '\n', 'Source:', src + "@" + lineNo + ':' + colNo);

                    this.onError_(ria.mvc.UncaughtException(error, src, lineNo, colNo, ex));
                }.bind(this);

                ria.async.Future.UNCAUGHT_ERROR(this.onError_);

                return ria.async.DeferredAction();
            },

            ria.async.Future, function onStart_() { return ria.async.DeferredAction(); },
            VOID, function onResume_() {},
            VOID, function onPause_() {},
            VOID, function onStop_() { return ria.async.DeferredAction(); },
            VOID, function onDispose_() {},

            VOID, function onError_(error) {
                if ((!(error instanceof ria.mvc.UncaughtException) || _DEBUG) && console && error)
                    console.error(error.toString());
            },

            [[ClassOf(SELF), Object]],
            VOID, function RUN(appClass, session_) {
                new appClass()
                    .session(session_ || {})
                    .run()
            }
        ]);
});