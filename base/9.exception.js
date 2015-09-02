(function () {

    /** @class ria.__API.Exception */
    ria.__API.Exception = (function () {
        "use strict";
        function ExceptionBase() { return ria.__API.init(this, ExceptionBase, ExceptionBase.prototype.$, arguments); }
        ria.__API.clazz(ExceptionBase, 'Exception', null, [], []);

        ExceptionBase.prototype.$ = function (msg, inner_) {
            this.msg = msg;
            this.stack = ria.__API.getStackTrace(Error(msg));
            this.inner_ = inner_;
        };
        ria.__API.ctor('$', ExceptionBase, ExceptionBase.prototype.$, [String, [Error, ExceptionBase]], ['msg', 'inner_'], []);

        ExceptionBase.prototype.toString = function () {
            var msg = ria.__API.getIdentifierOfValue(this) + ': ' + this.msg + '\n  ' + this.stack.join('\n  ')
                .replace('Error:', '')
                .replace('Error@native', '');

            if (this.inner_) {
                msg += '\nCaused by: ';
                if (this.inner_ instanceof Error) {
                    msg += this.inner_.message + '\n' + this.inner_ + '\n' + ria.__API.getStackTrace(this.inner_).join('\n  ');
                } else {
                    msg += this.inner_.toString();
                }
            }

            return msg;
        };
        ria.__API.method(ExceptionBase, ExceptionBase.prototype.toString, 'toString', String, [], [], []);

        ExceptionBase.prototype.getMessage = function () { return this.msg; };
        ria.__API.method(ExceptionBase, ExceptionBase.prototype.getMessage, 'getMessage', String, [], [], []);

        ExceptionBase.prototype.getStack = function () { return this.stack; };
        ria.__API.method(ExceptionBase, ExceptionBase.prototype.getStack, 'getStack', Array, [], [], []);

        ria.__API.compile(ExceptionBase);
        return ExceptionBase;
    })();
})();