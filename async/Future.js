REQUIRE('ria.async.ICancelable');

NAMESPACE('ria.async', function () {
    "use strict";

    function DefaultDataHanlder(data) { return data; }
    function DefaultErrorHandler(e) { throw e; }

    function FutureBreaker() {}

    ria.async.BREAK = new FutureBreaker();
    _DEBUG && Object.defineProperty(ria.async, 'BREAK', { writable: false, configurable: false, enumerable: true });

    ria.async.BreakDelegate = function () { return ria.async.BREAK; };
    _DEBUG && Object.defineProperty(ria.async, 'BreakDelegate', { writable: false, configurable: false, enumerable: true });

    /** @class ria.async.FutureDataDelegate */
    DELEGATE(
        [[Object]],
        function FutureDataDelegate(data){});

    /** @class ria.async.FutureProgressDelegate */
    DELEGATE(
        [[Object]],
        VOID, function FutureProgressDelegate(data){});

    /** @class ria.async.FutureErrorDelegate */
    DELEGATE(
        [[Object]],
        function FutureErrorDelegate(error){});

    /** @class ria.async.FutureCompleteDelegate */
    DELEGATE(
        VOID, function FutureCompleteDelegate(){});

    var __futuresPool = [],
        __uncaughtErrorHandler = DefaultErrorHandler;

    /** @class ria.async.Future */
    CLASS(
        ABSTRACT, 'Future', IMPLEMENTS(ria.async.ICancelable), [
            function $$(instance, clazz, ctorCalled, args) {
                if (ctorCalled == SELF.prototype.$fromData) {
                    var delayArgs = args;
                    args = [];
                }

                var fromPool = __futuresPool.pop();
                if (fromPool) {
                    var ctor = FutureImpl_.prototype.$;
                    if (!_RELEASE && ctor.__META) {
                        ctor = ria.__API.getPipelineMethodCallProxyFor(ctor, ctor.__META, fromPool, [], []);
                    }

                    ctor.apply(fromPool, args);
                    instance = fromPool;
                } else {
                    instance = FutureImpl_.apply(undefined, args)
                }

                if (ctorCalled == SELF.prototype.$fromData) {
                    ria.__API.defer(instance, instance.finish, [delayArgs[0]], delayArgs[1]|0);
                }

                return instance.getWrapper();
            },

            [[ria.async.ICancelable]],
            function $(canceler_) {
                BASE();

                this._canceler = canceler_;
                this._disposed = false;
            },

            function onDispose() {
                Assert(!this._disposed, 'Disposing already disposed future');
                this._next && this._next.getImpl().setCanceler(null);
                this._disposed || ria.__API.defer(this, function () { __futuresPool.push(this); });
                this._disposed = true;
            },

            VOID, function cancel() {},

            [[ria.async.FutureDataDelegate, Object]],
            SELF, function then(handler, scope_) {},

            [[ria.async.FutureDataDelegate, Object]],
            SELF, function transform(handler, scope_) {
                return this.then(handler, scope_);
            },

            [[Function, Array]],
            SELF, function thenCall(delegate, args_) {
                return this.then(function () {
                    return delegate.apply(undefined, args_ || [])
                });
            },

            SELF, function thenBreak() {
                return this.then(ria.async.BreakDelegate);
            },

            [[ria.async.FutureProgressDelegate, Object]],
            SELF, function handleProgress(handler, scope_) {},

            [[ria.async.FutureErrorDelegate, Object]],
            SELF, function catchError(handler, scope_) {},

            [[ClassOf(Exception), ria.async.FutureErrorDelegate, Object]],
            SELF, function catchException(exception, handler, scope_) {
                return this.catchError(function (error) {
                    if (error instanceof exception)
                        return handler.call(scope_, error);

                    throw error;
                });
            },

            [[ria.async.FutureCompleteDelegate, Object]],
            SELF, function complete(handler, scope_) {},

            [[SELF]],
            SELF, function attach(future) {},

            [[SELF]],
            SELF, function attachEnd(future) {},

            function getImpl() { return this; },

            [[Object, Number]],
            function $fromData(data, delay_) {
                BASE();
            },

            [[ria.async.FutureErrorDelegate]],
            function UNCAUGHT_ERROR(handler) {
                __uncaughtErrorHandler = handler;
            }
        ]);

    /** @class ria.async.FutureImpl */
    var FutureImpl_ = CLASS(
        'FutureImpl_', EXTENDS(ria.async.Future), [

            /* UNSAFE CLASS INITIALIZER */
            OVERRIDE, function $$(instance, clazz, ctor, args) {
                var genericTypes = [],
                    genericSpecs = [];

                var __META = clazz.__META;

                if (!(instance instanceof clazz))
                    instance = ria.__API.getInstanceOf(clazz);

                if (!_RELEASE) {
                    var __pre = __META.__precalc;
                    for(var i = 0 ; i < __pre.length;) {
                        var name_ = __pre[i],
                            f_ = __pre[i+1],
                            meta_ = f_.__META;

                        var fn = ria.__API.getPipelineMethodCallProxyFor(f_, meta_, instance, genericTypes, genericSpecs);
                        if (_DEBUG) {
                            Object.defineProperty(instance, name_, { writable : false, configurable: false, enumerable: false, value: fn });
                        } else {
                            instance[name_] = fn;
                        }

                        i+=2;
                    }

                    if (ctor.__META) {
                        ctor = ria.__API.getPipelineMethodCallProxyFor(ctor, ctor.__META, instance, genericTypes, genericSpecs);
                    }
                }

                if (_DEBUG) for(var name in clazz.__META.properties) {
                    if (clazz.__META.properties.hasOwnProperty(name)) {
                        instance[name] = null;
                    }
                }

                ctor.apply(instance, args);

                _DEBUG && Object.seal(instance);

                return instance;
            },

            [[ria.async.ICancelable]],
            function $(canceler_) {
                BASE(canceler_);

                this._next = null;

                this._onData = null;
                this._onProgress = null;
                this._onError = null;
                this._onComplete = null;
            },

            OVERRIDE, VOID, function cancel() {
                this._canceler && this._canceler.cancel();
            },

            [[ria.async.FutureDataDelegate, Object]],
            OVERRIDE, ria.async.Future, function then(handler, scope_) {
                this._onData = scope_ ? handler.bind(scope_) : handler;
                return this.attach(new ria.async.Future);
            },

            [[ria.async.FutureProgressDelegate, Object]],
            OVERRIDE, ria.async.Future, function handleProgress(handler, scope_) {
                this._onProgress = scope_ ? handler.bind(scope_) : handler;
                return this.attach(new ria.async.Future);
            },

            [[ria.async.FutureErrorDelegate, Object]],
            OVERRIDE, ria.async.Future, function catchError(handler, scope_) {
                this._onError = scope_ ? handler.bind(scope_) : handler;
                return this.attach(new ria.async.Future);
            },

            [[ria.async.FutureCompleteDelegate, Object]],
            OVERRIDE, ria.async.Future, function complete(handler, scope_) {
                this._onComplete = handler.bind(scope_);
                return this.attach(new ria.async.Future);
            },

            [[ria.async.Future]],
            OVERRIDE, ria.async.Future, function attach(future) {
                Assert(!future || this.getHashCode() != future.getHashCode(), 'Can not attach self');

                var old_next = this._next;
                this._next = future;
                this._next.getImpl().setCanceler(this);
                return this.attachEnd(old_next || null);
            },

            [[ria.async.Future]],
            OVERRIDE, ria.async.Future, function attachEnd(future) {
                Assert(!future || this.getHashCode() != future.getHashCode(), 'Can not attach self');

                return this._next
                    ? this._next.attachEnd(future)
                    : (future ? (this._next = future) : this);
            },

            VOID, function updateProgress(data) {
                Assert(!this._disposed, 'Can not updateProgress disposed future');
                ria.__API.defer(this, function () {
                    Assert(!this._disposed, 'Can not updateProgress disposed future');
                    try {
                        this._onProgress && this._onProgress(data);
                    } finally {
                        this._next && this._next.getImpl().updateProgress(data);
                    }
                });
            },

            VOID, function finish(data) {
                Assert(!this._disposed, 'Can not finish disposed future');

                ria.__API.defer(this, function () {
                    Assert(!this._disposed, 'Can not finish disposed future');
                    try {
                        var result = (this._onData || DefaultDataHanlder).call(this, data);
                        if (result === ria.async.BREAK) {
                            this._next && this._next.getImpl().completeBreak();
                        } else if (result instanceof ria.async.Future) {
                            this.attach(result);
                        } else {
                            this._next && this._next.getImpl().finish(result === undefined ? null : result);
                        }
                    } catch (e) {
                        this._next && this._next.getImpl().completeError(e);
                    } finally {
                        this._onComplete && this._onComplete();
                        this.onDispose();
                    }
                });
            },

            VOID, function completeError(error) {
                Assert(!this._disposed, 'Can not completeError disposed future');
                if (!this._next)
                    __uncaughtErrorHandler(new Exception('Uncaught error', error));

                ria.__API.defer(this, function () {
                    Assert(!this._disposed, 'Can not completeError disposed future');
                    try {
                        var result = (this._onError || DefaultErrorHandler).call(this, error);
                        if (result === ria.async.BREAK) {
                            this._next && this._next.getImpl().completeBreak();
                        } else if (result instanceof ria.async.Future) {
                            this.attach(result);
                        } else {
                            this._next && this._next.getImpl().finish(result === undefined ? null : result);
                        }
                    } catch (e) {
                        this._next && this._next.getImpl().completeError(e);
                    } finally {
                        this._onComplete && this._onComplete();
                        this.onDispose();
                    }
                });
            },

            VOID, function completeBreak() {
                Assert(!this._disposed, 'Can not completeBreak disposed future');
                ria.__API.defer(this, function () {
                    Assert(!this._disposed, 'Can not completeBreak disposed future');
                    try {
                        this._onComplete && this._onComplete();
                    } finally {
                        this._next && this._next.getImpl().completeBreak();
                        this.onDispose();
                    }
                });
            },

            [[ria.async.ICancelable]],
            VOID, function setCanceler(canceler) {
                this._canceler = canceler;
            },

            ria.async.Future, function getWrapper() {
                return this;
            }
        ]);


    /** @class ria.async.DeferredData*/
    /** @class ria.async.DeferredAction*/
    ria.async.DeferredAction = ria.async.DeferredData = function (data_, delay_) {
        return new ria.async.Future.$fromData(data_ || null, delay_);
    };
});
