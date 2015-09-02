(function (ria) {
    "use strict";

    TestCase("EnumTestCase").prototype = {
        testBuildEnum: function () {
            var result = ENUM('Enumchyk', {
                TWIX: true,
                MARS: 2,
                NUTS: '3'
            });

            assertNotUndefined(result);
            assertFunction(result);
            assertTrue(ria.__API.isEnum(result));
        },

        testEnumException: function () {
            ENUM_E(Error('Enum value should Number, String or Boolean, got function'),
                'Enumchyk', {
                    TWIX: true,
                    MARS: function (){},
                    NUTS: '3'
                });
        }
    };

})(ria);