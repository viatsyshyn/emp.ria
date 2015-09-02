(function () {
    "use strict";

    TestCase("TypeHintsTestCase").prototype = {

        testCheckArgs: function () {
            var d = DELEGATE(
                [[String, Number]],
                Boolean, function TestDelegate(s, n_) {});

            var wrapper = d(function (s, n) { return s === String(n); });

            assertNoException(function () { wrapper('1'); });
            assertNoException(function () { wrapper('1', 2); });

            assertException(function () { wrapper(); }, Error('Bad argument for window.TestDelegate'));
            assertException(function () { wrapper(2, '3'); }, Error('Bad argument for window.TestDelegate'));
            assertException(function () { wrapper('2', 1, 3); }, Error('Bad argument for window.TestDelegate'));
        },

        testCheckReturn: function () {
            var d = DELEGATE(
                [[Object]],
                Boolean, function TestDelegate(s) {});

            var wrapper = d(function (s) { return s; });

            assertNoException(function () { wrapper(true); });
            assertException(function () { wrapper(2); }, Error('Bad return of window.TestDelegate'));
        },

        /*testClassOf: function () {
            //fail('test ClassOf(Class) extends ClassOf(BaseClass)');
        },*/

        testDelegateSpecification: function () {
            var Processor = DELEGATE(
                GENERIC('TSource', 'TResult'),
                [[TSource]],
                TResult, function Processor(source) {});

            var objProcessor = Processor(Object, Object, function (source) { return source; });
            assertNoException(function () { objProcessor(true);});
            assertNoException(function () { objProcessor("Source"); });
            assertNoException(function () { objProcessor(2); });

            var stringProcessor = Processor(String, String, function (source) { return source; });
            assertException(function () { stringProcessor(true); }, Error('Bad argument for window.Processor'));
            assertNoException(function () { stringProcessor("Source"); });
            assertException(function () { stringProcessor(2); }, Error('Bad argument for window.Processor'));

            var stringNumberProcessor = Processor(String, Number, function (source) { return source; });
            assertException(function () { stringNumberProcessor("Source"); }, Error('Bad return of window.Processor'));
        }
    };
})();