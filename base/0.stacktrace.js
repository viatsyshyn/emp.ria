(function (global) {

    /**
     * Method borrowed at http://eriwen.com/javascript/js-stack-trace/
     *
     * @param {Error} e
     * @return {Array}
     */
    function getStackTrace(e) {
        var callstack = [];
        var lines, i, len;
        if (e.stack) { //Firefox, Chrome
            lines = e.stack.split('\n');
            for (i = 0, len = lines.length; i < len; i++) {
                if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                    callstack.push(lines[i]);
                }
            }
            callstack.shift(); //Remove call to printStackTrace()
            return callstack;
        }

        if (global.opera && e.message) { //Opera
            lines = e.message.split('\n');
            for (i = 0, len = lines.length; i < len; i++) {
                if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                    var entry = lines[i];
                    //Append next line also since it has the file info
                    if (lines[i + 1]) {
                        entry += ' at ' + lines[i + 1];
                        i++;
                    }
                    callstack.push(entry);
                }
            }
            callstack.shift(); //Remove call to printStackTrace()
            return callstack;
        }

        //IE and Safari
        try { // just in case IE crashes on .callee
            if (arguments.callee) {
                var currentFunction = arguments.callee.caller;
                while (currentFunction) {
                    var fn = currentFunction.toString();
                    var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf('')) || 'anonymous';
                    callstack.push(fname);
                    currentFunction = currentFunction.caller;
                }
            }
        } catch (e) {}

        return callstack;
    }

    /**
     * Wrapper over https://github.com/eriwen/javascript-stacktrace/blob/master/stacktrace.js
     * Just include it on page
     * @return {Function}
     */
    function getPrintStackTraceWrapper() {
        "use strict";
        return function (e) {
            return global.printStackTrace({
                e: e,
                guess: !_RELEASE
            });
        }
    }

    /**
     * @param {Error} e
     * @return {Array}
     */
    ria.__API.getStackTrace = global.printStackTrace ? getPrintStackTraceWrapper() : getStackTrace;
})(this);