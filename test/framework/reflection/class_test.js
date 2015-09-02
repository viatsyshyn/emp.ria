REQUIRE('ria.reflection.ReflectionClass');

(function (ria) {
    "use strict";

    TestCase("ReflectionClassTestCase").prototype = {

        setUp: function () {
            ria.reflection.ReflectionProperty.DROP_CACHE();
            ria.reflection.ReflectionMethod.DROP_CACHE();
            ria.reflection.ReflectionCtor.DROP_CACHE();
            ria.reflection.ReflectionClass.DROP_CACHE();
        },

        tearDown: function () {
            if (ria.__SYNTAX) {
                ria.__SYNTAX.Registry.cleanUp();
                ria.__SYNTAX.registerSymbolsMeta();
                window.SELF = ria.__SYNTAX.Modifiers.SELF;
            }
        },

        testSelfEquals: function(){
            var BugWarrior = CLASS('BugWarrior', []);

            assertEquals(BugWarrior, BugWarrior);
        },

        testGetName: function () {
            var BugWarrior = CLASS('BugWarrior', []);
            var reflectionCls = new ria.reflection.ReflectionClass(BugWarrior);
            assertEquals('window.BugWarrior', reflectionCls.getName());
        },
        testGetShortName: function() {
            var BugWarrior = CLASS('BugWarrior', []);
            var reflectionCls = new ria.reflection.ReflectionClass(BugWarrior);
            assertEquals('BugWarrior', reflectionCls.getShortName());
        },
        testGetBaseClass: function(){
            var BugWarrior = CLASS(
                'BugWarrior', []);

            var BugWarriorTaras = CLASS(
                'BugWarriorTaras', EXTENDS(BugWarrior), []);

            var reflectionCls = new ria.reflection.ReflectionClass(BugWarriorTaras);

            assertEquals(BugWarrior, BugWarriorTaras.__META.base);
            assertEquals(BugWarrior, reflectionCls.getBaseClass());
        },
        testGetBaseClassReflector: function(){
            var BugWarrior = CLASS(
                'BugWarrior', []);

            var BugWarriorTaras = CLASS(
                'BugWarriorTaras', EXTENDS(BugWarrior), []);

            var reflectionCls = new ria.reflection.ReflectionClass(BugWarriorTaras);

            var baseViaReflector = reflectionCls.getBaseClassReflector().getClazz();
            assertEquals(BugWarrior, baseViaReflector);

            var base = reflectionCls.getBaseClass();
            assertEquals(base, baseViaReflector);
        },
        testGetInterfaces: function(){
            var TestInterface =
                INTERFACE('TestInterface', [
                    READONLY, Number, 'answer',
                    VOID, function askQuestion() {}
                ]);

            var Implementor = CLASS(
                'Implementor', IMPLEMENTS(TestInterface), [
                    READONLY, Number, 'answer',
                    VOID, function askQuestion() {}
                ]);

            var reflectionCls = new ria.reflection.ReflectionClass(Implementor);

            var interfaces = reflectionCls.getInterfaces();

            assertNotUndefined(interfaces);
            assertEquals(1, interfaces.length);
            assertEquals(TestInterface, interfaces[0]);
        },
        testGetInterfacesReflector: function(){
            var TestInterface =
                INTERFACE('TestInterface', [
                    READONLY, Number, 'answer',
                    VOID, function askQuestion() {}
                ]);

            var Implementor = CLASS(
                'Implementor', IMPLEMENTS(TestInterface), [
                    READONLY, Number, 'answer',
                    VOID, function askQuestion() {}
                ]);

            var reflectionCls = new ria.reflection.ReflectionClass(Implementor);

            var reflectors = reflectionCls.getInterfacesReflector();
            assertNotUndefined(reflectors);
            assertEquals(1, reflectors.length);
            assertInstanceOf(ria.reflection.ReflectionInterface, reflectors[0]);
            assertEquals(TestInterface, reflectors[0].getIfc());
        },
        testGetAnnotations: function() {

            var WarriorAnnotation = ANNOTATION(
                [[Number, Boolean]],
                function Annotation(param, optional_){});

            var BugWarrior = CLASS(
                [WarriorAnnotation(42)],
                'BugWarrior', []);

            var reflectionCls = new ria.reflection.ReflectionClass(BugWarrior);

            var annotations = reflectionCls.getAnnotations();

            assertNotUndefined(annotations);
            assertEquals(1, annotations.length);
            assertEquals(42, annotations[0].param);
            assertUndefined(annotations[0].optional_);
        },
        testIsAnnotatedWith: function() {

            var WarriorAnnotation = ANNOTATION(
                [[Number, Boolean]],
                function WarriorAnnotation(param, optional_) {});

            var WarriorAnnotation2 = ANNOTATION(
                [[Number, Boolean]],
                function WarriorAnnotation2(param, optional_) {});

            var BugWarrior = CLASS(
                [WarriorAnnotation(42)],
                'BugWarrior', []);

            var reflectionCls = new ria.reflection.ReflectionClass(BugWarrior);

            assertTrue(reflectionCls.isAnnotatedWith(WarriorAnnotation));
            assertFalse(reflectionCls.isAnnotatedWith(WarriorAnnotation2));
        },
        testHasMethod: function(){
            var BugWarrior = CLASS(
                'BugWarrior', [
                    VOID, function test(){}
                ]);

            var reflectionCls = new ria.reflection.ReflectionClass(BugWarrior);

            assertTrue(reflectionCls.hasMethod('test'));
        },
        testHasProperty: function(){

            var BugWarrior = CLASS(
                'BugWarrior', [
                    READONLY, Number, 'bugCounter'
                ]);

            var reflectionCls = new ria.reflection.ReflectionClass(BugWarrior);

            assertTrue(reflectionCls.hasProperty('bugCounter'));
        },
        testImplementsIfc: function(){

            var Interface1 = INTERFACE(
                'Interface1', [
                    READONLY, Number, 'answer',
                    VOID, function askQuestion() {}
                ]);

            var Interface2 = INTERFACE(
                'Interface2', [
                    READONLY, String, 'question'
                ]);

            var BugWarrior = CLASS(
                'BugWarrior', IMPLEMENTS(Interface1), [
                    READONLY,  Number, 'answer',
                    VOID, function askQuestion() {}
                ]);

            var reflectionCls = new ria.reflection.ReflectionClass(BugWarrior);

            assertTrue(reflectionCls.implementsIfc(Interface1));
            assertFalse(reflectionCls.implementsIfc(Interface2));
        },
        testExtendsClass: function(){
            var BugWarrior = CLASS(
                'BugWarrior', []);

            var BugWritter = CLASS(
                'BugWritter', []);

            var BugWarriorT = CLASS(
                'BugWarriorT', EXTENDS(BugWarrior), []);

            var reflectionCls = new ria.reflection.ReflectionClass(BugWarriorT);

            assertTrue(reflectionCls.extendsClass(BugWarrior));
            assertFalse(reflectionCls.extendsClass(BugWritter));
        },
        testGetParents: function(){
            var A = CLASS(
                'A', []);

            var B = CLASS(
                'B', EXTENDS(A), []);

            var C = CLASS(
                'C', EXTENDS(B), []);

            var cRefl = new ria.reflection.ReflectionClass(C);

            var cParents = cRefl.getParents();
            assertNotUndefined(cParents);
            assertEquals(3, cParents.length);
            assertEquals(B, cParents[0]);
            assertEquals(A, cParents[1]);
            assertEquals(Class, cParents[2]);
        },
        testFindAnnotation: function(){

            var WarriorAnnotation = ANNOTATION(
                [[Number, Boolean]],
                function WarriorAnnotation(param, optional_) {});

            var WarriorAnnotation2 = ANNOTATION(
                [[Number, Boolean]],
                function WarriorAnnotation2(param, optional_) {});

            var BugWarrior = CLASS(
                [WarriorAnnotation(42)],
                'BugWarrior', [
                    Number, function getAnswer(){},
                    String, function getQuestion() {}
                ]);

            var reflectionCls = new ria.reflection.ReflectionClass(BugWarrior);

            var annotation = reflectionCls.findAnnotation(WarriorAnnotation);

            assertNotUndefined(annotation);
            assertEquals(1, annotation.length);
            assertNotUndefined(annotation[0]);
            assertEquals(42, annotation[0].param);
            assertUndefined(annotation[0].optional_);

            var annotation2 = reflectionCls.findAnnotation(WarriorAnnotation2);
            assertEquals(0, annotation2.length);
        },
        testGetMethodsNames: function(){
            var BugWarrior = CLASS(
                'BugWarrior', [
                    Number, function getAnswer(){},
                    String, function getQuestion() {}
                ]);

            var reflectionCls = new ria.reflection.ReflectionClass(BugWarrior);

            var methodNames = reflectionCls.getMethodsNames();
            assertArray(methodNames);
            assertTrue('Has method getAnswer', methodNames.indexOf('getAnswer') >= 0);
            assertTrue('Has method getQuestion', methodNames.indexOf('getQuestion') >= 0);

        },
        testGetMethodsReflector: function(){
            var BugWarrior = CLASS(
                'BugWarrior', [
                    Number, function getAnswer(){},
                    String, function getQuestion() {}
                ]);

            var reflectionCls = new ria.reflection.ReflectionClass(BugWarrior);

            var methodReflectors = reflectionCls.getMethodsReflector();

            assertArray(methodReflectors);

            methodReflectors.forEach(function (ref) {
                assertInstanceOf(ria.reflection.ReflectionMethod, ref);
            });
        },
        testGetMethodReflector: function(){
            var BugWarrior = CLASS(
                'BugWarrior', [
                    Number, function getAnswer(){},
                    String, function getQuestion() {}
                ]);

            var reflectionCls = new ria.reflection.ReflectionClass(BugWarrior);

            var methodReflector = reflectionCls.getMethodReflector('getAnswer');
            assertNotUndefined(methodReflector);
            assertInstanceOf(ria.reflection.ReflectionMethod, methodReflector);
            assertSame(Number, methodReflector.getReturnType());
            assertSame('getAnswer', methodReflector.getShortName());

        },
        testGetPropertyReflector: function(){
            var GlobalMind = CLASS(
                'GlobalMind', [
                    Number, 'answer',
                    VOID, function askQuestion() {}
                ]);

            var reflectionCls = new ria.reflection.ReflectionClass(GlobalMind);

            var propertyReflector = reflectionCls.getPropertyReflector('answer');
            assertNotUndefined(propertyReflector);
            assertInstanceOf(ria.reflection.ReflectionProperty, propertyReflector);
        },
        testGetPropertiesNames: function(){
            var GlobalMind = CLASS(
                'GlobalMind', [
                    Number, 'answer',
                    String, 'question'
                ]);

            var reflectionCls = new ria.reflection.ReflectionClass(GlobalMind);

            var props = reflectionCls.getPropertiesNames();
            assertArray(props);
            assertTrue('Has property answer', props.indexOf('answer') >= 0);
            assertTrue('Has property question', props.indexOf('question') >= 0);
        },
        testGetPropertiesReflector: function(){
            var GlobalMind = CLASS(
                'GlobalMind', [
                    Number, 'answer',
                    String, 'question'
                ]);

            var reflectionCls = new ria.reflection.ReflectionClass(GlobalMind);

            var props = reflectionCls.getPropertiesReflector();

            assertArray(props);

            props.forEach(function (ref) {
                assertInstanceOf(ria.reflection.ReflectionProperty, ref);
            });
        },
        testGetChildren: function(){
            var A = CLASS(
                'A', []);

            var B = CLASS(
                'B', EXTENDS(A), []);

            var C = CLASS(
                'C', EXTENDS(B), []);

            var cRefl = new ria.reflection.ReflectionClass(C);

            var cChildren = cRefl.getChildren();
            assertNotUndefined(cChildren);
            assertEquals(0, cChildren.length);

            var aRefl = new ria.reflection.ReflectionClass(A);

            var aChildren = aRefl.getChildren();
            assertNotUndefined(aChildren);
            assertEquals(1, aChildren.length);
            assertEquals(B, aChildren[0]);
        },
        testGetChildrenReflector: function(){
            var A = CLASS(
                'A', []);

            var B = CLASS(
                'B', EXTENDS(A), []);

            var aRefl = new ria.reflection.ReflectionClass(A);

            var aChildrenReflectors = aRefl.getChildrenReflector();
            assertNotUndefined(aChildrenReflectors);
            assertEquals(1, aChildrenReflectors.length);
            assertInstanceOf(ria.reflection.ReflectionClass, aChildrenReflectors[0]);
            assertEquals(B, aChildrenReflectors[0].getClazz());
        },
        testGetCtorReflector: function(){
            var BugWarrior = CLASS(
                'BugWarrior', []);

            var reflectionCls = new ria.reflection.ReflectionClass(BugWarrior);

            var ctorReflector = reflectionCls.getCtorReflector();
            assertNotUndefined(ctorReflector);
            assertInstanceOf(ria.reflection.ReflectionCtor, ctorReflector);

        },
        testInstantiate: function(){
            var BugWarrior = CLASS(
                'BugWarrior', []);

            var reflectionCls = new ria.reflection.ReflectionClass(BugWarrior);

            assertNotUndefined(reflectionCls);
            var inst = reflectionCls.instantiate();

            assertInstanceOf(BugWarrior, inst);
        },
        testInstantiateGenericChild: function(){
            var BaseClass = CLASS(
                GENERIC('T'),
                'BaseClass', []);

            var ChildClass = CLASS(
                'ChildClass', EXTENDS(BaseClass.OF(String)), []);

            var reflectionCls = new ria.reflection.ReflectionClass(ChildClass);

            assertNotUndefined(reflectionCls);
            var inst = reflectionCls.instantiate();

            assertInstanceOf(ChildClass, inst);
        },
        testInstantiateGenericChild2: function(){
            var BaseClass = CLASS(
                GENERIC('T'),
                'BaseClass', []);

            var ChildClass = CLASS(
                'ChildClass', EXTENDS(BaseClass), []);

            var reflectionCls = new ria.reflection.ReflectionClass(ChildClass);

            assertNotUndefined(reflectionCls);
            var inst = reflectionCls.instantiate();

            assertInstanceOf(ChildClass, inst);
        },
        testParentsReflector: function(){
            var A = CLASS(
                'A', []);

            var B = CLASS(
                'B', EXTENDS(A), []);

            var C = CLASS(
                'C', EXTENDS(B), []);

            var cRefl = new ria.reflection.ReflectionClass(C);

            var cParentsReflectors = cRefl.getParentsReflector();

            assertArray(cParentsReflectors);

            cParentsReflectors.forEach(function (ref) {
                assertInstanceOf(ria.reflection.ReflectionClass, ref);
            });

            assertEquals(3, cParentsReflectors.length);
            assertEquals(B, cParentsReflectors[0].getClazz());
            assertEquals(A, cParentsReflectors[1].getClazz());
            assertEquals(Class, cParentsReflectors[2].getClazz());
        },
        testIsAbstract: function(){
            var BugWarrior = CLASS(
                ABSTRACT, 'BugWarrior', []);

            var reflectionCls = new ria.reflection.ReflectionClass(BugWarrior);

            assertTrue(reflectionCls.isAbstract(), true);
        },
        testProtectedClassesWithSameFullName: function () {
            var PrivateClassRefA_ = CLASS(
                'PrivateClass_', []);

            var PrivateClassRefB_ = CLASS(
                'PrivateClass_', []);

            var reflectionClsA = ria.reflection.ReflectionClass(PrivateClassRefA_),
                reflectionClsB = ria.reflection.ReflectionClass(PrivateClassRefB_);

            assertTrue(PrivateClassRefA_ != PrivateClassRefB_);
            assertTrue(reflectionClsA != reflectionClsB);

            assertTrue(PrivateClassRefA_ == reflectionClsA.getClazz());
            assertTrue(PrivateClassRefB_ != reflectionClsA.getClazz());

            assertTrue(PrivateClassRefB_ == reflectionClsB.getClazz());
            assertTrue(PrivateClassRefA_ != reflectionClsB.getClazz());
        }
        /*,
        testIsFinal: function(){
            var BugWarrior = CLASS(
                FINAL, 'BugWarrior', []);

            var reflectionCls = new ria.reflection.ReflectionClass(BugWarrior);

            assertTrue(reflectionCls.isFinal(), true);
        }*/
    };

})(ria);