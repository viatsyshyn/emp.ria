REQUIRE('ria.reflection.ReflectionInterface');

(function (ria) {
    "use strict";

    function InterfaceDef(def) {
        return ria.__SYNTAX.parseClassDef(new ria.__SYNTAX.Tokenizer([].slice.call(def)));
    }

    function MakeInterface(name, def) {
        "use strict";
        ria.__SYNTAX.validateInterfaceDecl(def);
        return ria.__SYNTAX.compileInterface(name, def);
    }

    TestCase("ReflectionInterfaceTestCase").prototype = {

        setUp: function() {
            this.BugWarriorIfc = INTERFACE(
                'BugWarriorIfc', [
                    READONLY, SELF, 'myProp',

                    SELF, function method1() {},

                    [[SELF, String]],
                    VOID, function method2(a, b) {},

                    String, function method3() {}
                ]);

            this.reflectionIfc = new ria.reflection.ReflectionInterface(this.BugWarriorIfc);
        },

        testSelfEquals: function(){
            assertEquals(this.BugWarriorIfc, this.BugWarriorIfc);
        },

        testGetName: function () {
            assertEquals(this.reflectionIfc.getName(), 'window.BugWarriorIfc');
        },

        testGetMethodNames: function(){
            var methodNames = this.reflectionIfc.getMethodsNames();
            assertArray(methodNames);

            var expected = ['method1', 'method2', 'method3', 'getMyProp'].sort();
            assertEquals(expected, methodNames.sort());
        },

        testGetMethodReturnType: function() {
            assertEquals(this.reflectionIfc.getMethodReturnType('method1'), this.BugWarriorIfc);
            assertUndefined(this.reflectionIfc.getMethodReturnType('method2'));
            assertEquals(this.reflectionIfc.getMethodReturnType('method3'), String);
            assertEquals(this.reflectionIfc.getMethodReturnType('getMyProp'), this.BugWarriorIfc);
        },
        testGetMethodArguments: function() {

            assertEquals([], this.reflectionIfc.getMethodArguments('method1'));
            assertEquals(['a', 'b'], this.reflectionIfc.getMethodArguments('method2'));
            assertEquals([], this.reflectionIfc.getMethodArguments('getMyProp'));
        },

        testGetMethodArgumentsTypes: function(){
            assertEquals([], this.reflectionIfc.getMethodArgumentsTypes('method1'));
            assertEquals('Expected BugWarriorIfc, String', [this.BugWarriorIfc, String], this.reflectionIfc.getMethodArgumentsTypes('method2'));
            assertEquals([], this.reflectionIfc.getMethodArgumentsTypes('getMyProp'));
        },

        testHasMethod: function(){
            assertTrue(this.reflectionIfc.hasMethod('method1'));
            assertTrue(this.reflectionIfc.hasMethod('method2'));
            assertTrue(this.reflectionIfc.hasMethod('method3'));
            assertTrue(this.reflectionIfc.hasMethod('getMyProp'));
            assertFalse(this.reflectionIfc.hasMethod('method4'))
        }
    };

})(ria);