REQUIRE('ria.reflection.ReflectionMethod');

(function (ria) {
    "use strict";

    function ClassDef(def) {
        return ria.__SYNTAX.parseClassDef(new ria.__SYNTAX.Tokenizer([].slice.call(def)));
    }

    function MakeClass(name, def) {
        "use strict";
        ria.__SYNTAX.precalcClassOptionalsAndBaseRefs(def, ria.__API.Class);
        ria.__SYNTAX.validateClassDecl(def, 'Class');
        return ria.__SYNTAX.compileClass(name, def);
    }

    TestCase("ReflectionMethodTestCase").prototype = {

        setUp: function () {
            ria.reflection.ReflectionMethod.DROP_CACHE();

            var MyAnnotation = this.MyAnnotation = ANNOTATION(
                function MyAnnotation() {});

            var MyAnnotation2 = this.MyAnnotation2 = ANNOTATION(
                function MyAnnotation2() {});

            var BugWarrior = this.BugWarrior = CLASS(
                'BugWarrior', [

                    function $() {
                        BASE();
                        this.prop = 0;
                    },

                    Number, 'prop',

                    String, function getQuestion() {},
                    Number, function getAnswer() {},

                    [MyAnnotation],
                    [[Number, String]],
                    String, function method1(a, b, c_, d_, e_) {},

                    Number, function method2() {},

                    [MyAnnotation2],
                    [[Number, String]],
                    VOID, function method3(a, b) {
                        this.prop += a;
                    }
                ]);

            this.BugWarrior2 = CLASS(
                'BugWarrior2', [
                    function $() {
                        BASE();
                        this.prop = 0;
                    },

                    Number, 'prop'
                ]);

            this.BugWarrior3 = CLASS(
                'BugWarrior3', EXTENDS(BugWarrior), []);


            this.reflectionMethod_getQuestion = new ria.reflection.ReflectionMethod(this.BugWarrior, 'getQuestion');
            this.reflectionMethod_getAnswer = new ria.reflection.ReflectionMethod(this.BugWarrior, 'getAnswer');
            this.reflectionMethod_method1 = new ria.reflection.ReflectionMethod(this.BugWarrior, 'method1');
            this.reflectionMethod_method2 = new ria.reflection.ReflectionMethod(this.BugWarrior, 'method2');
            this.reflectionMethod_method3 = new ria.reflection.ReflectionMethod(this.BugWarrior, 'method3');
        },

        testGetName: function () {
            assertEquals('window.BugWarrior#getQuestion', this.reflectionMethod_getQuestion.getName());
            assertEquals('getQuestion', this.reflectionMethod_getQuestion.getShortName());

            assertEquals('window.BugWarrior#getAnswer', this.reflectionMethod_getAnswer.getName());
            assertEquals('getAnswer', this.reflectionMethod_getAnswer.getShortName());
        },

        testAnnotationAndArgs: function () {

            var annotation1 = this.reflectionMethod_method1.getAnnotations();
            var annotation2 = this.reflectionMethod_method2.getAnnotations();

            assertArray(annotation1);
            assertEquals(1, annotation1.length);
            assertEquals('window.MyAnnotation', annotation1[0].__META.name);

            assertEquals([], annotation2);

            assertTrue(this.reflectionMethod_method1.isAnnotatedWith(this.MyAnnotation));
            assertFalse(this.reflectionMethod_method2.isAnnotatedWith(this.MyAnnotation2));
            assertFalse(this.reflectionMethod_method2.isAnnotatedWith(this.MyAnnotation));
            assertFalse(this.reflectionMethod_method3.isAnnotatedWith(this.MyAnnotation));
            assertTrue(this.reflectionMethod_method3.isAnnotatedWith(this.MyAnnotation2));

            assertEquals(this.reflectionMethod_method1.getReturnType(), String);
            assertEquals(['a', 'b', 'c_', 'd_', 'e_'], this.reflectionMethod_method1.getArguments());
            assertEquals(['a', 'b'], this.reflectionMethod_method1.getRequiredArguments());
            assertEquals([Number, String], this.reflectionMethod_method1.getArgumentsTypes());

            assertEquals(this.reflectionMethod_method2.getReturnType(), Number);
            assertEquals([], this.reflectionMethod_method2.getArguments());
            assertEquals([], this.reflectionMethod_method2.getRequiredArguments());
            assertEquals([], this.reflectionMethod_method2.getArgumentsTypes());
        },

        testInvokeOn: function () {
            var reflectionMethod = this.reflectionMethod_method3;

            var inst = new this.BugWarrior();
            var inst2 = new this.BugWarrior2();
            var inst3 = new this.BugWarrior3();

            reflectionMethod.invokeOn(inst, [5, '']);
            reflectionMethod.invokeOn(inst3, [3, '']);

            _DEBUG && assertException(function() {
                reflectionMethod.invokeOn(inst2, [5, '']);
            });

            assertEquals(inst.getProp(), 5);
            assertEquals(inst3.getProp(), 3);
        }
    };

})(ria);