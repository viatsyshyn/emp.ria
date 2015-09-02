(function (ria) {
    "use strict";

    TestCase("InterfaceTestCase").prototype = {

        tearDown: function () {
            if (ria.__SYNTAX) {
                ria.__SYNTAX.Registry.cleanUp();
                ria.__SYNTAX.registerSymbolsMeta();
                window.SELF = ria.__SYNTAX.Modifiers.SELF;
            }
        },

        testSelf: function () {

            var MyIfc = INTERFACE(
                'MyIfc', [
                    READONLY, SELF, 'myProp',

                    SELF, function method1() {},

                    [[SELF]],
                    VOID, function method2(a) {}
                ]);

            assertEquals(MyIfc, MyIfc.__META.methods.method1.retType);
            assertEquals(MyIfc, MyIfc.__META.methods.method2.argsTypes[0]);
            assertEquals(MyIfc, MyIfc.__META.methods.getMyProp.retType);
        },

        testProperties: function () {
            var MyIfc = INTERFACE(
                'MyIfc', [
                    Number, 'myProp',

                    READONLY, Boolean, 'myFlag'
                ]);

            assertNotUndefined(MyIfc.__META.methods.getMyProp);
            assertNotUndefined(MyIfc.__META.methods.setMyProp);

            assertNotUndefined(MyIfc.__META.methods.isMyFlag);
            assertUndefined(MyIfc.__META.methods.setMyFlag);
        },

        testCtor: function() {
            INTERFACE_E(Error('Interface ctors, named ctors and factories are not supported'),
                'MyIfc', [
                    function $() {}
                ]);

            INTERFACE_E(Error('Interface ctors, named ctors and factories are not supported'),
                'MyIfc', [
                    function $fromData(d) {}
                ]);

            INTERFACE_E(Error('Interface ctors, named ctors and factories are not supported'),
                'MyIfc', [
                    function $$(d) {}
                ]);
        },

        testStatics: function() {
            INTERFACE_E(Error('Interface static methods are not supported'),
                'MyIfc', [
                    function RUN() {}
                ]);
        },

        testExtends: function() {
            INTERFACE_E(Error('Interface can NOT extend classes or interfaces'),
                'MyIfc', EXTENDS(Class), []);
        },

        testImplements: function() {
            var BaseIfc = INTERFACE('BaseIfc', []);

            INTERFACE_E(Error('Interface can NOT implement interfaces'),
                'MyIfc', IMPLEMENTS(BaseIfc), []);
        },

        testDublicates: function() {
            INTERFACE_E(Error('Duplicate method declaration "method1"'),
                'MyIfc', [
                    function method1() {},
                    function method1(a, b) {}
                ]);

            INTERFACE_E(Error('Duplicate property declaration "prop"'),
                'MyIfc', [
                    'prop',
                    'prop',
                ]);
        },

        testMethodFlags: function() {
            INTERFACE_E(Error('Interface method can NOT be marked with ABSTRACT, OVERRIDE, READONLY or FINAL'),
                'MyIfc', [
                    OVERRIDE, function method1() {}
                ]);

            INTERFACE_E(Error('Interface method can NOT be marked with ABSTRACT, OVERRIDE, READONLY or FINAL'),
                'MyIfc', [
                    ABSTRACT, function method1() {}
                ]);

            INTERFACE_E(Error('Interface method can NOT be marked with ABSTRACT, OVERRIDE, READONLY or FINAL'),
                'MyIfc', [
                    READONLY, function method1() {}
                ]);

            INTERFACE_E(Error('Interface method can NOT be marked with ABSTRACT, OVERRIDE, READONLY or FINAL'),
                'MyIfc', [
                    FINAL, function method1() {}
                ]);
        },

        testPropertyFlags: function() {
            INTERFACE_E(Error('Interface property can NOT be marked with ABSTRACT, OVERRIDE or FINAL'),
                'MyIfc', [
                    OVERRIDE, 'prop'
                ]);

            INTERFACE_E(Error('Interface property can NOT be marked with ABSTRACT, OVERRIDE or FINAL'),
                'MyIfc', [
                    ABSTRACT, 'prop'
                ]);

            INTERFACE_E(Error('Interface property can NOT be marked with ABSTRACT, OVERRIDE or FINAL'),
                'MyIfc', [
                    FINAL, 'prop'
                ]);
        },

        testMethodAnnotation: function () {
            var MyAnnotation = ANNOTATION(
                function MyAnnotation() {});

            INTERFACE_E(Error('Interface method can NOT be annotated'),
                'MyIfc', [
                    [MyAnnotation],
                    function method1() {}
                ]);

            INTERFACE_E(Error('Interface properties can NOT be annotated'),
                'MyIfc', [
                    [MyAnnotation],
                    'prop'
                ]);
        },

        testFlags: function() {
            INTERFACE_E(Error('Interface can NOT be marked with ABSTRACT'),
                ABSTRACT, 'MyIfc', []);

            INTERFACE_E(Error('Interface can NOT be marked with FINAL'),
                FINAL, 'MyIfc', []);

            INTERFACE_E(Error('Interface can NOT be marked with READONLY'),
                READONLY, 'MyIfc', []);
        },

        testGenerics: function() {
            var MyIfc = INTERFACE(
                GENERIC('TSource', 'TReturn'),
                'IConverter', [
                    [[TSource]],
                    TReturn, function convert(source) {}
                ]);

            assertNotUndefined(MyIfc.__META.genericTypes);
            assertEquals(2, MyIfc.__META.genericTypes.length);
            assertTrue(ria.__API.isGeneralizedType(MyIfc.__META.methods.convert.retType));
            assertTrue(ria.__API.isGeneralizedType(MyIfc.__META.methods.convert.argsTypes[0]));

            assertEquals(ria.__API.OF, MyIfc.OF);
        },

        testImplementsGeneric: function () {
            var MyIfc = INTERFACE(
                GENERIC('TSource', 'TReturn'),
                'IConverter', [
                    [[TSource]],
                    TReturn, function convert(source) {}
                ]);

            var Impl = CLASS(
                'Impl', IMPLEMENTS(MyIfc.OF(String, Number)), [
                    [[String]],
                    Number, function convert(source) {}
                ]);

            assertTrue(ria.__API.implements(Impl, MyIfc));
            assertTrue(ria.__API.implements(Impl, MyIfc.OF(String,Number)));
            assertFalse(ria.__API.implements(Impl, MyIfc.OF(Number,String)));

            var Impl2 = CLASS(
                'Impl', IMPLEMENTS(MyIfc), [
                    [[Object]],
                    Object, function convert(source) {}
                ]);

            assertTrue(ria.__API.implements(Impl2, MyIfc));
            assertTrue(ria.__API.implements(Impl2, MyIfc.OF(String,Number)));
            assertTrue(ria.__API.implements(Impl2, MyIfc.OF(Number,String)));
        }
    };

})(ria);