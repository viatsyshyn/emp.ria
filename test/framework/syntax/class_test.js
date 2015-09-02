(function (ria) {
    "use strict";

    function isDescendantOf(clazz, constructor){
        var o = clazz;
        while (o.__META != null) {
            if (o === constructor)
                break;

            o = o.__META.base;
        }
        return o === constructor;
    }

    TestCase("ClassTestCase").prototype = {

        /*setUp: function () {
            ria.__SYNTAX.Registry.cleanUp();
            ria.__SYNTAX.registerSymbolsMeta();
        },*/

        tearDown: function () {
            if (ria.__SYNTAX) {
                ria.__SYNTAX.Registry.cleanUp();
                ria.__SYNTAX.registerSymbolsMeta();
                window.SELF = ria.__SYNTAX.Modifiers.SELF;
            }
        },

        testSelf: function () {
            var BaseClass =
                CLASS('BaseClass', [


                    [[SELF]],
                    Number, function method2(a) {
                        return 3;
                    },

                    SELF, function me() {
                        return new BaseClass();
                    },

                    [[ArrayOf(SELF)]],
                    ArrayOf(SELF), function me1(a) {
                        return new BaseClass();
                    },

                    [[SELF]],
                    SELF, function me2(a) {
                        return new BaseClass();
                    },

                    [[SELF]],
                    VOID, function $named(me) { BASE(); },

                    [[SELF]],
                    VOID, function $(me) { BASE(); }
                ]);

            assertEquals(BaseClass, BaseClass.__META.methods['me'].retType);
            assertInstanceOf(ria.__API.ArrayOfDescriptor, BaseClass.__META.methods['me1'].retType);
            assertEquals(BaseClass, BaseClass.__META.methods['me1'].retType.clazz);
            assertInstanceOf(ria.__API.ArrayOfDescriptor, BaseClass.__META.methods['me1'].argsTypes[0]);
            assertEquals(BaseClass, BaseClass.__META.methods['me1'].argsTypes[0].clazz);
            assertEquals(BaseClass, BaseClass.__META.methods['me2'].retType);
            assertEquals(BaseClass, BaseClass.__META.methods['me2'].argsTypes[0]);
            assertEquals(BaseClass, BaseClass.__META.methods['method2'].argsTypes[0]);

            assertEquals(BaseClass, BaseClass.__META.defCtor.argsTypes[0]);
            assertEquals(BaseClass, BaseClass.__META.ctors['$named'].argsTypes[0]);
        },

        testExtending: function () {
            var BaseClass = CLASS(
                'BaseClass', [
                    [[Number]],
                    Number, function method1(a) {
                        return 2 * a;
                    },

                    [[Number]],
                    Number, function method2(a) {
                        return 3 * a;
                    },

                    FINAL, String, function hello() {
                        return 'Hello';
                    },

                    ABSTRACT, Boolean, function isMyComputerOn() {
                        return false;
                    },

                    SELF, function me() {
                        return new BaseClass();
                    }
                ]);

            var ChildClass = CLASS(
                FINAL, 'ChildClass', EXTENDS(BaseClass), [


                    [[Number]],
                    OVERRIDE, Number, function method2(a) {
                        return 3 * a;
                    },

                    OVERRIDE, Boolean, function isMyComputerOn() {
                        return true;
                    }
                ]);

            assertTrue(isDescendantOf(ChildClass, ria.__API.Class));
            assertTrue(isDescendantOf(ChildClass, BaseClass));
            assertTrue(isDescendantOf(ChildClass, ChildClass));
        },

        testFinalClassExtending: function () {
            var BaseClass = CLASS(
                FINAL, 'BaseClass', [


                    [[Number]],
                    Number, function method1(a) {
                        return 2 * a;
                    },

                    [[Number]],
                    Number, function method2(a) {
                        return 3 * a;
                    },

                    FINAL, String, function hello() {
                        return 'Hello';
                    },

                    ABSTRACT, Boolean, function isMyComputerOn() {
                        return false;
                    },

                    SELF, function me() {
                        return new BaseClass();
                    }
                ]);

            CLASS_E(Error('Can NOT extend final class window.BaseClass'),
                FINAL, 'MyClass', EXTENDS(BaseClass), [


                    [[Number]],
                    OVERRIDE, Number, function method2(a) {
                        return 3 * a;
                    },

                    OVERRIDE, Boolean, function isMyComputerOn() {
                        return true;
                    }
                ]);
        },

        testAbstractClassInstantiating: function(){
            var BaseClass = CLASS(
                ABSTRACT, 'BaseClass', [


                    [[Number]],
                    Number, function method1(a) {
                        return 2 * a;
                    }
                ]);

            var BaseClass2 = CLASS(
                'BaseClass2', [


                    [[Number]],
                    Number, function method1(a) {
                        return 2 * a;
                    }
                ]);

            assertException(function () { new BaseClass(); });
            assertNoException(function () { new BaseClass2(); });
        },

        testFinalMethodExtending: function () {
            var BaseClass = CLASS(
                'BaseClass', [

                    [[Number]],
                    Number, function method1(a) {
                        return 2 * a;
                    },

                    [[Number]],
                    Number, function method2(a) {
                        return 3 * a;
                    },

                    FINAL, String, function hello() {
                        return 'Hello';
                    },

                    ABSTRACT, Boolean, function isMyComputerOn() {
                        return false;
                    }
                ]);

            CLASS_E(Error('There is no ability to override final method hello in MyClass class'),
                'MyClass', EXTENDS(BaseClass), [


                    [[Number]],
                    OVERRIDE, Number, function method2(a) {
                        return 3 * a;
                    },

                    String, function hello() {
                        return 'Hello world';
                    },

                    Boolean, function isMyComputerOn() {
                        return true;
                    }
                ]);
        },

        testAbstractMethodExtending: function () {
            var BaseClass = CLASS(
                'BaseClass', [


                    [[Number]],
                    Number, function method1(a) {
                        return 2 * a;
                    },

                    [[Number]],
                    Number, function method2(a) {
                        return 3 * a;
                    },

                    FINAL, String, function hello() {
                        return 'Hello';
                    },

                    ABSTRACT, Boolean, function isMyComputerOn() {
                        return false;
                    }
                ]);

            CLASS_E(Error('The abstract method isMyComputerOn have to be overridden in MyClass class'),
                'MyClass', EXTENDS(BaseClass), [


                    [[Number]],
                    OVERRIDE, Number, function method2(a) {
                        return 3 * a;
                    }
                ]);
        },

        testOverrideMethodExtending: function () {
            var BaseClass = CLASS(
                'BaseClass', [


                    [[Number]],
                    Number, function method1(a) {
                        return 2 * a;
                    },

                    [[Number]],
                    Number, function method2(a) {
                        return 3 * a;
                    },

                    FINAL, String, function hello() {
                        return 'Hello';
                    },

                    ABSTRACT, Boolean, function isMyComputerOn() {
                        return false;
                    }
                ]);

            CLASS_E(Error('The overridden method method2 have to be marked as OVERRIDE in MyClass class'),
                'MyClass', EXTENDS(BaseClass), [


                    [[Number]],
                    Number, function method2(a) {
                        return 3 * a;
                    },

                    OVERRIDE, Boolean, function isMyComputerOn() {
                        return true;
                    }
                ]);

            CLASS_E(Error('The overridden method isMyComputerOn have to be marked as OVERRIDE in MyClass2 class'),
                'MyClass2', EXTENDS(BaseClass), [


                [[Number]],
                OVERRIDE, Number, function method2(a) {
                    return 3 * a;
                },

                Boolean, function isMyComputerOn() {
                    return true;
                }
            ]);
        },

        testTwoExtending: function () {
            var BaseClass = CLASS(
                'BaseClass', [


                    [[Number]],
                    Number, function method1(a) {
                        return 2 * a;
                    },

                    [[Number]],
                    Number, function method2(a) {
                        return 3 * a;
                    },

                    FINAL, String, function hello() {
                        return 'Hello';
                    },

                    ABSTRACT, Boolean, function isMyComputerOn() {
                        return false;
                    },

                    SELF, function me() {
                        return new BaseClass();
                    }
                ]);

            var FirstClass = CLASS(
                'FirstClass', EXTENDS(BaseClass), [


                    [[Number]],
                    Number, function method3(a) {
                        return 4 * a;
                    },

                    [[Number]],
                    Number, function method4(a) {
                        return 5 * a;
                    },

                    [[Number]],
                    OVERRIDE, Number, function method1(a) {
                        return 2 * a;
                    },

                    [[Number]],
                    OVERRIDE, Number, function method2(a) {
                        return 3 * a;
                    },

                    OVERRIDE, Boolean, function isMyComputerOn() {
                        return true;
                    },

                    ABSTRACT, Boolean, function isItToday() {
                        return false;
                    }
                ]);

            var SecondClass = CLASS(
                ABSTRACT, 'SecondClass', EXTENDS(FirstClass), [


                    [[Number]],
                    OVERRIDE, Number, function method3(a) {
                        return 4 * a;
                    },

                    [[Number]],
                    OVERRIDE, Number, function method2(a) {
                        return 3 * a;
                    },

                    OVERRIDE, FINAL, Boolean, function isMyComputerOn() {
                        return true;
                    },

                    OVERRIDE, Boolean, function isItToday() {
                        return false;
                    }
                ]);
        },

        testTwoExtendingWithFinal: function () {
            var BaseClass = CLASS(
                'BaseClass', [


                    [[Number]],
                    Number, function method1(a) {
                        return 2 * a;
                    },

                    [[Number]],
                    Number, function method2(a) {
                        return 3 * a;
                    },

                    FINAL, String, function hello() {
                        return 'Hello';
                    },

                    ABSTRACT, Boolean, function isMyComputerOn() {
                        return false;
                    },

                    SELF, function me() {
                        return new BaseClass();
                    }
                ]);

            var FirstClass = CLASS(
                'FirstClass', EXTENDS(BaseClass), [


                    [[Number]],
                    Number, function method3(a) {
                        return 4 * a;
                    },

                    [[Number]],
                    Number, function method4(a) {
                        return 5 * a;
                    },

                    [[Number]],
                    OVERRIDE, Number, function method1(a) {
                        return 2 * a;
                    },

                    [[Number]],
                    OVERRIDE, Number, function method2(a) {
                        return 3 * a;
                    },

                    OVERRIDE, Boolean, function isMyComputerOn() {
                        return true;
                    },

                    ABSTRACT, Boolean, function isItToday() {
                        return false;
                    }
                ]);

            CLASS_E(Error('Final method hello can\'t be overridden in SecondClass class'),
                'SecondClass', EXTENDS(FirstClass), [


                    [[Number]],
                    OVERRIDE, Number, function method3(a) {
                        return 4 * a;
                    },

                    [[Number]],
                    OVERRIDE, Number, function method2(a) {
                        return 3 * a;
                    },

                    [[Number]],
                    OVERRIDE, String, function hello() {
                        return 'Hello';
                    },

                    OVERRIDE, FINAL, Boolean, function isMyComputerOn() {
                        return true;
                    },

                    OVERRIDE, Boolean, function isItToday() {
                        return false;
                    }
                ]);
        },

        testTwoExtendingWithOverride: function () {
            var BaseClass = CLASS(
                'BaseClass', [


                    [[Number]],
                    Number, function method1(a) {
                        return 2 * a;
                    },

                    [[Number]],
                    Number, function method2(a) {
                        return 3 * a;
                    },

                    FINAL, String, function hello() {
                        return 'Hello';
                    },

                    ABSTRACT, Boolean, function isMyComputerOn() {
                        return false;
                    },

                    SELF, function me() {
                        return new BaseClass();
                    }
                ]);

            var FirstClass = CLASS(
                'FirstClass', EXTENDS(BaseClass), [


                    [[Number]],
                    Number, function method3(a) {
                        return 4 * a;
                    },

                    [[Number]],
                    Number, function method4(a) {
                        return 5 * a;
                    },

                    [[Number]],
                    OVERRIDE, Number, function method1(a) {
                        return 2 * a;
                    },

                    [[Number]],
                    OVERRIDE, Number, function method2(a) {
                        return 3 * a;
                    },

                    OVERRIDE, Boolean, function isMyComputerOn() {
                        return true;
                    },

                    ABSTRACT, Boolean, function isItToday() {
                        return false;
                    }
                ]);

            CLASS_E(Error('The overridden method method2 have to be marked as OVERRIDE in SecondClass class'),
                'SecondClass', EXTENDS(FirstClass), [


                    [[Number]],
                    OVERRIDE, Number, function method3(a) {
                        return 4 * a;
                    },

                    [[Number]],
                    Number, function method2(a) {
                        return 3 * a;
                    },

                    OVERRIDE, FINAL, Boolean, function isMyComputerOn() {
                        return true;
                    },

                    OVERRIDE, Boolean, function isItToday() {
                        return false;
                    }
                ]);
        },

        testTwoExtendingWithAbstract: function () {
            var BaseClass = CLASS(
                'BaseClass', [


                    [[Number]],
                    Number, function method1(a) {
                        return 2 * a;
                    },

                    [[Number]],
                    Number, function method2(a) {
                        return 3 * a;
                    },

                    FINAL, String, function hello() {
                        return 'Hello';
                    },

                    ABSTRACT, Boolean, function isMyComputerOn() {
                        return false;
                    },

                    SELF, function me() {
                        return new BaseClass();
                    }
                ]);

            var FirstClass = CLASS(
                'FirstClass', EXTENDS(BaseClass), [


                    [[Number]],
                    Number, function method3(a) {
                        return 4 * a;
                    },

                    [[Number]],
                    Number, function method4(a) {
                        return 5 * a;
                    },

                    [[Number]],
                    OVERRIDE, Number, function method1(a) {
                        return 2 * a;
                    },

                    [[Number]],
                    OVERRIDE, Number, function method2(a) {
                        return 3 * a;
                    },

                    OVERRIDE, Boolean, function isMyComputerOn() {
                        return true;
                    },

                    ABSTRACT, Boolean, function isItToday() {
                        return false;
                    }
                ]);

            CLASS_E(Error('Method method2 can\'t be abstract, because there is method with the same name in one of the base classes'),
                'SecondClass', EXTENDS(FirstClass), [


                    [[Number]],
                    OVERRIDE, Number, function method3(a) {
                        return 4 * a;
                    },

                    [[Number]],
                    OVERRIDE, ABSTRACT, Number, function method2(a) {
                        return 3 * a;
                    },

                    OVERRIDE, FINAL, Boolean, function isMyComputerOn() {
                        return true;
                    },

                    OVERRIDE, Boolean, function isItToday() {
                        return false;
                    }
                ]);

            CLASS_E(Error('The overridden method method2 have to be marked as OVERRIDE in ThirdClass class'),
                'ThirdClass', EXTENDS(FirstClass), [


                    [[Number]],
                    OVERRIDE, Number, function method3(a) {
                        return 4 * a;
                    },

                    [[Number]],
                    ABSTRACT, Number, function method2(a) {
                        return 3 * a;
                    },

                    OVERRIDE, FINAL, Boolean, function isMyComputerOn() {
                        return true;
                    },

                    OVERRIDE, Boolean, function isItToday() {
                        return false;
                    }
                ]);
        },

        testBASE: function () {
            var BaseClass = CLASS(
                'BaseClass', [
                    READONLY, Number, 'value',

                    function $(value) {
                        BASE();
                        this.value = value;
                    },

                    [[Number]],
                    VOID, function method(value) {
                        this.value = value;
                    }
                ]);

            var SecondClass = CLASS(
                'SecondClass', EXTENDS(BaseClass), [
                    function $() {
                        BASE(5);
                    },

                    [[Number]],
                    OVERRIDE, VOID, function method(value) {
                        BASE(value);
                    }
                ]);

            var instance = new SecondClass();

            assertEquals(instance.getValue(), 5);

            assertNoException(function () { instance.method(7); });

            assertEquals(instance.getValue(), 7);

            CLASS_E(Error('Base call are forbidden for non overriden methods. Method: "method7"'),
                'SecondClass2', EXTENDS(BaseClass), [
                    function $() {
                        BASE(5);
                    },

                    VOID, function method7() {
                        BASE();
                    }
                ]);
        },

        testSELF: function () {
            var BaseClass = CLASS(
                'BaseClass', [
                    Number, 'value',

                    function $() {
                        BASE();
                        _DEBUG && assertEquals(BaseClass, _GLOBAL.SELF);
                    },

                    VOID, function method() {
                        _DEBUG && assertEquals(BaseClass, _GLOBAL.SELF);
                    }
                ]);

            _DEBUG && assertNotEquals(BaseClass, _GLOBAL.SELF);

            var instance = new BaseClass();

            _DEBUG && assertNotEquals(BaseClass, _GLOBAL.SELF);

            instance.method();

            _DEBUG && assertNotEquals(BaseClass, _GLOBAL.SELF);
        },

        testPropertyInheritance: function () {
            var BaseClass = CLASS(
                'BaseClass', [
                    Number, 'value',

                    function $() {
                        BASE();
                        this.value = null;
                    },

                    VOID, function method(value) {
                        this.value = value;
                    }
                ]);

            assertNotNull(BaseClass.__META.properties['value']);
            assertFunction(BaseClass.__META.properties['value'].getter);
            assertFunction(BaseClass.__META.properties['value'].setter);

            var instance = new BaseClass();

            _DEBUG && assertUndefined(instance.value);
            instance.method(5);
            _DEBUG && assertUndefined(instance.value);

            _DEBUG && assertEquals(5, instance.__PROTECTED.value);
            _DEBUG || assertEquals(5, instance.value);

            assertEquals(5, instance.getValue());

            _DEBUG && assertUndefined(instance.value);
            assertNoException(function (){ instance.setValue(6); });
            _DEBUG && assertUndefined(instance.value);

            assertEquals(6, instance.getValue());
        },

        testPropertyFlags: function () {
            var BaseClass = CLASS(
                'BaseClass', [
                    function $() {
                        BASE();
                        this.abstractString = null;
                        this.value = null;
                        this.selfValue = null;
                    },

                    ABSTRACT, String, 'abstractString',

                    ABSTRACT, String, function getAbstractString() {
                        return this.abstractString;
                    },

                    [[String]],
                    ABSTRACT, VOID, function setAbstractString(string) {
                        this.abstractString = string;
                    },

                    FINAL, Number, 'value',

                    FINAL, Number, function getValue() {
                        return this.value;
                    },

                    FINAL, Number, 'value2'
                ]);

            var SecondClass = CLASS(
                'SecondClass', EXTENDS(BaseClass), [


                    OVERRIDE, String, function getAbstractString() {
                        return this.abstractString;
                    },

                    [[String]],
                    OVERRIDE, VOID, function setAbstractString(string) {
                        this.abstractString = string;
                    }
                ]);
        },

        testPropertyFlags_redefining: function () {
            var BaseClass = CLASS(
                'BaseClass', [


                    Number, 'value'
                ]);

            CLASS_E(Error('The overridden method getValue have to be marked as OVERRIDE in SecondClass class'),
                'SecondClass', EXTENDS(BaseClass), [


                    OVERRIDE, Number, 'value'
                ]);

            CLASS_E(Error('The overridden method getValue have to be marked as OVERRIDE in SecondClass2 class'),
                'SecondClass2', EXTENDS(BaseClass), [


                    Number, 'value'
                ]);
        },

        testPropertyFlags_differentFlagsToGettersSetters: function () {
            var BaseClass = CLASS(
                'BaseClass', [
                    function $() {
                        BASE();
                        this.value = null;
                    },

                    FINAL, Number, 'value',

                    FINAL, Number, function getValue() {
                        return this.value;
                    }
                ]);

            CLASS_E(Error('The flags of getter getValue should be the same with property flags'),
                'BaseClass2', [
                    function $() {
                        BASE();
                        this.value = null;
                    },

                    FINAL, Number, 'value',

                    ABSTRACT, Number, function getValue() {
                        return this.value;
                    }
                ]);
        },

        testPropertyFlags_abstractGettersSetters: function () {
            var BaseClass = CLASS(
                'BaseClass', [
                    function $() {
                        BASE();
                        this.abstractString = null;
                        this.value = null;
                        this.selfValue = null;
                    },

                    ABSTRACT, String, 'abstractString'
                ]);

            CLASS_E(Error('The abstract method getAbstractString have to be overridden in SecondClass class'),
                'SecondClass', EXTENDS(BaseClass), [

                ]);

            CLASS_E(Error('Method setAbstractString can\'t be abstract, because there is method with the same name in one of the base classes'),
                'SecondClass2', EXTENDS(BaseClass), [
                    OVERRIDE, String, function getAbstractString() {
                        return this.abstractString + "_";
                    }
                ]);

            CLASS_E(Error('The overridden method setAbstractString have to be marked as OVERRIDE in SecondClass3 class'),
                'SecondClass3', EXTENDS(BaseClass), [


                    OVERRIDE, String, function getAbstractString() {
                        return this.abstractString + "_";
                    },

                    [[String]],
                    VOID, function setAbstractString(string) {
                        this.abstractString = string;
                    }
                ]);
        },

        testPropertyFlags_overriddenGettersSetters: function () {
            var BaseClass = CLASS(
                'BaseClass', [
                    function $() {
                        BASE();
                        this.value = null;
                    },

                    Number, 'value',

                    Number, function getValue() {
                        return this.value;
                    }
                ]);

            var SecondClass = CLASS(
                'SecondClass', EXTENDS(BaseClass), [

                ]);

            CLASS_E(Error('Method getValue of ThirdClass should be marked with OVERRIDE as one base classes has same method'),
                'ThirdClass', EXTENDS(SecondClass), [


                    Number, function getValue() {
                        return this.value;
                    }
                ]);

            CLASS_E(Error('Method setValue of ThirdClass2 should be marked with OVERRIDE as one base classes has same method'),
                'ThirdClass2', EXTENDS(SecondClass), [


                    [[Number]],
                    VOID, function setValue(value) {
                        this.value = value;
                    }
                ]);

            var ThirdClass3 = CLASS(
                'ThirdClass3', EXTENDS(SecondClass), [


                    [[Number]],
                    OVERRIDE, VOID, function setValue(value) {
                        this.value = value;
                    }
                ]);

            var ThirdClass4 = CLASS(
                'ThirdClass4', EXTENDS(SecondClass), [


                    OVERRIDE, Number, function getValue() {
                        return this.value;
                    }
                ]);

            CLASS_E(Error('There is no getValue2 method in base classes of ThirdClass5 class'),
                'ThirdClass5', EXTENDS(SecondClass), [
                    function $() {
                        BASE();
                        this.value2 = null;
                    },

                    OVERRIDE, Number, function getValue2() {
                        return this.value2;
                    }
                ]);
        },

        testPropertyFlags_finalGettersSetters: function () {
            var BaseClass = CLASS(
                'BaseClass', [
                    function $() {
                        BASE();
                        this.value = null;
                        this.value2 = null;
                    },

                    FINAL, Number, 'value',

                    FINAL, Number, function getValue() {
                        return this.value;
                    },

                    Number, 'value2',

                    Number, function getValue2() {
                        return this.value2;
                    }
                ]);

            var SecondClass = CLASS(
                'SecondClass', EXTENDS(BaseClass), [

                ]);

            CLASS_E(Error('There is no ability to override final method getValue in SecondClass2 class'),
                'SecondClass2', EXTENDS(BaseClass), [


                    OVERRIDE, Number, function getValue() {
                        return this.value;
                    }
                ]);

            CLASS_E(Error('Final method getValue can\'t be overridden in ThirdClass class'),
                'ThirdClass', EXTENDS(SecondClass), [


                    OVERRIDE, Number, function getValue() {
                        return this.value;
                    }
                ]);

            var ThirdClass2 = CLASS(
                'ThirdClass2', EXTENDS(SecondClass), [


                    FINAL, OVERRIDE, Number, function getValue2() {
                        return this.value2;
                    }
                ]);
        },

        testPropertyFlags_overriddenAndFinal: function () {
            var BaseClass = CLASS(
                'BaseClass', [
                    function $() {
                        BASE();
                        this.value = null;
                    },

                    Number, 'value',

                    Number, function getValue() {
                        return this.value;
                    }
                ]);

            var SecondClass = CLASS(
                'SecondClass', EXTENDS(BaseClass), [


                    OVERRIDE, FINAL, Number, function getValue() {
                        return this.value * 2;
                    }
                ]);

            CLASS_E(Error('There is no ability to override final method getValue in ThirdClass class'),
                'ThirdClass', EXTENDS(SecondClass), [


                    OVERRIDE, Number, function getValue() {
                        return this.value * 3;
                    }
                ]);

            var first = new BaseClass();
            first.setValue(3);

            var second = new SecondClass();
            second.setValue(3);

            assertEquals(3, first.getValue());
            assertEquals(6, second.getValue());
        },

        testPropertySetterOverride: function () {
            var BaseClass = CLASS(
                'BaseClass', [
                    String, 'prop'
                ]);

            var ChildClass = CLASS(
                'ChildClass', EXTENDS(BaseClass), [
                    [[String]],
                    OVERRIDE, VOID, function setProp(v) {
                        BASE(v + '-test');
                    }
                ]);

            var instance = new ChildClass;
            instance.setProp('ha-ha');
            assertEquals('ha-ha-test', instance.getProp());

            assertNotNull(ChildClass.__META.properties["prop"]);
            assertFunction(ChildClass.__META.properties["prop"].getter);
            assertFunction(ChildClass.__META.properties["prop"].setter);

            assertNotEquals(BaseClass.prototype.setProp, ChildClass.__META.properties["prop"].setter);
            assertEquals(ChildClass.prototype.setProp, ChildClass.__META.properties["prop"].setter);
        },

        test$$: function () {
            var BaseClass = CLASS(
                'BaseClass', [
                    function $$(instance, clazz, ctor, args) {
                        //assertNotUndefined(instance);
                        assertFunction(clazz);
                        assertEquals(BaseClass, clazz);
                        assertFunction(ctor);
                        assertEquals(BaseClass.prototype.$, ctor);
                        assertEquals([1,2,'3'], args);
                        assertEquals(BaseClass, SELF);

                        return ria.__API.init(instance, clazz, ctor, ria.__API.clone(args).map(Number));
                    },

                    [[Number, Number, Number]],
                    function $(a,b,c) {
                        BASE();
                        this.value = a + b + c;
                    },

                    Number, 'value'
                ]);

            var instance;
            instance = BaseClass(1,2,'3');

            assertEquals(6, instance.getValue());

            instance = new BaseClass(1,2,'3');

            assertEquals(6, instance.getValue());
        },

        testBadNaming: function () {
            CLASS_E(Error('Invalid variable name 123BaseClass'),
                '123BaseClass', []);

            CLASS_E(Error('Invalid variable name 123test'),
                'BaseClass', [
                    String, '123test'
                ]);

            CLASS_E(Error('Invalid variable name VOID'),
                'BaseClass', [
                    VOID, function VOID() {}
                ]);
        },

        testMethodSignatureOverload: function () {
            var BaseClass = CLASS(
                'BaseClass', [
                    [[String, Object]],
                    String, function method(a, b_) {},

                    String, function m2() {}
                ]);

            var ChildClass = CLASS(
                'ChildClass', EXTENDS(BaseClass), [
                    [[Object, Object, String]],
                    OVERRIDE, String, function method(a_, b_, c_) {},

                    BaseClass, function getParent() {},
                    [[BaseClass]],
                    VOID, function setParent(v) {}
                ]);

            CLASS_E(Error('Method "method" returns Number, but base returns String'),
                'ChildClass', EXTENDS(BaseClass), [
                    [[Object, Object, String]],
                    OVERRIDE, Number, function method(a_, b_, c_) {}
                ]);

            CLASS_E(Error('Method "method" accepts Number for argument a_, but base accepts String'),
                'ChildClass', EXTENDS(BaseClass), [
                    [[Number, Object, String]],
                    OVERRIDE, String, function method(a_, b_, c_) {}
                ]);

            CLASS_E(Error('Method requires argument "b" that base does not have or optional. Method: "method"'),
                'ChildClass', EXTENDS(BaseClass), [
                    [[String, Object, String]],
                    OVERRIDE, String, function method(a, b) {}
                ]);

            CLASS_E(Error('Method requires argument "a" that base does not have or optional. Method: "m2"'),
                'ChildClass', EXTENDS(BaseClass), [
                    [[String, Object]],
                    OVERRIDE, String, function m2(a, b_) {}
                ]);

            CLASS_E(Error('Method accepts less arguments then base method. Method: "method"'),
                'ChildClass', EXTENDS(BaseClass), [
                    [[String, Object, String]],
                    OVERRIDE, String, function method(a_) {}
                ]);

            CLASS_E(Error('Method "method" returns *, but base returns String'),
                'ChildClass', EXTENDS(BaseClass), [
                    [[String, Object, String]],
                    OVERRIDE, function method(a, b_) {}
                ]);

            CLASS(
                'ChildClass2', EXTENDS(ChildClass), [
                    OVERRIDE, ChildClass, function getParent() {},
                    [[Class]],
                    OVERRIDE, VOID, function setParent(v) {}
                ]);

            CLASS(
                'ChildClass3', EXTENDS(ChildClass), [
                    OVERRIDE, SELF, function getParent() {}
                ]);


            CLASS_E(Error('Method "setParent" returns ChildClass4, but base returns void'),
                'ChildClass4', EXTENDS(ChildClass), [
                    OVERRIDE, SELF, function setParent(a) {}
                ]);
        },

        testNamedConstructors: function () {
            var BaseClass = CLASS(
                'BaseClass', [
                    ArrayOf(String), 'items',
                    [[ArrayOf(String)]],
                    function $fromArray(items) {
                        BASE();
                        this.setItems(items.slice());
                    }
                ]);

            var ChildClass = CLASS(
                'ChildClass', EXTENDS(BaseClass), [
                ]);

            assertNotUndefined(BaseClass.$fromArray);

            var instance = BaseClass.$fromArray(['1','2','3']);
            assertInstanceOf(BaseClass, instance);

            assertEquals(['1','2','3'], instance.getItems());
        },

        testImplicitGetterSettersBase: function () {
            var BaseClass = CLASS(
                'BaseClass', [
                    String, 'item'
                ]);

            var BaseClass2 = CLASS(
                'BaseClass2', EXTENDS(BaseClass), [
                ]);

            var ChildClass = CLASS(
                'ChildClass', EXTENDS(BaseClass2), [
                    OVERRIDE, String, function getItem() {
                        return BASE() + '-get';
                    }
                ]);

            var ChildClass2 = CLASS(
                'ChildClass', EXTENDS(ChildClass), [
                    [[String]],
                    OVERRIDE, VOID, function setItem(s) {
                        return BASE(s + '-set');
                    }
                ]);

            var instance = new ChildClass2();

            instance.setItem('test');
            assertEquals('test-set-get', instance.getItem());
        },

        testStaticMethods: function () {
            var Application = CLASS(
                'Application', [
                    [[SELF]],
                    VOID, function RUN (t_) {}
                ]);

            assertNotUndefined(Application.RUN);

            var instance = new Application();
            assertUndefined(instance.RUN);

            CLASS_E(Error('Only public static method are supported. Method: "RUN_"'),
                'Application', [
                    VOID, function RUN_() {}
                ]);

            assertNoException(function () {
                Application.RUN();
                Application.RUN(instance);
            });

            !_RELEASE && assertException(function () {
                Application.RUN(1);
            }, Error('Bad argument for window.Application.RUN'));

            !_RELEASE && assertException(function () {
                Application.RUN(instance, 3);
            }, Error('Bad argument for window.Application.RUN'));

            CLASS_E(Error('Base call are forbidden for non overriden methods. Method: "RUN_"'),
                'Application', [
                    VOID, function RUN_() { BASE(); }
                ]);

            CLASS_E(Error('Override on static method are not supported. Method: "RUN_"'),
                'Application', [
                    OVERRIDE, VOID, function RUN_() { BASE(); }
                ]);
        },

        testStaticProperties: function () {
            CLASS_E(Error('Static properties are not supported'),
                'Application', [
                    Class,'RUN'
                ]);
        },

        testInterfaceMethodSignatureOverride: function () {
            var BaseClass = CLASS(
                'BaseClass', []);

            var MyIfc = INTERFACE(
                'MyIfc', [
                    [[BaseClass]],
                    SELF, function op(t) {},

                    [[String, Boolean]],
                    VOID, function z(t, y) {}
                ]);

            CLASS(
                'ChildClass', IMPLEMENTS(MyIfc), [
                    [[BaseClass]],
                    MyIfc, function op(t_) {},

                    [[Object, Boolean]],
                    VOID, function z(t, y_) {}
                ]);

            CLASS_E(Error('Method "op" of interface window.MyIfc not implemented'),
                'ChildClass', IMPLEMENTS(MyIfc), []);

            CLASS_E(Error('Method requires argument "z" that base does not have or optional. Method: "z"'),
                'ChildClass', IMPLEMENTS(MyIfc), [
                    [[BaseClass]],
                    MyIfc, function op(t) {},

                    [[String, Boolean]],
                    VOID, function z(t, y, z) {}
                ]);

            CLASS_E(Error('Method "op" returns String, but base returns window.MyIfc'),
                'ChildClass', IMPLEMENTS(MyIfc), [
                    [[String, Boolean]],
                    VOID, function z(t, y) {},

                    [[BaseClass]],
                    String, function op(t) {}
                ]);
        },

        testInterfacePropertyOverride: function () {
            var BaseClass = CLASS(
                'BaseClass', []);

            var MyIfc = INTERFACE(
                'MyIfc', [
                    BaseClass, 'myProp'
                ]);

            CLASS(
                'ChildClass', IMPLEMENTS(MyIfc), [
                    BaseClass, function getMyProp() {},

                    [[BaseClass]],
                    VOID, function setMyProp(v) {}
                ]);

            CLASS(
                'ChildClass', IMPLEMENTS(MyIfc), [
                    BaseClass, 'myProp'
                ]);

            CLASS_E(Error('Method "getMyProp" of interface window.MyIfc not implemented'),
                'ChildClass', IMPLEMENTS(MyIfc), []);
        },

        testPropertyAndMethodWithSameName: function () {
            CLASS_E(Error('Method and property has same name "name"'),
                'MyClass', [
                    'name',
                    function name() {}
                ]);
        },

        testGenerics: function() {
            var MyConverter = CLASS(
                GENERIC('TSource', 'TReturn'),
                'Converter', [
                    [[TSource]],
                    TReturn, function convert(source) {
                        return source;
                    }
                ]);

            assertNotUndefined(MyConverter.__META.genericTypes);
            assertEquals(2, MyConverter.__META.genericTypes.length);
            assertTrue(ria.__API.isGeneralizedType(MyConverter.__META.methods.convert.retType));
            assertTrue(ria.__API.isGeneralizedType(MyConverter.__META.methods.convert.argsTypes[0]));

            var instance = new MyConverter(String, String);
            assertNoException(function () {
                instance.convert("test");
            });

            assertEquals(ria.__API.OF, MyConverter.OF);

            !_RELEASE && assertException(function () {
                instance.convert(5);
            }, Error('Bad argument for convert class window.Converter.OF(String,String)'));
        },

        testUseOfGenericDelegate: function () {
            var Processor = DELEGATE(
                GENERIC('TSource', 'TReturn'),
                [[TSource]],
                TReturn, function convert(source) {});

            var MyClass = CLASS(
                'MyClass', [
                    READONLY, Processor, 'genericProcessor',
                    READONLY, Processor.OF(String, Number), 'stringNumberProcessor',

                    [[Object]],
                    Object, function genericProcess(source) {
                        return source;
                    },

                    [[String]],
                    Number, function stringNumberProcess(source) {
                        return Number(source);
                    },

                    Processor, function getGenericProcessor() {
                        return this.genericProcess;
                    },

                    Processor.OF(String, Number), function getStringNumberProcessor() {
                        return this.stringNumberProcess;
                    }
                ]);

            var instance = new MyClass;

            var source = '5';
            assertEquals(source, instance.genericProcess(source));
            assertEquals(Number(source), instance.stringNumberProcess(source));

            assertNoException(function () {
                instance.getGenericProcessor();
            })
            assertNoException(function () {
                instance.getStringNumberProcessor();
            })
        },

        testImplementGenericIfc: function () {
            var MyIfc = INTERFACE(
                GENERIC('TSource', 'TReturn'),
                'MyIfc', [
                    [[TSource]],
                    TReturn, function convert(source) {}
                ]);

            var Impl1 = CLASS(
                'Impl1', IMPLEMENTS(MyIfc), [
                    [[Object]],
                    Object, function convert(source) {
                        return source;
                    }
                ]);

            var Impl2 = CLASS(
                'Impl2', IMPLEMENTS(MyIfc.OF(String, Number)), [
                    [[String]],
                    Number, function convert(source) {
                        return Number(source);
                    }
                ]);

            CLASS_E(Error('Method "convert" returns String, but base returns Number'),
                'Impl3', IMPLEMENTS(MyIfc.OF(String, Number)), [
                    [[String]],
                    String, function convert(source) {
                        return Number(source);
                    }
                ]);

            var i1 = new Impl1;
            assertNoException(function () {
                i1.convert("test");
                i1.convert(5)
            });

            var i2 = new Impl2;
            assertNoException(function () {
                i2.convert("test");
            });

            !_RELEASE && assertException(function () {
                i2.convert(5);
            }, Error('Bad argument for convert class window.Impl2'));
        },

        testExtendGenericClass: function () {
            var BaseClass = CLASS(
                GENERIC('TSource', 'TReturn'),
                'BaseClass', [
                    [[TSource]],
                    ABSTRACT, TReturn, function convert(source) { return null; }
                ]);

            var ChildClass1 = CLASS(
                'ChildClass1', EXTENDS(BaseClass), [
                    [[Object]],
                    OVERRIDE, Object, function convert(source) { return source; }
                ]);

            var ChildClass2 = CLASS(
                'ChildClass2', EXTENDS(BaseClass.OF(String, Number)), [
                    [[String]],
                    OVERRIDE, Number, function convert(source) { return Number(source); }
                ]);

            CLASS_E(Error('Method "convert" returns Boolean, but base returns Number'),
                'ChildClass3', EXTENDS(BaseClass.OF(String, Number)), [
                    [[String]],
                    OVERRIDE, Boolean, function convert(source) { return Number(source); }
                ]);
        },

        testGenericTypeDelegation: function () {
            var BaseClass = CLASS(
                GENERIC('TKey', 'TValue'),
                'BaseClass', [
                    [[TKey, TValue]],
                    VOID, function add(key, value) {},

                    [[TKey]],
                    TValue, function find(key) {},

                    [[TKey]],
                    VOID, function remove(key) {}
                ]);

            var ChildClass = CLASS(
                GENERIC('TValue'),
                'ChildClass', EXTENDS(BaseClass.OF(String, TValue)), [
                    [[String, TValue]],
                    OVERRIDE, VOID, function add(key, value) {},

                    [[String]],
                    OVERRIDE, TValue, function find(key) {},

                    [[String]],
                    OVERRIDE, VOID, function remove(key) {}
                ]);

            var ins = new ChildClass(Boolean);

            assertNoException(function () {
                ins.add('a', true);
                ins.add('b', false);
            });

            !_RELEASE && assertException(function () {
                ins.add(1, true);
            }, Error('Bad argument for add class window.ChildClass.OF(Boolean)'));

            !_RELEASE && assertException(function () {
                ins.add('b', 'false');
            }, Error('Bad argument for add class window.ChildClass.OF(Boolean)'))

            !_RELEASE && assertException(function () {
                ins.find(2);
            }, Error('Bad argument for find class window.ChildClass.OF(Boolean)'))
        },

        testGenericTypeDelegationToIfc: function () {
            var MyIfc = INTERFACE(
                GENERIC('TSource', 'TReturn'),
                'MyIfc', [
                    [[TSource]],
                    TReturn, function convert(source) {}
                ]);

            var BaseClass = CLASS(
                GENERIC('TSource', 'TReturn'),
                'BaseClass', IMPLEMENTS(MyIfc.OF(TSource, TReturn)), [
                    [[TSource]],
                    ABSTRACT, TReturn, function convert(source) { return null; }
                ]);

            var ChildClass = CLASS(
                'ChildClass', EXTENDS(BaseClass.OF(String, Number)), [
                    [[String]],
                    OVERRIDE, Number, function convert(source) {
                        return Number(source);
                    }
                ]);

            var ins = new ChildClass();

            assertNoException(function () {
                assertEquals(5, ins.convert('5'));
            })
        },

        testUseOfGenericIfc: function () {
            var MyIfc = INTERFACE(
                GENERIC('TKey', 'TValue'),
                'MyIfc', [
                    [[TKey, TValue]],
                    VOID, function add(k, v) {}
                ]);

            var Impl = CLASS(
                'Impl', IMPLEMENTS(MyIfc.OF(String, String)), [
                    [[String, String]],
                    VOID, function add(k, v) {}
                ]);

            var BaseClass = CLASS(
                'BaseClass', [
                    Impl, 'prop'
                ]);

            var impl = new Impl;
            var inst = new BaseClass;

            assertNoException(function () {
                inst.setProp(impl);
                assertEquals(impl, inst.getProp());
            })
        },

        testUseOfGenericIfc2: function () {
            var MyIfc = INTERFACE(
                GENERIC('TKey', 'TValue'),
                'MyIfc', [
                    [[TKey, TValue]],
                    VOID, function add(k, v) {}
                ]);

            var Impl = CLASS(
                GENERIC('TKey', 'TValue'),
                'Impl', IMPLEMENTS(MyIfc.OF(TKey, TValue)), [
                    [[TKey, TValue]],
                    VOID, function add(k, v) {}
                ]);

            var BaseClass = CLASS(
                GENERIC('TKey', 'TValue'),
                'BaseClass', [
                    Impl.OF(TKey, TValue), 'prop',
                    MyIfc.OF(TKey, TValue), 'prop2'
                ]);

            var impl = new Impl(String, String);
            var inst = new BaseClass(String, String);

            assertNoException(function () {
                inst.setProp(impl);
                assertEquals(impl, inst.getProp());
            });

            assertNoException(function () {
                inst.setProp2(impl);
                assertEquals(impl, inst.getProp2());
            });
        },

        testGenericRestrictions: function () {
            var MyIfc = INTERFACE(
                'MyIfc', []);

            var MyIfcImpl = CLASS(
                'MyIfcImpl', IMPLEMENTS(MyIfc), []);

            var BaseClass = CLASS(
                'BaseClass', []);

            var GenericClass = CLASS(
                GENERIC('TKey', ClassOf(BaseClass), 'TValue', ImplementerOf(MyIfc)),
                'GenericClass', []);

            var instance = GenericClass(BaseClass, MyIfcImpl);

            !_RELEASE && _DEBUG && assertException(function () {
                GenericClass(Class, MyIfcImpl);
            }, Error('Error instantiating class window.GenericClass'));

            !_RELEASE && _DEBUG && assertException(function () {
                GenericClass(BaseClass, Class);
            }, Error('Error instantiating class window.GenericClass'));
        },

        testGenericTypeReferenceInMembers: function () {
            var ItemClass = CLASS(
                'ItemClass', []);

            var BaseClass = CLASS(
                GENERIC('TItem'),
                'BaseClass', [
                    TItem, function method() {
                        return new TItem();
                    },

                    TItem, function method2() {
                        return TItem();
                    }
                ]);

            var instance = new BaseClass(ItemClass);

            assertInstanceOf(ItemClass, instance.method());
            assertInstanceOf(ItemClass, instance.method2());
        },

        testGenericRestrictionsAndExtending: function () {
            var BaseBaseModel = CLASS(
                'BaseBaseModel', []);

            var BaseModel = CLASS(
                GENERIC('TKey', ClassOf(BaseBaseModel)),
                'BaseModel', []);

            var BaseBaseTemplate = CLASS(
                'BaseBaseTemplate', []);

            var BaseTemplate = CLASS(
                GENERIC('TKey', ClassOf(BaseBaseModel)),
                'BaseTemplate', [
                    BaseModel.OF(TKey), 'model'
                ]);

            var ChildBaseModel = CLASS(
                'ChildBaseModel', EXTENDS(BaseBaseModel), []);

            CLASS(
                GENERIC('TKey', ClassOf(ChildBaseModel)),
                'BaseTemplate3', [
                    BaseModel.OF(TKey), 'model'
                ]);

            _DEBUG && (function () {
                assertException(function () {
                    CLASS(
                        GENERIC('TKey', ClassOf(Class)),
                        'BaseTemplate', [
                            BaseModel.OF(TKey), 'model'
                        ]);
                }, Error('Specification of window.BaseModel failed.'));

                assertException(function () {
                    CLASS(
                        GENERIC('TKey'),
                        'BaseTemplate2', [
                            BaseModel.OF(TKey), 'model'
                        ]);
                }, Error('Specification of window.BaseModel failed.'));

                var OtherBaseModel = CLASS(
                    'OtherBaseModel', []);

                assertException(function () {
                    CLASS(
                        GENERIC('TKey', ClassOf(OtherBaseModel)),
                        'BaseTemplate3', [
                            BaseModel.OF(TKey), 'model'
                        ]);
                }, Error('Specification of window.BaseModel failed.'));
            })();
        },

        testGenericRestrictionsAndInstantiation: function () {
            var BaseViewModel = CLASS(
                'BaseViewModel', []);

            var BaseModel = CLASS(
                'BaseModel', []);

            var BaseTemplate = CLASS(
                GENERIC('TKey', ClassOf(BaseModel)),
                'BaseTemplate', [
                    [[TKey]],
                    function $(a_) { BASE() }
                ]);

            var ChildModel = CLASS(
                'ChildModel', EXTENDS(BaseModel), []);

            var ChildViewModel = CLASS(
                'ChildViewModel', EXTENDS(BaseViewModel), []);

            var BaseViewData = CLASS(
                GENERIC('T', ClassOf(BaseViewModel)),
                'BaseViewData', EXTENDS(BaseTemplate.OF(BaseModel)), []);

            assertNoException(function () {
                new BaseViewData(ChildViewModel)
            })
        },

        testMissingConstructorInChild: function () {
            var BaseClass = CLASS(
                'BaseClass', [
                    function $(p, b) { BASE(); }
                ]);

            CLASS_E(Error('Can NOT create default constructor, base requires more then 0 args'),
                'ChildClass', EXTENDS(BaseClass), [])
        },

        testUnSafeClass: function () {
            var BaseClass = CLASS(UNSAFE,
                'BaseClass', [
                    [[Boolean]],
                    function method(trueScope) {
                        assertEquals(trueScope, this instanceof SELF);
                    }
                ]);

            var instance = BaseClass();

            instance.method(_DEBUG || true);

            var method = instance.method;

            method(_DEBUG || false);

        },

        testBaseClassInterface: function () {
            var BaseClass_ = CLASS('BaseClass_', [
                function myBaseMethod() {},
                function myVirtual() { return 'base'; },

                SELF, function getMe() {
                    return this;
                }
            ]);

            var ChildClass_ = CLASS('ChildClass_', EXTENDS(BaseClass_), [
                OVERRIDE, function myVirtual() { return 'child' },
                function myChildMethod() {}
            ]);

            var instance = new ChildClass_();

            assertInstanceOf(BaseClass_, instance);
            assertInstanceOf(ChildClass_, instance);

            assertEquals(ChildClass_, instance.getClass());

            assertFunction(instance.myBaseMethod);
            assertFunction(instance.myVirtual);
            assertFunction(instance.myChildMethod);
            assertFunction(instance.getMe);

            assertEquals('child', instance.myVirtual());

            var proxiedInstance = instance.getMe();

            console.dir(proxiedInstance);

            assertInstanceOf(BaseClass_, proxiedInstance);
            assertEquals(ChildClass_, proxiedInstance.getClass());
            assertFunction(proxiedInstance.myBaseMethod);
            assertFunction(proxiedInstance.myVirtual);
            assertFunction(proxiedInstance.getMe);
            assertEquals('child', proxiedInstance.myVirtual());

            if (_DEBUG) {
                assertNotInstanceOf(ChildClass_, proxiedInstance);
                assertUndefined(proxiedInstance.myChildMethod);
            }
        }
    };
})(ria);