REQUIRE('ria.async.ICancelable');

NAMESPACE('ria.async', function () {
    "use strict";

    /** @class ria.async.TimerDelegate */
    DELEGATE(
        [[Object, Number]],
        VOID, function TimerDelegate(timer, lag) {});

    /** @class ria.async.Timer */
    CLASS(
        'Timer', IMPLEMENTS(ria.async.ICancelable), [
            [[Number, ria.async.TimerDelegate, Object, Boolean]],
            function $(duration, handler, scope_, canceled_) {
                BASE();

                this._interval = Math.max(duration, 1);
                this._stopOnNext = false;
                this._handler = handler;
                this._scope = scope_;
                this._timer = null;
                canceled_ || this.start_(handler, scope_);
            },

            function start_(handler, scope_) {
                var me = this;
                var lastCall = new Date().getTime();

                this._timer = setTimeout(function event_() {
                    me._stopOnNext || setTimeout(event_, me._interval);
                    var lag = -(lastCall - (lastCall = new Date().getTime()));
                    try {
                        handler.call(scope_, me, lag);
                    } catch (e) {
                        setTimeout(function () { throw new Exception('Timer handler failed', e) }, 1);
                    }

                }, this._interval);

                /*setInterval(function () {
                    var lag = -(lastCall.getTime() - (lastCall = new Date).getTime());
                    console.info('ria.async.Timer', 'lag', lag);
                    handler.call(scope_, me, lag);
                }, duration < 0 ? 0 : duration);*/
            },

            VOID, function cancel() {
                this._timer && clearTimeout(this._timer);
                this._timer = null;
            },

            VOID, function restart() {
                this.cancel();
                this.start_(this._handler, this._scope);
            },

            [[Number, ria.async.TimerDelegate]],
            function $once(duration, handler, scope_) {
                BASE();

                this._interval = Math.max(duration, 1);
                this._stopOnNext = true;
                this.start_(handler, scope_);
            },

            [[ria.async.TimerDelegate, Array, Object]],
            VOID, function DEFER(handler, args_, scope_) {
                ria.__API.defer(scope_ || _GLOBAL, handler, args_ || []);
            }
        ]);
});