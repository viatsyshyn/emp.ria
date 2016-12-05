REQUIRE('ria.mvc.IActivity');

REQUIRE('ria.async.Future');

NAMESPACE('ria.mvc', function () {
    "use strict";

    /** @class ria.mvc.ViewResult */
    CLASS(ABSTRACT,
        'ViewResult', []);

    /** @class ria.mvc.RedirectResult */
    CLASS(
        'RedirectResult', EXTENDS(ria.mvc.ViewResult), [
            String, 'controller',
            String, 'action',
            Array, 'args',

            function $fromData(controller, action, args) {
                BASE();
                this.controller = controller;
                this.action = action;
                this.args = args;
            }
        ]);

    /** @class ria.mvc.ActivityResult */
    CLASS(ABSTRACT,
        'ActivityResult', EXTENDS(ria.mvc.ViewResult), [
            ImplementerOf(ria.mvc.IActivity), 'activityClass'
        ]);

    /** @class ria.mvc.CloseResult */
    CLASS(
        'CloseResult', EXTENDS(ria.mvc.ActivityResult), [
            [[ImplementerOf(ria.mvc.IActivity)]],
            function $fromData(activityClass) {
                BASE();
                this.activityClass = activityClass;
            }
        ]);

    /** @class ria.mvc.ActivityActionType */
    ENUM(
        'ActivityActionType', {
            Push: 'push',
            Shade: 'shade',
            Static: 'static',
            Update: 'update',
            SilentUpdate: 'silent-update',
            Callback: 'callback'
        });

    /** @class ria.mvc.ActionResult */
    CLASS(
        'ActionResult', EXTENDS(ria.mvc.ActivityResult), [
            ria.mvc.ActivityActionType, 'action',
            Object, 'data',
            String, 'msg',
            Boolean, 'orUpdate',
            SELF, 'thenAction',

            [[ImplementerOf(ria.mvc.IActivity), ria.mvc.ActivityActionType, Boolean, Object, String]],
            function $fromData(activityClass, action, orUpdate, data, msg_) {
                BASE();
                this.activityClass = activityClass;
                this.action = action;
                this.orUpdate = orUpdate;
                this.data = data;
                this.msg = msg_ != null ? msg_ : null;
            },

            [[SELF]],
            SELF, function chainUpdate(viewResult) {
                if (this.thenAction)
                    this.thenAction.chainUpdate(viewResult);
                else
                    this.thenAction = viewResult;

                return this;
            },

            /**
             * Chains silent update of view after parent action result completes and data is ready.
             * If dataFuture is null this update is skipped. If dataFuture is BREAKed then
             * all updates are canceled
             */
            [[Object, String]],
            SELF, function ChainUpdateView(data, msg_) {
                return this.chainUpdate(SELF.$fromData(this.activityClass,
                    ria.mvc.ActivityActionType.SilentUpdate,
                    false, data, msg_));
            },

            /**
             * Chains callback invoke after parent action result completes.
             * If dataFuture is null this update is skipped. If dataFuture is BREAKed then
             * all updates are canceled
             */
            [[Function]],
            SELF, function OnViewReady(callback) {
                return this.chainUpdate(SELF.$fromData(this.activityClass,
                    ria.mvc.ActivityActionType.Callback,
                    false, callback));
            }
        ]);

    /**
     * @class ria.mvc.IView
     */
    INTERFACE(
        'IView', [
            [[ria.mvc.ActivityRefreshedEvent]],
            VOID, function onActivityRefreshed(callback) {},

            [[ria.mvc.ViewResult]],
            VOID, function queueViewResult(viewResult) {},

            [[ImplementerOf(ria.mvc.IActivity), Object]],
            ria.async.Future, function showModal(activityClass, model) {}
        ]);
});
