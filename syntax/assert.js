
/** @namespace ria.__SYNTAX */
ria.__SYNTAX = ria.__SYNTAX || {};

ria.__CFG.AssertWithExceptions = !!ria.__CFG.AssertWithExceptions;

(function () {
    "use strict";

    /**
     *
     * @param {Boolean} condition
     * @param {String} [msg_]
     * @constructor
     */
    function Assert(condition, msg_) {
        if (!!condition) return;

        if (ria.__CFG.AssertWithExceptions) {
            throw Error('Assert failed with msg "' + msg_ + '"');
        }

        console.error('Assert failed with msg "' + msg_ + '". Debug?');
        //if (confirm('Assert failed with msg "' + msg_ + '". Debug?'))
          //  debugger;
    }

    ria.__SYNTAX.Assert = Assert;

})();