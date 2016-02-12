REQUIRE('ria.mvc.IActivity');
REQUIRE('ria.mvc.IView');
REQUIRE('ria.mvc.ISession');

REQUIRE('ria.async.Observable');

NAMESPACE('ria.mvc', function () {
    "use strict";

    /**
     * Abstract Activity class
     * @class ria.mvc.Activity
     */
    CLASS(ABSTRACT,
        'Activity', IMPLEMENTS(ria.mvc.IActivity), [
            ria.mvc.IView, 'view',
            ria.mvc.ISession, 'session',

            function $() {
                BASE();
                this._inited = false;
                this._paused = false;
                this._stopped = false;
                this._active = false;
                this._onClose = new ria.async.Observable(ria.mvc.ActivityClosedEvent);
                this._onRefresh = new ria.async.Observable(ria.mvc.ActivityRefreshedEvent);
            },

            /**
             * Make this activity visible and active
             * @see ria.mvc.Activity.show
             */
            VOID, function show() {
                if (!this._inited) {
                    this.onCreate_();
                    this._inited = true;
                }

                if (!this._paused && !this._active) {
                    this._stopped && this.onRestart_();
                    this.onStart_();
                }

                if (!this._active) {
                    this.onResume_();
                }

                this._stopped = false;
                this._paused = false;
                this._active = true;
            },

            /**
             * Make this activity non-active
             */
            VOID, function pause() {
                if (!this._paused && this._active) {
                    this.onPause_();
                    this._paused = true;
                    this._active = false;
                }
            },

            /**
             * Make this activity non-visible and non-active
             */
            VOID, function stop() {
                if (!this._stopped) {
                    !this._paused && this.onPause_();
                    this.onStop_();
                }

                this._stopped = true;
                this._paused = false;
                this._active = false;

                this._onClose.clear();
                this._onRefresh.clear();
            },

            Boolean, function isForeground() {
                return this._inited && !this._paused && !this._stopped;
            },

            Boolean, function isStarted() {
                return this._inited && !this._stopped;
            },

            ria.async.Future, function getModelEvents_(msg_) {
                var me = this;
                var head = new ria.async.Future();
                me.onModelWait_(msg_);
                head
                    .handleProgress(function(progress) {
                        me.onModelProgress_(progress, msg_);
                    })
                    .complete(function () { me.onModelComplete_(msg_); })
                    .catchError(function (error) {
                        me.onModelError_(error, msg_);
                        throw error;
                    })
                    .then(function (model) { me.onModelReady_(model, msg_); return model })
                    ;

                return head;
            },

            [[ria.async.Future]],
            ria.async.Future, function refreshD(future) {
                var forceClose = true, me = this;
                return future
                    .then(function (data) { forceClose = false; return data; })
                    .attach(this.getModelEvents_())
                    .complete(function () { if (forceClose) me.close(); })
                    .then(function (model) {
                        if (!this.isStarted()) return ria.async.BREAK;

                        this.onRender_(model);
                        return model;
                    }, this)
                    .then(function (model) {
                        if (!this.isStarted()) return ria.async.BREAK;

                        this.onRefresh_(model);
                        return model;
                    }, this)
                    .catchError(function (e) {
                        throw Exception('Error full refreshing activity ' + ria.__API.getIdentifierOfValue(this), e);
                    }, this);
            },

            [[ria.async.Future, String]],
            ria.async.Future, function partialRefreshD(future, msg_) {
                return future
                    .attach(this.getModelEvents_(msg_))
                    .then(function (model) {
                        if (!this.isStarted()) return ria.async.BREAK;

                        this.onPartialRender_(model, msg_);
                        return model;
                    }, this)
                    .then(function (model) {
                        if (!this.isStarted()) return ria.async.BREAK;

                        this.onPartialRefresh_(model, msg_);
                        return model;
                    }, this)
                    .catchError(function (e) {
                        throw Exception('Error partial refreshing activity ' + ria.__API.getIdentifierOfValue(this), e);
                    }, this);
            },

            [[ria.async.Future, String]],
            ria.async.Future, function silentRefreshD(future, msg_) {
                return future
                    .complete(function () {
                        this.onModelComplete_(msg_);
                    }, this)
                    .then(function (model) {
                        this.onModelReady_(model, msg_);
                        return model
                    }, this)
                    .then(function (model) {
                        if (!this.isStarted()) return ria.async.BREAK;

                        this.onPartialRender_(model, msg_);
                        return model;
                    }, this)
                    .then(function (model) {
                        if (!this.isStarted()) return ria.async.BREAK;

                        this.onPartialRefresh_(model, msg_);
                        return model;
                    }, this)
            },

            /** @deprecated */
            [[Object]],
            VOID, function refresh(model) {
                this.onModelReady_(model);
                this.onRender_(model);
                ria.async.Future.$fromData(model)
                    .then(function (data) {
                        this.onRefresh_(data);
                        return data;
                    }, this);
            },

            ABSTRACT, VOID, function onCreate_() {},
            VOID, function onStart_() {},
            VOID, function onRestart_() {},
            VOID, function onResume_() {},
            VOID, function onPause_() {},
            VOID, function onStop_() {},
            [[String]],
            VOID, function onModelWait_(msg_) {},
            [[Object, String]],
            VOID, function onModelProgress_(data, msg_) {},
            [[Object, String]],
            VOID, function onModelError_(data, msg_) {},
            [[Object, String]],
            VOID, function onModelReady_(data, msg_) {},
            [[String]],
            VOID, function onModelComplete_(msg_) {},
            [[Object]],
            VOID, function onRender_(data) {},
            [[Object, String]],
            VOID, function onPartialRender_(data, msg_) {},
            [[Object]],
            VOID, function onRefresh_(data) {
                this._onRefresh.notify([this, data]);
            },
            [[Object, String]],
            VOID, function onPartialRefresh_(data, msg_) {
                this._onRefresh.notify([this, data, msg_]);
            },

            VOID, function onDispose_() {
                this.stop();
            },

            VOID, function close() {
                this._onClose.notifyAndClear([this]);
            },

            /**
             * Configure Close Event
             */
            [[ria.mvc.ActivityClosedEvent]],
            VOID, function addCloseCallback(callback) {
                this._onClose.on(callback);
            },

            /**
             * Configure Refresh Event
             */
            [[ria.mvc.ActivityRefreshedEvent]],
            VOID, function addRefreshCallback(callback) {
                this._onRefresh.on(callback);
            },

            Object, function getModalResult() { return null; }
        ]);
});
