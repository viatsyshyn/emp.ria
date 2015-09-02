REQUIRE('ria.reflection.ReflectionProperty');

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

    TestCase("ReflectionPropertyTestCase").prototype = {

        setUp: function () {
            ria.reflection.ReflectionProperty.DROP_CACHE();

            var MyAnnotation = this.MyAnnotation = ANNOTATION(
                function MyAnnotation() {});

            var MyAnnotation2 = this.MyAnnotation2 = ANNOTATION(
                function MyAnnotation2() {});

            var BugWarrior = this.BugWarrior = CLASS(
                'BugWarrior', [
                    [MyAnnotation],
                    READONLY, SELF, 'myProp1',

                    READONLY, String, 'myProp2',

                    [MyAnnotation2],
                    Number, 'myProp3'
                ]);

            this.reflectionProperty_myProp1 = new ria.reflection.ReflectionProperty(this.BugWarrior, 'myProp1');
            this.reflectionProperty_myProp2 = new ria.reflection.ReflectionProperty(this.BugWarrior, 'myProp2');
            this.reflectionProperty_myProp3 = new ria.reflection.ReflectionProperty(this.BugWarrior, 'myProp3');

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
        },

        testGetNameAndReadOnly: function () {
            assertEquals('window.BugWarrior#myProp1', this.reflectionProperty_myProp1.getName());
            assertEquals('myProp1', this.reflectionProperty_myProp1.getShortName());

            assertEquals('window.BugWarrior#myProp2', this.reflectionProperty_myProp2.getName());
            assertEquals('myProp2', this.reflectionProperty_myProp2.getShortName());

            assertTrue(this.reflectionProperty_myProp1.isReadonly());
            assertTrue(this.reflectionProperty_myProp2.isReadonly());
            assertFalse(this.reflectionProperty_myProp3.isReadonly());
        },

        testAnnotationAndArgs: function () {

            var annotation1 = this.reflectionProperty_myProp1.getAnnotations();
            var annotation2 = this.reflectionProperty_myProp2.getAnnotations();
            var annotation3 = this.reflectionProperty_myProp3.getAnnotations();

            assertArray(annotation1);
            assertEquals(1, annotation1.length);
            assertEquals('window.MyAnnotation', annotation1[0].__META.name);

            assertEquals([], annotation2);
            
            assertArray(annotation3);
            assertEquals(1, annotation3.length);
            assertEquals('window.MyAnnotation2', annotation3[0].__META.name);

            assertTrue(this.reflectionProperty_myProp1.isAnnotatedWith(this.MyAnnotation));
            assertFalse(this.reflectionProperty_myProp2.isAnnotatedWith(this.MyAnnotation2));
            assertFalse(this.reflectionProperty_myProp2.isAnnotatedWith(this.MyAnnotation));
            assertFalse(this.reflectionProperty_myProp3.isAnnotatedWith(this.MyAnnotation));
            assertTrue(this.reflectionProperty_myProp3.isAnnotatedWith(this.MyAnnotation2));

            assertEquals(this.BugWarrior, this.reflectionProperty_myProp1.getType());
            assertEquals(String, this.reflectionProperty_myProp2.getType());
            assertEquals(Number, this.reflectionProperty_myProp3.getType());
        },

        testInvokeOn: function () {

            var reflectionProperty = this.reflectionProperty_myProp3;

            var inst = new this.BugWarrior();
            var inst2 = new this.BugWarrior2();
            var inst3 = new this.BugWarrior3();

            reflectionProperty.invokeSetterOn(inst, 5);
            reflectionProperty.invokeSetterOn(inst3, 3);

            _DEBUG && assertException(function(){
                reflectionProperty.invokeSetterOn(inst2, 5);
            });

            assertEquals(5, reflectionProperty.invokeGetterOn(inst));
            assertEquals(3, reflectionProperty.invokeGetterOn(inst3));
        }
    };

})(ria);