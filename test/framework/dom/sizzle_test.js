/**
 * Created by C01t on 4/14/14.
 */

REQUIRE('ria.dom.Dom');
REQUIRE('ria.dom.SizzleDom');
REQUIRE('ria.dom.jQueryDom');

(function (ria, stubs) {
    "use strict";

    var PROTO = {
        setUp: function () {
            ria.dom.Dom.SET_IMPL(this.IMPL);
        },

        testInstantiate: function() {
            jstestdriver.appendHtml('<div id="testInstantiate"></div>', window.document);

            var dom = ria.dom.Dom('#testInstantiate');

            assertInstanceOf(ria.dom.Dom, dom);
            assertInstanceOf(this.IMPL, dom);

            assertEquals(1, dom.valueOf().length);
        },

        testFind: function() {
            jstestdriver.appendHtml('<div id="testFind">' +
                '<div class="to-find"></div>' +
                '<div class="to-find other class"></div>' +
                '<div class="not-to-find"></div>' +
                '<div class="hidden"></div>' +
                '</div>', window.document);

            var dom = ria.dom.Dom('#testFind');

            var result = dom.find('.to-find');

            assertEquals(2, result.valueOf().length);

            result.forEach(function ($dom) {
                assertTrue($dom.hasClass('to-find'));
            });

            var result2 = dom.find('.non-existent');

            assertEquals(0, result2.valueOf().length);
        },

        testOn: function (queue) {
            jstestdriver.appendHtml('<div id="testOn"></div>', window.document);

            var dom = ria.dom.Dom('#testOn');

            queue.call('Setup callbacks', function(callbacks) {
                dom.on('click', callbacks.add(function ($node, event) {
                    assertEquals('testOn', $node.getAttr('id'));
                }));
            });

            setTimeout(function () {
                jstestdriver.console.log('trigger click');

                dom.triggerEvent(ria.dom.Events.CLICK());
            }, 1000);
        },

        testOnSelector: function (queue) {
            jstestdriver.appendHtml('<div id="testOnSelector">' +
                '<div class="to-click expected-click" id="trigger-1"></div>' +
                '<div class="to-click expected-click" id="trigger-2"></div>' +
                '<div class="not-to-click" id="trigger-3"></div>' +
                '<div class="other expected-click" id="trigger-4"></div>' +
                '</div>', window.document);

            var dom = ria.dom.Dom('#testOnSelector');

            queue.call('Setup callbacks', function(callbacks) {
                dom.on('click', '.to-click, .other', callbacks.add(function ($node, event) {
                    assertTrue($node.hasClass('expected-click'));
                }));

                dom.on('click', '.not-to-click', callbacks.addErrback('this should not happen'));


                var cb = callbacks.add(function ($node, event) {
                    jstestdriver.console.log('clicked 1');
                    assertTrue($node.hasClass('expected-click'));
                }, 2);

                dom.on('click', '.other', cb);
                dom.on('click', '.to-click', cb);
            });

            setTimeout(function () {
                jstestdriver.console.log('trigger click 1');
                ria.dom.Dom('#trigger-1').triggerEvent(ria.dom.Events.CLICK());
            }, 500);

            setTimeout(function () {
                jstestdriver.console.log('trigger click 2');
                ria.dom.Dom('#trigger-4').triggerEvent(ria.dom.Events.CLICK());
            }, 1000);

            setTimeout(function () {
                jstestdriver.console.log('trigger click 4');
                ria.dom.Dom('#trigger-2').triggerEvent(ria.dom.Events.CLICK());
            }, 1500);
        },

        testOff: function (queue) {
            jstestdriver.appendHtml('<div id="testOff">' +
                '<div class="to-click expected-click" id="trigger-1"></div>' +
                '<div class="to-click expected-click" id="trigger-2"></div>' +
                '<div class="not-to-click" id="trigger-3"></div>' +
                '<div class="other expected-click" id="trigger-4"></div>' +
                '</div>', window.document);


            var dom = ria.dom.Dom('#testOff');

            queue.call('Setup callbacks', function(callbacks) {
                var cb = callbacks.add(function ($node, event) {
                    jstestdriver.console.log('clicked 1');
                    assertFalse($node.hasClass('other'));
                    assertTrue($node.hasClass('expected-click'));
                }, 2);

                dom.on('click', '.other', cb);
                dom.on('click', '.to-click', cb);

                dom.off('click', '.other', cb);

                var cb2 = callbacks.add(function ($node, event) {
                    jstestdriver.console.log('clicked 2');
                    assertFalse($node.hasClass('other'));
                    assertTrue($node.hasClass('expected-click'));
                }, 2);

                dom.on('focus', '.to-click', cb2);
                dom.on('click', '.to-click', cb2);

                dom.off('focus', '.to-click', cb2);

            });

            setTimeout(function () {
                jstestdriver.console.log('trigger click 1');
                ria.dom.Dom('#trigger-1').triggerEvent(ria.dom.Events.CLICK());
            }, 500);

            setTimeout(function () {
                jstestdriver.console.log('trigger click 2');
                ria.dom.Dom('#trigger-4').triggerEvent(ria.dom.Events.CLICK());
            }, 1000);

            setTimeout(function () {
                jstestdriver.console.log('trigger click 3');
                ria.dom.Dom('#trigger-3').triggerEvent(ria.dom.Events.CLICK());
            }, 1250);

            setTimeout(function () {
                jstestdriver.console.log('trigger click 4');
                ria.dom.Dom('#trigger-2').triggerEvent(ria.dom.Events.CLICK());
            }, 1500);
        },

        testAppendTo: function (queue) {

            jstestdriver.appendHtml('<div id="source" class="pos0"></div>' +
                '<div id="source2" class="pos1"></div>' +
                '<div id="target"></div>', window.document);

            var dom = ria.dom.Dom('#source');

            queue.call('Move dom', function (callbacks) {
                assertEquals(0, ria.dom.Dom('#target').descendants().count());

                dom.appendTo('#target');

                setTimeout(callbacks.noop(), 50);
            });

            queue.call('Test move', function (callbacks) {
                assertEquals(1, ria.dom.Dom('#target').descendants().count());

                setTimeout(callbacks.noop(), 50);
            });

            queue.call('Attach to non-existent target', function (callbacks) {
                _RELEASE && dom.appendTo('#non-existent');

                setTimeout(callbacks.noop(), 50);
            });

            queue.call('Attach non existent to target', function (callbacks) {
                ria.dom.Dom('#non-existent').appendTo('#target');

                setTimeout(callbacks.noop(), 50);
            });

            queue.call('Move 2', function (callbacks) {
                assertEquals(1, ria.dom.Dom('#target').descendants().count());

                ria.dom.Dom('#source2').appendTo('#target');

                setTimeout(callbacks.noop(), 50);
            });

            queue.call('Test move 2', function (callbacks) {
                var children = ria.dom.Dom('#target').descendants();

                assertEquals(2, children.count());

                var index = 0;
                children.forEach(function ($node) {
                    assertTrue('Has class "pos' + index + '"', $node.hasClass('pos' + index));
                    index++;
                });

                setTimeout(callbacks.noop(), 50);
            });
        },

        testPrependTo: function (queue) {
            jstestdriver.appendHtml('<div id="source" class="pos1"></div>' +
                '<div id="source2" class="pos0"></div>' +
                '<div id="target"></div>', window.document);

            var dom = ria.dom.Dom('#source');

            queue.call('Move dom', function (callbacks) {
                assertEquals(0, ria.dom.Dom('#target').descendants().count());

                dom.prependTo('#target');

                setTimeout(callbacks.noop(), 50);
            });

            queue.call('Test move', function (callbacks) {
                assertEquals(1, ria.dom.Dom('#target').descendants().count());

                setTimeout(callbacks.noop(), 50);
            });

            queue.call('Attach to non-existent target', function (callbacks) {
                _RELEASE && dom.prependTo('#non-existent');

                setTimeout(callbacks.noop(), 50);
            });

            queue.call('Attach non existent to target', function (callbacks) {
                ria.dom.Dom('#non-existent').prependTo('#target');

                setTimeout(callbacks.noop(), 50);
            });

            queue.call('Move 2', function (callbacks) {
                assertEquals(1, ria.dom.Dom('#target').descendants().count());

                ria.dom.Dom('#source2').prependTo('#target');

                setTimeout(callbacks.noop(), 50);
            });

            queue.call('Test move 2', function (callbacks) {
                var children = ria.dom.Dom('#target').descendants();

                assertEquals(2, children.valueOf().length);

                var index = 0;
                children.forEach(function ($node) {
                    assertTrue('Has class "pos' + index + '"', $node.hasClass('pos' + index));
                    index++;
                });

                setTimeout(callbacks.noop(), 50);
            });
        },

        testInsertBefore: function (queue) {
            jstestdriver.appendHtml('<div id="source" class="pos1"></div>' +
                '<div id="source2" class="pos2"></div>' +
                '<div id="target">' +
                '<div class="pos0"></div>' +
                '<div id="before-this" class="pos3"></div>' +
                '</div>', window.document);

            var dom = ria.dom.Dom('#source');

            queue.call('Move dom', function (callbacks) {
                assertEquals(2, ria.dom.Dom('#target').descendants().count());

                dom.insertBefore('#before-this');

                setTimeout(callbacks.noop(), 50);
            });

            queue.call('Test move', function (callbacks) {
                assertEquals(3, ria.dom.Dom('#target').descendants().count());

                setTimeout(callbacks.noop(), 50);
            });

            queue.call('Attach to non-existent target', function (callbacks) {
                _RELEASE && dom.prependTo('#non-existent');

                setTimeout(callbacks.noop(), 50);
            });

            queue.call('Attach non existent to target', function (callbacks) {
                ria.dom.Dom('#non-existent').prependTo('#target');

                setTimeout(callbacks.noop(), 50);
            });

            queue.call('Move 2', function (callbacks) {
                assertEquals(3, ria.dom.Dom('#target').descendants().count());

                ria.dom.Dom('#source2').insertBefore('#before-this');

                setTimeout(callbacks.noop(), 50);
            });

            queue.call('Test move 2', function (callbacks) {
                var children = ria.dom.Dom('#target').descendants();

                assertEquals(4, children.valueOf().length);

                var index = 0;
                children.forEach(function ($node) {
                    assertTrue('Has class "pos' + index + '"', $node.hasClass('pos' + index));
                    index++;
                });

                setTimeout(callbacks.noop(), 50);
            });
        },

        testDescendants: function () {
            jstestdriver.appendHtml('<div id="target">' +
                '<div class="pos0"></div>' +
                '<div id="before-this" class="pos1">' +
                '<div class="pos3"></div>' +
                '</div>' +
                '</div>', window.document);

            var dom = ria.dom.Dom('#target');

            var result = dom.descendants();
            var index = 0;
            result.forEach(function ($node) {
                assertTrue('Has class "pos' + index + '"', $node.hasClass('pos' + index));
                index++;
            });

            var result2 = dom.descendants('.pos1');
            assertEquals(1, result2.count());

            var result3 = dom.descendants('.pos3');
            assertEquals(0, result3.count());
        },

        testParent: function () {
            jstestdriver.appendHtml(
                '<div id="target" class="p0">' +
                    '<div class="pos0"></div>' +
                    '<div id="before-this" class="pos1 p1">' +
                        '<div class="pos3 p2">' +
                            '<div id="child"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>', window.document);

            var dom = ria.dom.Dom('#child');

            var result = dom.parent();
            assertTrue('Has class "p2"', result.hasClass('p2'));

            var result2 = dom.parent('.p2');
            assertEquals(1, result2.count());

            var result3 = dom.parent('.p1');
            assertEquals(1, result3.count());

            var result4 = dom.parent('.p0');
            assertEquals(1, result4.count());

            var result5 = dom.parent('.p123');
            assertEquals(0, result5.count());
        }
    };

    function MAKE(obj) {
        for(var k in PROTO) if (PROTO.hasOwnProperty(k)) {
            obj[k] = PROTO[k];
        }

        return obj;
    }

    AsyncTestCase("SimpleTestCase").prototype = MAKE({
        IMPL: ria.dom.SimpleDom
    });

    AsyncTestCase("SizzleTestCase").prototype = MAKE({
        IMPL: ria.dom.SizzleDom
    });

    AsyncTestCase("JQueryTestCase").prototype = MAKE({
        IMPL: ria.dom.jQueryDom
    });
})(ria);