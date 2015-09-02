/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 7/16/13
 * Time: 10:36 AM
 * To change this template use File | Settings | File Templates.
 */

NAMESPACE('ria.collections', function () {
    "use strict";

    /** @class ria.collections.TypedArray */
    ria.collections.TypedArray = (function () {
        function TypedArray(TValue) {
            this.TValue = TValue;
            // TODO: bind all Array
        }

        ria.__API.clazz(TypedArray, 'TypedArray', ria.__API.Class, [], []);

        ria.__API.compile(TypedArray);
        return TypedArray;
    })();
});