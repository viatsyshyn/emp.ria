(function (ria) {
    "use strict";

    TestCase("DelegateTestCase").prototype = {
        setUp: function(){},

        testDeclaration: function () {
            var d = ria.__API.delegate('TestDelegate', Boolean, [String, Number], ['s', 'n']);

            assertFunction(d);
            assertNotUndefined(d.__META);
            assertInstanceOf(ria.__API.MethodDescriptor, d.__META);
        },

        testUsage: function() {
            var d = ria.__API.delegate('TestDelegate', Boolean, [String, Number], ['s', 'n']);
            var wrapper = d(function (s, n) { return s === String(n); });

            assertFunction(wrapper);
        }
    }
})(ria);
