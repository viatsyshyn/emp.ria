REQUIRE('ria.mvc.IContext');
REQUIRE('ria.mvc.IContextable');
REQUIRE('ria.async.Future');

REQUIRE('ria.serialize.JsonSerializer');

REQUIRE('ria.reflection.ReflectionClass');

NAMESPACE('ria.mvc', function () {
    "use strict";

    function toDashed(str) {
        return str.replace(/([A-Z])/g, function($1){
            return "-" + $1.toLowerCase();
        });
    }

    /** @class ria.mvc.ControllerUri */
    ANNOTATION(
        [[String]],
        function ControllerUri(value) {});

    /** @class ria.mvc.AccessFor */
    ANNOTATION(
        function AccessFor(roles) {});

    /** @class ria.mvc.Inject */
    ANNOTATION(
        function Inject() {});

    /** @class ria.mvc.SessionBind */
    ANNOTATION(
        [[String]],
        function SessionBind(name_) {});

    /** @class ria.mvc.ServiceEvent */
    ANNOTATION(
        [[ClassOf(Class), String]],
        function ServiceEvent(service, name_) {});


    function toCamelCase(str) {
        return str.replace(/(\-[a-z])/g, function($1){
            return $1.substring(1).toUpperCase();
        });
    }

    /**
     * @class ria.mvc.Controller
     */
    CLASS(ABSTRACT,
        'Controller', IMPLEMENTS(ria.mvc.IContextable), [

            ria.mvc.IContext, 'context',
            ria.mvc.State, 'state',
            ria.mvc.IView, 'view',

            function $() {
                BASE();
                this.context = null;
                this.state = null;
                this.view = null;
                this._serializer = this.initSerializer_();
            },

            ria.serialize.ISerializer, function initSerializer_() {
                return new ria.serialize.JsonSerializer;
            },

            /**
             * Method is called once Application is starting
             * A magic method 'cause you can load required resources but can not use this to store them
             * Use either global var or session
             */
            ria.async.Future, function onAppStart() {
                return ria.async.DeferredAction();
            },

            /**
             * Method is called once Application pre dispatch
             * A magic method 'cause you can load required resources but can not use this to store them
             * Use either global var or session
             */
            ria.async.Future, function onAppInit() {
                return ria.async.DeferredAction();
            },

            /**
             * Internal use only, use onAppInit() ONLY
             */
            FINAL, ria.async.Future, function doAppInit() {
                this.loadSessionBinds_();
                return this
                    .onAppInit()
                    .then(function () {
                        this.storeSessionBinds_();
                    }, this)
                    .then(function () {
                        // let's bind session events to this instance
                        var ref = ria.reflection.ReflectionClass(this);
                        var instance = this;
                        ref.getMethodsReflector()
                            .filter(function (_) { return _.isAnnotatedWith(ria.mvc.ServiceEvent)})
                            .forEach(function (_) {
                                var a = _.findAnnotation(ria.mvc.ServiceEvent).pop();
                                var service = instance.context.getService(a.service);
                                var eventName = a.name_ || _.getShortName();

                                var serviceRef = ria.reflection.ReflectionClass(service);
                                var prop = serviceRef.getPropertyReflector(eventName);

                                prop.invokeGetterOn(service).on(function () {
                                    this.loadSessionBinds_();
                                    _.invokeOn(this, ria.__API.clone(arguments));
                                    this.storeSessionBinds_();
                                }, instance);
                            })
                    }, this);
            },

            VOID, function onInitialize() {
                this.view = this.context.getDefaultView();
                this.state = null;
            },

            VOID, function preDispatchAction_() {},

            VOID, function postDispatchAction_() {},

            ria.reflection.ReflectionMethod, function resolveRoleAction_(state){
                var ref = new ria.reflection.ReflectionClass(this.getClass());
                var action = toCamelCase(state.getAction()) + 'Action';

                var method = ref.getMethodReflector(action);

                if (!method)
                        throw new ria.mvc.MvcException('Controller ' + ref.getName() + ' has no method ' + action
                            + ' for action ' + state.getAction());

                return method;
            },

            [[ria.mvc.State]],
            VOID, function callAction_(state) {
                var params = state.getParams();
                var method = this.resolveRoleAction_(state);
                this.validateActionCall_(method, params);

                try {
                    this.loadSessionBinds_();

                    var result = method.invokeOn(this, this.deserializeParams_(params, method));
                    if (_DEBUG && result === undefined && (result !== null && !(result instanceof ria.mvc.ViewResult))) {
                        console.warn('WARN: Action ' + method.getName() + ' returned not supported result: '
                            + ria.__API.getIdentifierOfValue(result));
                    }

                    if (result) {
                        if (result instanceof ria.async.Future)
                            result.then(this.view.queueViewResult);
                        else
                            this.view.queueViewResult(result);
                    }

                    this.storeSessionBinds_();
                } catch (e) {
                    throw new ria.mvc.MvcException("Exception in action " + method.getName(), e);
                }
            },

            [[ria.reflection.ReflectionMethod, Array]],
            VOID, function validateActionCall_(actionRef, params) {
                var c = params.length;

                var min = actionRef.getRequiredArguments().length;
                if (min > c)
                    throw new ria.mvc.MvcException('Method ' + actionRef.getName() + ' requires at least ' + min + ' arguments.');

                var max = actionRef.getArguments().length;
                if (max < c)
                    throw new ria.mvc.MvcException('Method ' + actionRef.getName() + ' requires at most ' + max + ' arguments.');
            },

            [[Array, ria.reflection.ReflectionMethod]],
            Array, function deserializeParams_(params, actionRef) {
                var types = actionRef.getArgumentsTypes(),
                    names = actionRef.getArguments();

                try {
                    return params.map(function (_, index) {
                        try {
                            var Type = types[index] || Object;
                            if (_ === null || _ === undefined || (!Array.isArray(_) && _ instanceof Type))
                                return _;

                            if (Array.isArray(_) && ria.__API.isArrayOfDescriptor(Type) && _.every(function (_) { return _ instanceof Type.valueOf()}))
                                return _;

                            return this._serializer.deserialize(_, Type);
                        } catch (e) {
                            throw new ria.mvc.MvcException('Error deserializing action param ' + names[index], e);
                        }
                    }, this);
                } catch (e) {
                    throw new ria.mvc.MvcException('Error deserializing action params', e);
                }
            },

            [[ria.mvc.State]],
            VOID, function dispatch(state) {
                this.state = state;

                this.preDispatchAction_();
                if (!state.isDispatched())
                    return ;

                /*if (state.isPublic()) {
                    this.view.reset();
                }*/

                this.callAction_(state);

                if (!state.isDispatched())
                    return ;

                this.postDispatchAction_();
            },

            [[String, String, Array]],
            function Forward(controller, action_, args_) {
                _DEBUG && console.warn('WARN this.Forward is deprecated and will be removed soon. Use this.Redirect instead');
                return this.Redirect(controller, action_ || null, args_);
            },

            [[ria.mvc.IActivity]],
            function prepareActivity_(activity){},

            function pushHistoryState_(){
                var state = this.getContext().getState();
                var params = state.getParams().slice();
                params.unshift(state.getAction());
                params.unshift(state.getController());
                params = params.map(function(item){
                    return item ? item.valueOf().toString() : '';
                });
                var href = '#' + params.join('/');
                if(_BROWSER && href != _GLOBAL.location.hash && history.pushState)
                    history.pushState(null, null, href);
            },

            Boolean, function validateSessionBindType_(type) {
                if (ria.__API.isArrayOfDescriptor(type))
                    return this.validateSessionBindType_(type.valueOf());

                return [String, Number, Boolean].indexOf(type) >= 0 || ria.__API.isEnum(type) || ria.__API.isIdentifier(type);
            },

            Object, function serializeSessionBindValue_(value, type) {
                var serializeSessionBindValue_ = this.serializeSessionBindValue_;
                if (ria.__API.isArrayOfDescriptor(type)) {
                    return JSON.stringify(value.map(function (_) { return serializeSessionBindValue_(_, type.valueOf()); }));
                }

                return (value !== undefined && value !== null) ? value.valueOf() : null;
            },

            Object, function deserializeSessionBindValue_(value, type) {
                if (ria.__API.isArrayOfDescriptor(type)) {
                    return JSON.parse(value || '[]').map(function (_) { return deserializeSessionBindValue_(_, type.valueOf()); });
                }

                return (value !== undefined && value !== null) ? type(value) : null;
            },

            VOID, function loadSessionBinds_() {
                var ref = ria.reflection.ReflectionClass(this),
                    context = this.context,
                    instance = this;

                ref.getPropertiesReflector().forEach(function (_) {
                    var t = _.getType();
                    if (!_.isReadonly() && _.isAnnotatedWith(ria.mvc.SessionBind) && this.validateSessionBindType_(t)) {
                        var name = _.findAnnotation(ria.mvc.SessionBind).pop().name_ || toDashed(_.getShortName());
                        _.invokeSetterOn(instance, this.deserializeSessionBindValue_(context.getSession().get(name), t));
                    }
                }.bind(this));
            },

            VOID, function storeSessionBinds_() {
                var ref = ria.reflection.ReflectionClass(this),
                    context = this.context,
                    instance = this;

                ref.getPropertiesReflector().forEach(function (_) {
                    var t = _.getType();
                    if (!_.isReadonly() && _.isAnnotatedWith(ria.mvc.SessionBind) && this.validateSessionBindType_(t)) {
                        var name = _.findAnnotation(ria.mvc.SessionBind).pop().name_ || toDashed(_.getShortName());
                        context.getSession().set(name, this.serializeSessionBindValue_(_.invokeGetterOn(instance), t));
                    }
                }.bind(this));
            },

            /**
             * Redirect to new location
             */
            [[String, String, Array]],
            ria.mvc.RedirectResult, function Redirect(controller, action, args_) {
                return ria.mvc.RedirectResult.$fromData(controller, action, args_ || []);
            },

            /**
             * Resets stack and puts activity on top, triggers state persistence
             */
            [[ImplementerOf(ria.mvc.IActivity), ria.async.Future]],
            ria.mvc.ActionResult, function PushView(activityClass, data) {
                this.pushHistoryState_();
                return ria.mvc.ActionResult.$fromData(activityClass,
                    ria.mvc.ActivityActionType.Push, false, data);
            },

            /**
             * If activity is on stack bottom, then all other activities are popped,
             * activity is updated, state is persisted; otherwise acts like PushView
             */
            [[ImplementerOf(ria.mvc.IActivity), ria.async.Future, String]],
            ria.mvc.ActionResult, function PushOrUpdateView(activityClass, data, msg_) {
                this.pushHistoryState_();
                return ria.mvc.ActionResult.$fromData(activityClass,
                    ria.mvc.ActivityActionType.Push, true, data, msg_);
            },

            /**
             * Shades top activity with this one, no state persistence. If top activity
             * has same ActivityGroup it is popped
             */
            [[ImplementerOf(ria.mvc.IActivity), ria.async.Future]],
            ria.mvc.ActionResult, function ShadeView(activityClass, data) {
                return ria.mvc.ActionResult.$fromData(activityClass,
                    ria.mvc.ActivityActionType.Shade, false, data);
            },

            /**
             * If activity is on stack, then all activities of this class are updated,
             * no state persistence; otherwise acts like ShadeView
             */
            [[ImplementerOf(ria.mvc.IActivity), ria.async.Future, String]],
            ria.mvc.ActionResult, function ShadeOrUpdateView(activityClass, data, msg_) {
                return ria.mvc.ActionResult.$fromData(activityClass,
                    ria.mvc.ActivityActionType.Shade, true, data, msg_);
            },

            /**
             * Puts activity in special out-of-stack flow: it's not affected by PushView or ShadeView.
             * All activities with same ActivityGroup are stopped and removed
             */
            [[ImplementerOf(ria.mvc.IActivity), ria.async.Future]],
            ria.mvc.ActionResult, function StaticView(activityClass, data) {
                return ria.mvc.ActionResult.$fromData(activityClass,
                    ria.mvc.ActivityActionType.Static, false, data);
            },

            /**
             * If activity if found on out-of-stack, it is updated; otherwise acts like StaticView
             */
            [[ImplementerOf(ria.mvc.IActivity), ria.async.Future, String]],
            ria.mvc.ActionResult, function StaticOrUpdateView(activityClass, data, msg_) {
                return ria.mvc.ActionResult.$fromData(activityClass,
                    ria.mvc.ActivityActionType.Static, true, data, msg_);
            },

            /**
             * Updates all activities of this class on stack and out-of-stack
             */
            [[ImplementerOf(ria.mvc.IActivity), ria.async.Future, String]],
            ria.mvc.ActionResult, function UpdateView(activityClass, data, msg_) {
                return ria.mvc.ActionResult.$fromData(activityClass,
                    ria.mvc.ActivityActionType.Update, false, data, msg_);
            },

            /**
             * Silently updates activities of this on stack or out-of-stack with data/message, deferred
             */
            [[ImplementerOf(ria.mvc.IActivity), Object, String]],
            VOID, function BackgroundUpdateView(activityClass, data, msg_) {
                this.view.queueViewResult(ria.mvc.ActionResult.$fromData(activityClass,
                    ria.mvc.ActivityActionType.SilentUpdate, false, data, msg_));
            },

            /**
             * Closes all activities of this class on stack and out-of-stack.
             * All activities that shades this one are stopped also.
             */
            [[ImplementerOf(ria.mvc.IActivity)]],
            ria.mvc.CloseResult, function CloseView(activityClass) {
                return ria.mvc.CloseResult.$fromData(activityClass);
            },

            /**
             * Shows activity immediatly and pauses viewResultQueue processing
             * till modal activity is closed. Resulting future is resolved with
             * return of getModelResult().
             */
            [[ImplementerOf(ria.mvc.IActivity)]],
            ria.async.Future, function ModalView(activityClass, rawData) {
                return this.view.showModal(activityClass, rawData);
            }

        ]);
});