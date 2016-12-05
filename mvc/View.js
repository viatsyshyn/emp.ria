REQUIRE('ria.mvc.MvcException');

REQUIRE('ria.mvc.IView');
REQUIRE('ria.mvc.IContextable');

REQUIRE('ria.async.Observable');

REQUIRE('ria.reflection.ReflectionClass');

NAMESPACE('ria.mvc', function () {
    "use strict";

    /**
     * @class ria.mvc.View
     */
    CLASS(
        'View', IMPLEMENTS(ria.mvc.IView, ria.mvc.IContextable), [

            ria.mvc.IContext, 'context',

            function $() {
                BASE();
                this._stack = [];
                this._outOfStack = [];
                this._refreshEvents = new ria.async.Observable(ria.mvc.ActivityRefreshedEvent);
                this._viewResultsQueue = [];
                this._modalMode = false;
                this._activityCache = [];
            },

            [[ria.mvc.IActivity, ria.mvc.IActivity]],
            Boolean, function isSameActivityGroup_(a1, a2) {
                var ref1 = new ria.reflection.ReflectionClass(a1.getClass());
                var ref2 = new ria.reflection.ReflectionClass(a2.getClass());
                var v1 = ref1.findAnnotation(ria.mvc.ActivityGroup)[0];
                var v2 = ref2.findAnnotation(ria.mvc.ActivityGroup)[0];
                return v1 != null && v2 != null && v1.name == v2.name;
            },

            [[ria.mvc.IActivity]],
            VOID, function push_(activity){
                activity.addCloseCallback(this.onActivityClosed_);
                activity.addRefreshCallback(this.onActivityRefreshed_);
                activity.show();

                this._stack.unshift(activity);
            },

            [[ria.mvc.IActivity]],
            VOID, function onActivityClosed_(activity) {
                var staticCandidates = this._outOfStack.filter(function (_) { return _ && _.equals(activity)});
                if (staticCandidates.length) {
                    this.stopActivity_(staticCandidates[0]);
                    this._outOfStack = this._outOfStack.filter(function (_) { return _ && !_.equals(activity)});
                    return;
                }

                if (!this._stack.filter(function (_) { return _ && _.equals(activity)}).length)
                    return;

                while (this.getCurrent() != null) {
                    if (this.getCurrent().equals(activity)) {

                        this.stopActivity_(this.pop_());

                        var top = this.getCurrent();
                        if (top) {
                          top.show();
                        }

                        break;
                    } else {
                        this.stopActivity_(this.pop_()); // just stop current
                    }
                }
            },

            ria.mvc.IActivity, function pop_() {
                return this._stack.shift() || null;
            },

            [[ria.mvc.IActivity, ria.async.Future]],
            ria.async.Future, function pushD(activity, data) {
                var prepare = this.reset_()
                    .then(function () {
                        this.push_(activity);
                    }, this);

                var result = ria.async.wait(data, prepare)
                    .then(function (d) {
                        return d[0];
                    }, this);

                return activity.refreshD(result);
            },

            [[ria.mvc.IActivity, ria.async.Future]],
            ria.async.Future, function shadeD(activity, data) {
                var top = this.getCurrent();
                var prepare = ria.async.Future.$fromData(null)
                    .then(function () {
                        if (!top) return;

                        top.pause();

                        if (this.isSameActivityGroup_(top, activity)) {
                            var result = top.isReadyForClosing();
                            if (result === false) {
                                top.show();
                                return ria.async.BREAK;
                            }

                            if (result instanceof ria.async.Future) {
                                return result.then(function (can_close) {
                                    if (can_close === false) {
                                        top.show();
                                        return ria.async.BREAK;
                                    }
                                }, this);
                            }
                        } else {
                            top = null;
                        }
                    }, this)
                    .then(function () {
                        if (top) this.stopActivity_(this.pop_());
                    }, this)
                    .then(function () {
                        this.push_(activity);
                    }, this);

                var result = ria.async.wait(data, prepare)
                    .then(function (d) {
                        return d[0];
                    }, this);

                return activity.refreshD(result);
            },

            /**
             * Shade top of stack with activity
             * @param {ria.mvc.Activity} activity
             */
            [[ria.mvc.IActivity]],
            VOID, function static_(activity) {
                var popped = this._outOfStack
                    .filter(function(_) {
                        return this.isSameActivityGroup_(_, activity);
                    }.bind(this));

                popped.forEach(function (_) { this.stopActivity_(_); }.bind(this));

                this._outOfStack = this._outOfStack.filter(function (_) { return popped.indexOf(_) < 0 });

                activity.addCloseCallback(this.onActivityClosed_);
                activity.addRefreshCallback(this.onActivityRefreshed_);
                activity.show();
                this._outOfStack.push(activity);
            },

            [[ria.mvc.IActivity, ria.async.Future]],
            ria.async.Future, function staticD(activity, data) {
                this.static_(activity);
                return activity.refreshD(data);
            },

            [[ria.mvc.IActivity]],
            VOID, function stopActivity_(activity) {
                activity.stop();
                //this._activityCache.push(activity);
            },

            [[ImplementerOf(ria.mvc.IActivity), ria.async.Future, String]],
            ria.async.Future, function updateD(activityClass, data, msg_) {
                return ria.async.wait(this._stack
                    .filter(function (_) { return _ instanceof activityClass })
                    .map(function (_) { return _.partialRefreshD(data, msg_) })
                );
            },

            /**
             * Return current top of stack
             * @return {ria.mvc.Activity}
             */
            ria.mvc.IActivity, function getCurrent() {
                return this._stack[0] || null;
            },

            /**
             * Pop all from stack with stop and reset engine
             */
            ria.async.Future, function reset_() {
                return ria.async.Future.$fromData(null)
                    .then(function once_more() {
                        var current = null;
                        while ((current = this.getCurrent()) !== null) {
                            var result = current.isReadyForClosing();
                            if (result === false)
                                return ria.async.BREAK;

                            if (result instanceof ria.async.Future) {
                                return result.then(function (can_close) {
                                    if (can_close === false)
                                      return ria.async.BREAK;

                                    this.stopActivity_(this.pop_());
                                  }, this)
                                  .then(once_more, this);
                            }

                            this.stopActivity_(this.pop_());
                        }
                    }, this);
            },

            ArrayOf(ria.mvc.IActivity), function getStack_() {
                return this._stack.slice();
            },

            [[ImplementerOf(ria.mvc.IActivity)]],
            Boolean, function contains(activity) {
                return this._stack.some(function (i) { return i instanceof activity; });
            },

            [[ria.mvc.IActivity, Object, String]],
            VOID, function onActivityRefreshed_(activity, model, msg_) {
                this._refreshEvents.notifyAndClear([activity, model, msg_]);
            },

            VOID, function notifyControlRefreshed() {
                this._refreshEvents.notifyAndClear([null, null]);
            },

            [[ria.mvc.ActivityRefreshedEvent]],
            VOID, function onActivityRefreshed(callback) {
                this._refreshEvents.on(callback);
            },

            VOID, function closeView_(activityClass) {
                this._outOfStack.forEach(function (activity) {
                    if (activity instanceof activityClass)
                        activity.close();
                });

                this._stack.forEach(function (activity) {
                    if (activity instanceof activityClass)
                        activity.close();
                });
            },

            VOID, function redirectTo_(controller, action, args_) {
                var state = this.context.getState();
                state.setController(controller);
                state.setAction(action);
                state.setParams(args_ || []);
                this.context.stateUpdated();
            },

            [[ria.mvc.ActionResult]],
            function handleActionResult_(actionResult) {
                var result, activity, possibleActivities;
                switch (actionResult.getAction()) {
                    case ria.mvc.ActivityActionType.Push:
                        if (actionResult.isOrUpdate() && this._stack[this._stack.length - 1] instanceof actionResult.getActivityClass()) {
                            activity = this._stack.pop();
                            result = this.reset_()
                              .then(function () {
                                this._stack.unshift(activity);
                                return activity
                                  .partialRefreshD(actionResult.getData(), actionResult.getMsg());
                              }, this);
                        } else {
                            activity = this.get_(actionResult.getActivityClass(), ria.mvc.ActivityViewMode.Push);
                            result = this.pushD(activity, actionResult.getData())
                        }

                        break;

                    case ria.mvc.ActivityActionType.Shade:
                        possibleActivities = this._stack.filter(function (_) { return _ instanceof actionResult.getActivityClass() });
                        if (actionResult.isOrUpdate() && possibleActivities.length) {
                            result = ria.async.wait(possibleActivities.map(function (_) {
                                return _.partialRefreshD(actionResult.getData(), actionResult.getMsg());
                            }));
                        } else {
                            activity = this.get_(actionResult.getActivityClass(), ria.mvc.ActivityViewMode.Shade);
                            result = this.shadeD(activity, actionResult.getData())
                        }

                        break;

                    case ria.mvc.ActivityActionType.Static:
                        possibleActivities = this._outOfStack.filter(function (_) { return _ instanceof actionResult.getActivityClass() });
                        if (actionResult.isOrUpdate() && possibleActivities.length) {
                            result = ria.async.wait(possibleActivities.map(function (_) {
                                return _.partialRefreshD(actionResult.getData(), actionResult.getMsg());
                            }));
                        } else {
                            activity = this.get_(actionResult.getActivityClass(), ria.mvc.ActivityViewMode.Static);
                            result = this.staticD(activity, actionResult.getData())
                        }

                        break;

                    case ria.mvc.ActivityActionType.SilentUpdate:
                        possibleActivities = [].concat(
                            this._stack.filter(function (_) { return _ instanceof actionResult.getActivityClass() }),
                            this._outOfStack.filter(function (_) { return _ instanceof actionResult.getActivityClass() })
                        );
                        result = ria.async.wait(possibleActivities.map(function (_) {
                            return _.silentRefreshD(ria.async.Future.$fromData(actionResult.getData()), actionResult.getMsg());
                        }));

                        break;

                    case ria.mvc.ActivityActionType.Update:
                        possibleActivities = [].concat(
                            this._stack.filter(function (_) { return _ instanceof actionResult.getActivityClass() }),
                            this._outOfStack.filter(function (_) { return _ instanceof actionResult.getActivityClass() })
                        );
                        result = ria.async.wait(possibleActivities.map(function (_) {
                            return _.partialRefreshD(actionResult.getData(), actionResult.getMsg());
                        }));

                        break;

                    case ria.mvc.ActivityActionType.Callback:
                        result = ria.async.Future.$fromData(null)
                            .then(actionResult.getData());

                        break;

                    default:
                        return ria.async.Future.$fromData(null);
                }

                return this.processThenAction_(result, actionResult.getThenAction());
            },

            [[ria.async.Future, ria.mvc.ActionResult]],
            ria.async.Future, function processThenAction_(result, thenAction) {
                if (!thenAction)
                    return result;

                var thenFuture = thenAction.getData();
                if (!thenFuture || !(thenFuture instanceof ria.async.Future))
                    thenFuture = ria.async.Future.$fromData(thenFuture);

                return ria.async.wait(result, thenFuture)
                    .then(function (d) {
                        thenAction.setData(d[1]);
                        return this.handleActionResult_(thenAction);
                    }, this);
            },

            [[ImplementerOf(ria.mvc.IActivity), ria.mvc.ActivityViewMode]],
            ria.mvc.IActivity, function get_(activityClass, viewMode) {
                for(var i = 0; i < this._activityCache.length; i++) {
                    var activity = this._activityCache[i];
                    if (activity.getClass() == activityClass) {
                        this._activityCache.splice(i, 1);
                        return activity;
                    }
                }

                var result = new activityClass;
                result.setViewMode(viewMode);
                result.setView(this);
                result.setSession(this.context.getSession());
                return result;
            },

            VOID, function processViewResultsQueue_() {
                if (this._modalMode) return ;

                ria.__API.defer(this, function () {
                    if (!this._viewResultsQueue.length) return ;

                    var viewResult = this._viewResultsQueue.shift();

                    if (viewResult instanceof ria.mvc.RedirectResult) {
                        this.redirectTo_(viewResult.getController(), viewResult.getAction(), viewResult.getArgs());

                    } else if (viewResult instanceof ria.mvc.CloseResult) {
                        this.closeView_(viewResult.getActivityClass());

                    } else if (viewResult instanceof ria.mvc.ActionResult) {
                        this.handleActionResult_(viewResult);

                    } else {
                        throw Exception('Unknown ViewResult: ' + ria.__API.getIdentifierOfValue(viewResult));
                    }

                    this.processViewResultsQueue_();
                })
            },

            [[ria.mvc.ViewResult]],
            VOID, function queueViewResult(viewResult) {
                Assert(viewResult, 'viewResult is required');
                this._viewResultsQueue.push(viewResult);
                this.processViewResultsQueue_();
            },

            [[ImplementerOf(ria.mvc.IActivity), Object]],
            ria.async.Future, function showModal(activityClass, model) {
                this._modalMode = true;

                var completer = new ria.async.Completer;

                var activity = this.get_(activityClass, ria.mvc.ActivityViewMode.Shade);
                activity.addCloseCallback(function () {
                    completer.complete(activity.getModalResult());
                });

                var top = this.getCurrent();
                if (top)
                    top.pause();

                this.push_(activity);
                //activity.show(); // push_() does it already
                activity.refreshD(ria.async.Future.$fromData(model));

                return completer.getFuture()
                    .then(function (modalResult) {
                        this._modalMode = false;

                        if (top)
                            top.show();

                        this.processViewResultsQueue_();
                        return modalResult;
                    }, this);
            }
        ]);
});
