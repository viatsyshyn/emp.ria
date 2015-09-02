(function (ria) {
    "use strict";

    TestCase("AnnotationTestCase").prototype = {
        setUp: function(){},

        testCreate: function () {
            var a = ria.__API.annotation('TestAnnotation', [Boolean, Number], ['x', 'y_']);

            assertFunction(a);
            assertNotUndefined(a.__META);
        },

        testUsage: function() {
            var a = ria.__API.annotation('TestAnnotation', [Boolean, Number], ['x', 'y_']);

            assertNoException(function () { a(true); });
            assertNoException(function () { a(true,2); });

            //assertException(function () { a('2'); }, 'Error');
            //assertException(function () { a(true, 5, null); }, 'Error');

            assertTrue(ria.__API.isAnnotation(a));
            assertTrue(ria.__API.isAnnotation(a(true)));

            var instance = a(true, 2);

            assertEquals(true, instance.x);
            assertEquals(2, instance.y_);
        }
    }
})(ria);
