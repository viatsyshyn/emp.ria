REQUIRE('ria.mvc.View');
REQUIRE('ria.mvc.Activity');

(function (ria, stubs) {
    "use strict";

    var TestData_ = CLASS(
        'TestData_', [
            READONLY, 'count',

            function $(count_) {
                BASE();
                this.count = count_|0;
            },

            ria.async.Future, function DEFERRED(count_) {
                return ria.async.Future.$fromData(new SELF(count_));
            },

            ria.async.Future, function COMPLETER(timeout, count_) {
                var completer = new ria.async.Completer;

                ria.__API.defer(completer, completer.complete, [new SELF(count_)], timeout);

                return completer.getFuture();
            }
        ]);

    var TestActivity_ = CLASS(
        'TestActivity_', EXTENDS(ria.mvc.Activity), [
            function $(events) {
                BASE();
                this._events = events;
                this.fire_('$', []);
            },

            function updateEvents(events) {
                this._events = ria.__API.merge(events, this._events);
            },

            function fire_(event, args) {
                console.info(event, args);
                (this._events[event] || function () {}).apply(null, args);
            },

            OVERRIDE, VOID, function onCreate_()                    { BASE();           this.fire_('onCreate_',         arguments);},
            OVERRIDE, VOID, function onStart_()                     { BASE();           this.fire_('onStart_',          arguments);},
            OVERRIDE, VOID, function onRestart_()                   { BASE();           this.fire_('onRestart_',        arguments);},
            OVERRIDE, VOID, function onResume_()                    { BASE();           this.fire_('onResume_',         arguments);},
            OVERRIDE, VOID, function onModelWait_(msg_)             { BASE(msg_);       this.fire_('onModelWait_',      arguments);},
            OVERRIDE, VOID, function onModelProgress_(data, msg_)   { BASE(data, msg_); this.fire_('onModelProgress_',  arguments);},
            OVERRIDE, VOID, function onModelError_(data, msg_)      { BASE(data, msg_); this.fire_('onModelError_',     arguments);},
            OVERRIDE, VOID, function onModelReady_(data, msg_)      { BASE(data, msg_); this.fire_('onModelReady_',     arguments);},
            OVERRIDE, VOID, function onModelComplete_(msg_)         { BASE(msg_);       this.fire_('onModelComplete_',  arguments);},
            OVERRIDE, VOID, function onRender_(data)                { BASE(data);       this.fire_('onRender_',         arguments);},
            OVERRIDE, VOID, function onPartialRender_(data, msg_)   { BASE(data, msg_); this.fire_('onPartialRender_',  arguments);},
            OVERRIDE, VOID, function onRefresh_(data)               { BASE(data);       this.fire_('onRefresh_',        arguments);},
            OVERRIDE, VOID, function onPartialRefresh_(data, msg_)  { BASE(data, msg_); this.fire_('onPartialRefresh_', arguments);},
            OVERRIDE, VOID, function onPause_()                     { this.fire_('onPause_',    arguments); BASE();},
            OVERRIDE, VOID, function onStop_()                      { this.fire_('onStop_',     arguments); BASE();},
            OVERRIDE, VOID, function onDispose_()                   { this.fire_('onDispose_',  arguments); BASE();}
        ]);

    AsyncTestCase("ViewTestCase").prototype = {

        setUp: function () {
            this._view = new ria.mvc.View();

            ria.async.Future.UNCAUGHT_ERROR(function (error) {
                assertNoException(function () {
                    throw error;
                });
            })
        },

        PushView: function (activity, data) {
            this._view.pushD(activity, data);
        },

        ShadeView: function (activity, data) {
            this._view.shadeD(activity, data);
        },

        UpdateView: function (activityClass, data, msg_) {
            this._view.queueViewResult(ria.mvc.ActionResult.$fromData(activityClass,
            ria.mvc.ActivityActionType.Update, false, data, msg_));
        },

        BackgroundUpdateView: function (activityClass, data, msg_) {
            this._view.queueViewResult(ria.mvc.ActionResult.$fromData(activityClass,
                ria.mvc.ActivityActionType.SilentUpdate, false, data, msg_));
        },

        testPushView: function (queue) {
            var me = this;
            queue.call(function (callbacks) {
                me.PushView(TestActivity_({
                    onRefresh_: callbacks.noop()
                }), TestData_.DEFERRED());
            });
        },

        testShadeView: function (queue) {
            var me = this;
            queue.call(function (callbacks) {
                me.ShadeView(TestActivity_({
                    onRefresh_: callbacks.noop()
                }), TestData_.DEFERRED());
            });
        },

        testUpdateView: function (queue) {
            var me = this;
            queue.call(function (callbacks) {
                me.ShadeView(TestActivity_({
                    onRefresh_: callbacks.noop()
                }), TestData_.DEFERRED());
            });

            queue.call(function (callbacks) {
                me._view.getCurrent().updateEvents({
                    onPartialRefresh_: callbacks.noop()
                });

                me.UpdateView(TestActivity_, TestData_.DEFERRED());
            });
        },

        testTripleUpdateView: function (queue) {
            var me = this;
            queue.call(function (callbacks) {
                me.ShadeView(TestActivity_({
                    onRefresh_: callbacks.noop()
                }), TestData_.DEFERRED());
            });

            var steps = [];
            queue.call(function (callbacks) {
                me._view.getCurrent().updateEvents({
                    onPartialRender_: callbacks.add(function (model, msg_) {
                        steps.push(model.getCount());
                    }, 3),
                    onModelReady_: callbacks.add(function (model, msg_) {
                        steps.push(model.getCount());
                    }, 3),
                    onPartialRefresh_: callbacks.add(function (model, msg_) {
                        steps.push(model.getCount());
                    }, 3)
                });
            });

            setTimeout(function () { me.UpdateView(TestActivity_, TestData_.COMPLETER(10, 1)); }, Math.random() * 10 + 50);
            setTimeout(function () { me.UpdateView(TestActivity_, TestData_.COMPLETER(10, 2)); }, Math.random() * 30 + 50);
            setTimeout(function () { me.UpdateView(TestActivity_, TestData_.COMPLETER(10, 3)); }, Math.random() * 50 + 50);

            queue.call(function () {
                assertEquals([1,1,1,2,2,2,3,3,3], steps.sort());
            });
        },

        testSilentUpdateView: function (queue) {
            var me = this;
            queue.call(function (callbacks) {
                me.ShadeView(TestActivity_({
                    onRefresh_: callbacks.noop()
                }), TestData_.DEFERRED());
            });

            queue.call(function (callbacks) {
                me._view.getCurrent().updateEvents({
                    onPartialRefresh_: callbacks.noop()
                });

                me.BackgroundUpdateView(TestActivity_, TestData_());
            });
        },

        testTripleSilentUpdateView: function (queue) {
            var me = this;
            queue.call(function (callbacks) {
                me.ShadeView(TestActivity_({
                    onRefresh_: callbacks.noop()
                }), TestData_.DEFERRED());
            });

            var steps = [];
            queue.call(function (callbacks) {
                me._view.getCurrent().updateEvents({
                    onPartialRefresh_: callbacks.add(function (model, msg_) {
                        steps.push(model.getCount());
                    }, 3)
                });

                setTimeout(function () { me.BackgroundUpdateView(TestActivity_, TestData_(1)); }, Math.random() * 10 + 50);
                setTimeout(function () { me.BackgroundUpdateView(TestActivity_, TestData_(2)); }, Math.random() * 15 + 50);
                setTimeout(function () { me.BackgroundUpdateView(TestActivity_, TestData_(3)); }, Math.random() * 5 + 50);
            });

            queue.call(function () {
                assertEquals([1,2,3], steps.sort());
            });
        }
    };
})(ria, stubs.view);