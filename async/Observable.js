/**
 * Created with JetBrains WebStorm.
 * User: viatsyshyn
 * Date: 03.07.13
 * Time: 9:45
 * To change this template use File | Settings | File Templates.
 */

REQUIRE('ria.async.IObservable');

REQUIRE('ria.async.Completer');

NAMESPACE('ria.async', function () {
    "use strict";

    /** @class ria.async.Observable */
    CLASS(
        //TEMPLATE('T'),
        'Observable', IMPLEMENTS(ria.async.IObservable), [

            [[Function]],
            function $(T) {
                BASE();
                this.T = T;
                this._handlers = [];
            },

            [[Function, Object]],
            ria.async.IObservable, function on(handler, scope_) {
                VALIDATE_ARG('handler', this.T, handler);
                this.off(handler);
                this._handlers.push([handler, scope_]);
                return this;
            },

            [[Function]],
            ria.async.IObservable, function off(handler) {
                VALIDATE_ARG('handler', this.T, handler);
                this._handlers = this._handlers
                    .filter(function (_) { return handler[0] !== _});
                return this;
            },

            [[Array, Boolean]],
            VOID, function notify_(data, once) {
                var me = this;
                this._handlers.forEach(function (_) {
                    ria.__API.defer(me, function (handler, scope) {
                        var result = true;
                        try {
                            result = handler.apply(scope, data);
                        } catch (e) {
                            throw new Exception('Unhandled error occurred while notifying observer', e);
                        } finally {
                            if (!once && result !== false)
                                me._handlers.push(_);
                        }
                    }, _);
                });

                this._handlers = [];
            },

            [[Array, Boolean]],
            VOID, function notify(data_) {
                this.notify_(data_ || [], false);
            },

            [[Array]],
            VOID, function notifyAndClear(data_) {
                this.notify_(data_ || [], true);
            },

            Number, function count() {
                return this._handlers.length;
            },

            VOID, function clear() {
                this._handlers = [];
            },

            ria.async.Future, function ready() {
                var completer = new ria.async.Completer;
                this.on(function (data_) {
                    completer.complete(data_);
                    return false; // remove this listener
                });
                return completer.getFuture();
            }
        ]);
});