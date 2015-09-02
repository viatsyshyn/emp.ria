(function (ria) {
    "use strict";

    TestCase("DelegateTestCase").prototype = {

        tearDown: function () {
            if (ria.__SYNTAX) {
                ria.__SYNTAX.Registry.cleanUp();
                ria.__SYNTAX.registerSymbolsMeta();
                window.SELF = ria.__SYNTAX.Modifiers.SELF;
            }
        },

        testBuildDelegate: function () {
            var Compare = DELEGATE(
                [[String, String]],
                Boolean, function Compare(_1, _2) {});

            assertNotUndefined(Compare);
            assertFunction(Compare);
            assertTrue(ria.__API.isDelegate(Compare));
            assertEquals('window.Compare', Compare.__META.name);
        },

        testBuildDelegateWithAnnotation: function () {

            var MyAnnotation = ria.__API.annotation('MyAnnotation', [], []);

            DELEGATE_E(Error('Annotations are not supported in delegates'),
                [MyAnnotation],
                [[String, String]],
                Boolean, function compare(_1, _2) {});
        },

        testBuildDelegateWithFINAL: function () {

            DELEGATE_E(Error('Modifiers are not supported in delegates'),
                [[String, String]],
                FINAL, Boolean, function compare(_1, _2) {})
        },

        testBuildDelegateWithAbstract: function () {

            DELEGATE_E(Error('Modifiers are not supported in delegates'),
                [[String, String]],
                ABSTRACT, Boolean, function compare(_1, _2) {})
        },

        testBuildDelegateWithOverride: function () {

            DELEGATE_E(Error('Modifiers are not supported in delegates'),
                [[String, String]],
                OVERRIDE, Boolean, function compare(_1, _2) {})
        },

        testBuildAnnotationWithSelf: function () {

            DELEGATE_E(Error('Return type can\'t be SELF in delegates'),
                [[String, String]],
                SELF, function compare(_1, _2) {});

            DELEGATE_E(Error('Argument type can\'t be SELF in delegates'),
                [[String, SELF]],
                Boolean,function compare2(_1, _2) {});
        },

        testDelegateGenerics: function () {

            var delegate = DELEGATE(
                GENERIC('TKey', 'TValue'),
                [[TKey, TValue]],
                TValue, function map(key, value) {});

            assertNotUndefined(delegate.__META.genericTypes);
            assertEquals(2, delegate.__META.genericTypes.length);
            assertTrue(ria.__API.isGeneralizedType(delegate.__META.ret));
            assertTrue(ria.__API.isGeneralizedType(delegate.__META.argsTypes[0]));
            assertTrue(ria.__API.isGeneralizedType(delegate.__META.argsTypes[1]));

            assertEquals(ria.__API.OF, delegate.OF);
        }
    };

})(ria);