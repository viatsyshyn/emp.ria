(function (ria) {
    "use strict";

    TestCase("AnnotationTestCase").prototype = {

        tearDown: function () {
            if (ria.__SYNTAX) {
                ria.__SYNTAX.Registry.cleanUp();
                ria.__SYNTAX.registerSymbolsMeta();
                window.SELF = ria.__SYNTAX.Modifiers.SELF;
            }
        },

        testBuildAnnotation: function () {
            var result = ANNOTATION(
                [[String, String]],
                function Compare(_1, _2) {});

            assertNotUndefined(result);
            assertFunction(result);
            assertTrue(ria.__API.isAnnotation(result));
            assertEquals('window.Compare', result.__META.name);
        },

        testBuildAnnotationWithAnnotation: function () {

            var MyAnnotation = ria.__API.annotation('MyAnnotation', [], []);

            ANNOTATION_E(Error('Annotations are not supported in annotations'),
                [MyAnnotation],
                [[String, String]],
                function compare(_1, _2) {});
        },

        testBuildAnnotationWithFINAL: function () {

            ANNOTATION_E(Error('Modifiers are not supported in annotations'),
                [[String, String]],
                FINAL, function compare(_1, _2) {});
        },

        testBuildAnnotationWithAbstract: function () {

            ANNOTATION_E(Error('Modifiers are not supported in annotations'),
                [[String, String]],
                ABSTRACT, function compare(_1, _2) {});
        },

        testBuildAnnotationWithOverride: function () {

            ANNOTATION_E(Error('Modifiers are not supported in annotations'),
                [[String, String]],
                OVERRIDE, function compare(_1, _2) {});
        },

        testBuildAnnotationWithReturnType: function () {

            ANNOTATION_E(Error('Return type is not supported in annotations'),
                [[String, String]],
                Boolean, function compare(_1, _2) {});
        },

        testBuildAnnotationWithVoid: function () {

            ANNOTATION_E(Error('Return type is not supported in annotations'),
                [[String, String]],
                VOID, function compare(_1, _2) {});
        },

        testBuildAnnotationWithSelf: function () {

            ANNOTATION_E(Error('Return type is not supported in annotations'),
                [[String, String]],
                SELF, function compare(_1, _2) {});
        },

        testBuildAnnotationWithSelfArgs: function () {

            ANNOTATION_E(Error('Argument type can\'t be SELF in annotations'),
                [[String, SELF]],
                function compare2(_1, _2) {});
        }
    };

})(ria);