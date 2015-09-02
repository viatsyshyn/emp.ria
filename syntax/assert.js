
/** @namespace ria.__SYNTAX */
ria.__SYNTAX = ria.__SYNTAX || {};

ria.__CFG.AssertWithExceptions = !!ria.__CFG.AssertWithExceptions;

(function () {
    "use strict";

    var skipMe = {};

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

        var msg = 'Assert failed with msg "' + msg_ + '". Debug?';
        if (skipMe[msg] || !confirm(msg)) {
          skipMe[msg] = new Date();

          if (console.trace) {
            console.trace(msg);
          } else {
            console.error('Assert failed with msg "' + msg_ + '". Debug?');
          }
        } else {
          debugger;
        }
    }

    ria.__SYNTAX.Assert = Assert;

})();
