(function (ria) {
    "use strict";

    TestCase("IdentifierTestCase").prototype = {

        tearDown: function () {
            if (ria.__SYNTAX) {
                ria.__SYNTAX.Registry.cleanUp();
                ria.__SYNTAX.registerSymbolsMeta();
                window.SELF = ria.__SYNTAX.Modifiers.SELF;
            }
        },

        testBuildIdentifier: function () {
            var result = IDENTIFIER('MyIdentifier');

            assertNotUndefined(result);
            assertFunction(result);
            assertTrue(ria.__API.isIdentifier(result));
        },

        testPredefinedIdentifier: function () {
            var result = IDENTIFIER('MyIdentifier', {
                PRE_DEF: -1
            });

            assertNotUndefined(result);
            assertFunction(result);
            assertTrue(ria.__API.isIdentifier(result));
            assertInstanceOf(result, result.PRE_DEF);

            assertEquals(-1, result.PRE_DEF.valueOf());
            assertEquals(result.PRE_DEF, result(-1));
        }
    };

})(ria);