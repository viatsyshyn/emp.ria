REQUIRE('ria.reflection.ReflectionCtor');

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

    TestCase("ReflectionCtorTestCase").prototype = {

        setUp: function () {
            ria.reflection.ReflectionCtor.DROP_CACHE();

            var WarriorAnnotation = this.WarriorAnnotation = ANNOTATION(
                [[Number, Boolean]],
                function WarriorAnnotation(param, optional_) {});

            var MyAnnotation = this.MyAnnotation = ANNOTATION(
                [[Number, Boolean]],
                function MyAnnotation(param, optional_) {});

            this.BugWarrior = CLASS(
                [WarriorAnnotation(42)],
                'BugWarrior', [
                    [MyAnnotation],
                    [[Number, String, Number]],
                    function $(a, b, c_) {
                        BASE();
                        this.a = a;
                        this.b = b;
                    }
                ]);

            this.reflectionCtor = new ria.reflection.ReflectionCtor(this.BugWarrior);
        },

        testSelfEquals: function(){
            assertEquals(this.BugWarrior, this.BugWarrior);
        },

        testCtor: function () {

            assertEquals('window.BugWarrior#ctor', this.reflectionCtor.getName());

            var annotation1 = this.reflectionCtor.getAnnotations();
            assertArray(annotation1);
            assertEquals(1, annotation1.length);
            assertEquals('window.MyAnnotation', annotation1[0].__META.name);

            assertTrue(this.reflectionCtor.isAnnotatedWith(this.MyAnnotation));
            assertFalse(this.reflectionCtor.isAnnotatedWith(this.WarriorAnnotation));

            assertEquals(['a', 'b', 'c_'], this.reflectionCtor.getArguments());

            assertEquals([Number, String, Number], this.reflectionCtor.getArgumentsTypes());

            assertEquals(['a', 'b'], this.reflectionCtor.getRequiredArguments());
        }
    };

})(ria);