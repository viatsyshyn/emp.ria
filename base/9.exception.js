(function () {
    "use strict";

    function beautifyStack(s) {
        try {
            return s.split('\n').map(function (_) { return _.trim(); }).join('\n    ').trim();
        } catch (e) { return s; }
    }

    function getErrorDetails(e) {
        return beautifyStack(e.stack || e.description || e.message || e.toString());
    }

    /** @class ria.__API.Exception */
    ria.__API.Exception = (function () {
        "use strict";
        function ExceptionBase() { return ria.__API.init(this, ExceptionBase, ExceptionBase.prototype.$, arguments); }
        ria.__API.clazz(ExceptionBase, 'Exception', null, [], []);

        ExceptionBase.prototype.$ = function (msg, inner_) {
            this.msg = msg;
            try { throw Error(msg); } catch (e) {
                this.stack = getErrorDetails(e);
            }
            this.inner_ = inner_;
        };
        ria.__API.ctor('$', ExceptionBase, ExceptionBase.prototype.$, [String, [Error, ExceptionBase]], ['msg', 'inner_'], []);

        ExceptionBase.prototype.toString = function () {
            var msg = ria.__API.getIdentifierOfValue(this) + ': ' + this.msg + '\n  Details: ' + this.stack
                .replace('Error:', '')
                .replace('Error@native', '');

            if (this.inner_) {
                msg += '\nCaused by: ' +((this.inner_ instanceof Error) ? getErrorDetails(this.inner_) : this.inner_.toString());
            }

            return msg;
        };
        ria.__API.method(ExceptionBase, ExceptionBase.prototype.toString, 'toString', String, [], [], []);

        ExceptionBase.prototype.getMessage = function () { return this.msg; };
        ria.__API.method(ExceptionBase, ExceptionBase.prototype.getMessage, 'getMessage', String, [], [], []);

        ExceptionBase.prototype.getStack = function () { return this.stack.split('\n').map(function (_) { return _.trim(); }); };
        ria.__API.method(ExceptionBase, ExceptionBase.prototype.getStack, 'getStack', Array, [], [], []);

        ria.__API.compile(ExceptionBase);
        return ExceptionBase;
    })();
})();