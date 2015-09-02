(function (ria) {
    "use strict";

    TestCase("ClassTestCase").prototype = {
        setUp: function(){
            function Clazz() { return ria.__API.init(this, Clazz, Clazz.prototype.$, arguments) }
            ria.__API.clazz(Clazz, 'Clazz', null, [], []);
            Clazz.prototype.$ = function () { this.testProp = null; };
            ria.__API.ctor('$', Clazz, Clazz.prototype.$, [], [], []);
            Clazz.prototype.compare = function (_1, _2) { return _1 === _2; };
            ria.__API.method(Clazz, Clazz.prototype.compare, 'compare', Boolean, [String, String], ['_1', '_2'], []);
            ria.__API.compile(Clazz);

            this.Clazz = Clazz;
        },

        testCreate: function () {
            var Clazz = this.Clazz;

            assertFunction(Clazz);
            assertNotUndefined(Clazz.__META);
            assertInstanceOf(ria.__API.ClassDescriptor, Clazz.__META);
        },

        testUsage: function() {
            var Clazz = this.Clazz;

            assertNoException(function () { new Clazz(); });

            //assertException(function () { new Clazz(5); }, 'Error');
        },

        testCtorInvisible: function() {
            var Clazz = this.Clazz;

            var instance;
            assertNoException(function () { instance = new Clazz(); });

            assertTrue(_DEBUG);
            assertUndefined(instance.$);
            assertUndefined(instance.__PROTECTED.$);
        },

        testMethodSelfBind: function () {
            var Clazz = this.Clazz;

            var instance = new Clazz();

            var method = instance.compare;

            assertEquals(method('1', '2'), false);
        },

        testProtectedVisibility: function () {
            var Clazz = this.Clazz;

            var instance = new Clazz();

            assertTrue(_DEBUG);
            assertNotUndefined(instance.__PROTECTED.testProp);
            assertUndefined(instance.testProp);
        },

        testClassExtending: function () {

            var BaseClazz = this.Clazz;

            function ChildClazz() { return ria.__API.init(this, ChildClazz, ChildClazz.prototype.$, arguments) }
            ria.__API.clazz(ChildClazz, 'ChildClazz', BaseClazz, [], []);
            ChildClazz.prototype.$ = function () { BaseClazz.prototype.$.call(this); };
            ria.__API.ctor('$', ChildClazz, ChildClazz.prototype.$, [], [], []);
            ria.__API.compile(ChildClazz);

            assertInstanceOf(ria.__API.ClassDescriptor, ChildClazz.__META);

            var instance = new ChildClazz();

            assertObject(instance);
            assertInstanceOf(ChildClazz, instance);
            assertInstanceOf(BaseClazz, instance);
            assertFunction(instance.compare);

            // TODO: check for parent members, check visibility
        },

        testClassProtectedArea: function () {

            var Clazz = this.Clazz;

            var instance = new Clazz();

            assertTrue(_DEBUG);
            assertInstanceOf(Clazz, instance.__PROTECTED);
            assertUndefined(instance.testProp);

            for(var k in instance) if (instance.hasOwnProperty(k) && typeof instance[k] == 'function') {
                assertFunction(instance[k]);
                assertFunction(instance.__PROTECTED[k]);
            }

            assertUndefined(instance.testProp);
            assertNotUndefined(instance.__PROTECTED.testProp);
        },

        testGenericInstantiation: function () {

            var Clazz = this.Clazz;

            var BaseClazz = function () {
                var T = ria.__API.getGeneralizedType('T', []);
                function BaseClazz() {
                    return ria.__API.init(this, BaseClazz, BaseClazz.prototype.$, arguments)
                }
                ria.__API.clazz(BaseClazz, 'BaseClazz', Clazz, [], [], false, [T], []);
                BaseClazz.prototype.$ = function (t_) { Clazz.prototype.$.call(this); };
                ria.__API.ctor('$', BaseClazz, BaseClazz.prototype.$, [T], ['t_'], []);
                ria.__API.compile(BaseClazz);
                return BaseClazz;
            }();

            var ChildClazz = function () {
                function ChildClazz() {
                    return ria.__API.init(this, ChildClazz, ChildClazz.prototype.$, arguments)
                }
                ria.__API.clazz(ChildClazz, 'ChildClazz', BaseClazz, [], [], false, [], [String]);
                ChildClazz.prototype.$ = function (t_, g_) { BaseClazz.prototype.$.call(this, t_); };
                ria.__API.ctor('$', ChildClazz, ChildClazz.prototype.$, [String, Number], ['t_', 'g_'], []);
                ria.__API.compile(ChildClazz);
                return ChildClazz;
            }();

            var instance = new ChildClazz('test', 5);
        }
    }
})(ria);
