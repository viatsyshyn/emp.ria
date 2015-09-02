(function (ria) {
    "use strict";

    TestCase("APITestCase").prototype = {

        setUp: function() {
            _DEBUG = true;
        },

        testExtend: function () {
            function Base() {}
            function Child() {}

            ria.__API.extend(Child, Base);

            assertInstanceOf(Base, new Child());
        },

        testScoping_DEBUG: function () {
            _DEBUG = true;

            function Clazz() { return ria.__API.init(this, Clazz, Clazz.prototype.$, arguments) }
            ria.__API.clazz(Clazz, 'Clazz', null, [], []);

            ria.__API.ctor('$', Clazz, Clazz.prototype.$ = function (v) {
                this.testProp = v;
            }, [Object], ['v'], []);

            ria.__API.method(Clazz, Clazz.prototype.getP = function () {
                return this.testProp;
            }, 'getP', Object, [], [], []);

            ria.__API.compile(Clazz);

            var instance = new Clazz(123);

            var method = instance.getP;

            assertTrue(_DEBUG);
            assertEquals(123, method());
        },

        testScoping_RELEASE: function () {
            _DEBUG = false;

            function Clazz() { return ria.__API.init(this, Clazz, Clazz.prototype.$, arguments) }
            ria.__API.clazz(Clazz, 'Clazz', null, [], []);

            ria.__API.ctor('$', Clazz, Clazz.prototype.$ = function (v) {
                this.testProp = v;
            }, [Object], ['v'], []);

            ria.__API.method(Clazz, Clazz.prototype.getP = function () {
                return this.testProp;
            }, 'getP', Object, [], [], []);

            ria.__API.compile(Clazz);

            var instance = new Clazz(123);

            var method = instance.getP;

            assertFalse(_DEBUG);
            assertEquals(123, method());

            _DEBUG = true;
        },

        testMerge: function () {
            var source = {a : 1, b : "2"},
                second = {c : 3, b : 3},
                third  = {d : 4},
                forth  = {e : 5};

            var result = ria.__API.merge(source, second);
            assertEquals(source.a, result.a);
            assertEquals(source.b, result.b);
            assertEquals(second.c, result.c);

            assertUndefined(second.a);
            assertUndefined(source.c);

            var reverse = ria.__API.merge(second, source);
            assertEquals(source.a, reverse.a);
            assertEquals(second.b, reverse.b);
            assertEquals(second.c, reverse.c);

            assertUndefined(source.c);
            assertUndefined(second.a);

            var triple = ria.__API.merge(source, second, third);
            assertEquals(source.a, triple.a);
            assertEquals(source.b, triple.b);
            assertEquals(second.c, triple.c);
            assertEquals(third.d, triple.d);


            var quatro = ria.__API.merge(source, second, third, forth);
            assertEquals(source.a, quatro.a);
            assertEquals(source.b, quatro.b);
            assertEquals(second.c, quatro.c);
            assertEquals(third.d, quatro.d);
            assertEquals(forth.e, quatro.e);
        }
    };

})(ria);