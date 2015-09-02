/**
 * Created with JetBrains WebStorm.
 * User: viatsyshyn
 * Date: 08.07.13
 * Time: 19:27
 * To change this template use File | Settings | File Templates.
 */

REQUIRE('ria.async.Future');

NAMESPACE('ria.async', function () {
    "use strict";

    /** @class ria.async.Observer */
    DELEGATE(
        [[Object]],
        Boolean, function Observer(data_) {});

    /** @class ria.async.IObservable */
    INTERFACE(
        //TEMPLATE('T')
        'IObservable', [
            [[Function, Object]],
            SELF, function on(handler, scope_) {},

            [[Function]],
            SELF, function off(handler) {},

            ria.async.Future, function ready() {}
        ]);
});