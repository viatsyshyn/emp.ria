REQUIRE('ria.async.Completer');

(function (ria) {
    "use strict";

    AsyncTestCase("FutureTestCase").prototype = {
        testThen: function (queue) {

            var completer = new ria.async.Completer;

            queue.call('Setup thens', function(callbacks) {

                completer.getFuture()
                    .then(callbacks.add(function (data) {
                        assertEquals(1, data);
                        return data + 1
                    }))
                    .then(callbacks.add(function (data) {
                        assertEquals(2, data);
                        return data * 2;
                    }))
                    .then(callbacks.add(function (data) {
                        assertEquals(4, data);
                    }));
            });

            completer.complete(1);
        },

        testCatchError: function (queue) {

            var completer = new ria.async.Completer;

            queue.call('Setup thens', function(callbacks) {

                assertNoException(function () {
                    completer.getFuture()
                        .then(callbacks.add(function (data) {
                            assertEquals(1, data);
                            return data + 1
                        }))
                        .then(function (data) {
                            throw data * 2;
                        })
                        .catchError(callbacks.add(function (error) {
                            assertEquals(4, error);
                            return error + 2
                        }))
                        .then(function (data) {
                            throw new Exception('test');
                        })
                        .catchException(Exception, callbacks.add(function (error) {
                            assertEquals('test', error.getMessage());
                        }))

                });
            });

            completer.complete(1);
        },

        testComplete: function (queue) {
            var completer = new ria.async.Completer;

            var is = false;

            queue.call('Setup thens', function(callbacks) {

                completer.getFuture()
                    .then(callbacks.add(function (data) {
                        assertEquals(1, data);
                        return data + 1
                    }))
                    .then(function (data) {
                        throw data * 2;
                    })
                    .complete(callbacks.noop())
                    .catchError(callbacks.add(function (error) {
                        assertEquals(4, error);
                        return error + 2
                    }))
                    .then(function (data) {
                        throw new Exception('test');
                    })
                    .complete(callbacks.noop())
                    .complete(function () { is = true; })
                ;
            });

            queue.call('Assert about the system', function() {
                assertTrue(is);
            });

            completer.complete(1);
        },

        testBreak: function (queue) {
            var completer = new ria.async.Completer;

            var is = false;
            var is2 = false;

            queue.call('Setup thens', function(callbacks) {

                completer.getFuture()
                    .then(callbacks.add(function (data) {
                        assertEquals(1, data);
                        return data + 1
                    }))
                    .then(function (data) {
                        return ria.async.BREAK;
                    })
                    .complete(callbacks.noop())
                    .catchError(function (error) {
                        is2 = true;
                        return 2
                    })
                    .then(function (data) {
                        is2 = true;
                    })
                    .complete(function () { is = true; })
                    .complete(callbacks.noop())
                ;
            });

            queue.call('Assert about the system', function() {
                assertTrue(is);
                assertFalse(is2);
            });

            completer.complete(1);
        },

        testFutureAsReturn: function (queue) {
            var completer = new ria.async.Completer;
            var innerCompleter = new ria.async.Completer;

            var calls = [];

            queue.call('Setup thens', function(callbacks) {

                var triggered = callbacks.noop();
                var innerThen1 = callbacks.add(function (data) {
                    calls.push('inner-then1');
                    assertEquals(2, data);
                    return data * 2;
                });
                var innerThen2 = callbacks.add(function (data) {
                    calls.push('inner-then2');
                    return data;
                });

                completer.getFuture()
                    .then(callbacks.add(function (data) {
                        calls.push('then1.1');

                        assertEquals(1, data);

                        setTimeout(function () {
                            triggered();
                            innerCompleter.complete(2);
                        }, Math.random() * 100 + 500);

                        return innerCompleter.getFuture()
                            .then(innerThen1)
                            .then(innerThen2)
                    }))
                    .then(callbacks.add(function (data) {
                        calls.push('then1.2');
                        assertEquals(4, data);
                    }));
            });

            queue.call('Check results', function() {
                assertEquals([
                    'then1.1',
                    'inner-then1',
                    'inner-then2',
                    'then1.2'
                ], calls);
            });

            completer.complete(1);
        },

        testAttach: function (queue) {
            var completer = new ria.async.Completer;

            var calls = [];

            queue.call('Setup thens', function(callbacks) {

                var futureHead = new ria.async.Future;

                futureHead
                    .then(function (data) {
                        calls.push('then2.1');
                        return data * 2;
                    })
                    .then(function (data) {
                        calls.push('then2.2');
                        return data + 1;
                    });

                completer.getFuture()
                    .then(callbacks.add(function (data) {
                        calls.push('then1.1');
                        assertEquals(1, data);
                        return data;
                    }))
                    .attach(futureHead)
                    .then(callbacks.add(function (data) {
                        calls.push('then1.2');
                        assertEquals(3, data);
                        return;
                    }))
                    .complete(callbacks.noop());
            });

            queue.call('Check results', function() {
                assertEquals([
                    'then1.1',
                    'then2.1',
                    'then2.2',
                    'then1.2'
                ], calls);
            });

            completer.complete(1);
        }
    };

})(ria);