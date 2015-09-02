(function (ria) {
    "use strict";

    TestCase("InterfaceTestCase").prototype = {
        setUp: function(){},

        testCreate: function () {
            function InterfaceProxy() {
                throw Error ('Can not instantiate interface');
            }

            ria.__API.ifc(InterfaceProxy, 'TestInterface', ['compare', Boolean, [String, String], ['_1', '_2']]);

            assertNotUndefined(InterfaceProxy);
            assertTrue(ria.__API.isInterface(InterfaceProxy))
        }
    }
})(ria);
