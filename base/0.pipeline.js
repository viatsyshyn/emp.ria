(function () {
    "use strict";

    var pmcStages = {
        /**
         * @var {Function[]}
         */
        callInit_: [],
        /**
         * @param {Function} body
         * @param {ria.__API.MethodDescriptor} meta
         * @param {Object} scope
         * @param {Object} callSession
         */
        'OnCallInit': function (body, meta, scope, callSession, genericTypes, specs) {
            this.callInit_.forEach(function (_) {
                _(body, meta, scope, callSession, genericTypes, specs);
            });
        },

        /**
         * @var {Function[]}
         */
        beforeCall_: [],
        /**
         * @param {Function} body
         * @param {ria.__API.MethodDescriptor} meta
         * @param {Object} scope
         * @param {Array} args
         * @param {Object} callSession
         */
        'OnBeforeCall': function (body, meta, scope, args, callSession, genericTypes, specs) {
            this.beforeCall_.forEach(function (_) {
                _(body, meta, scope, args, callSession, genericTypes, specs);
            });
        },

        /**
         * @var {Function[]}
         */
        afterCall_: [],
        /**
         * @param {Function} body
         * @param {ria.__API.MethodDescriptor} meta
         * @param {Object} scope
         * @param {Array} args
         * @param {Object} result
         * @param {Object} callSession
         */
        'OnAfterCall': function (body, meta, scope, args, result, callSession, genericTypes, specs) {
            this.afterCall_.forEach(function (_) {
                result = _(body, meta, scope, args, result, callSession, genericTypes, specs);
            });
            return result;
        },

        /**
         * @var {Function[]}
         */
        callFinally_: [],
        /**
         *
         * @param {Function} body
         * @param {ria.__API.MethodDescriptor} meta
         * @param {Object} scope
         * @param {Object} callSession
         */
        'OnCallFinally': function (body, meta, scope, callSession, genericTypes, specs) {
            this.callFinally_.forEach(function (_) {
                _(body, meta, scope, callSession, genericTypes, specs);
            });
        }
    };

    /**
     * @param {Function} body
     * @param {ria.__API.MethodDescriptor} meta
     * @param {Object} scope
     * @param {Array} args
     */
    function PipelineMethodCall(body, meta, scope, args, genericTypes, specs) {
        var callSession = {};
        pmcStages.OnCallInit(body, meta, scope, callSession, genericTypes, specs);
        try {
            pmcStages.OnBeforeCall(body, meta, scope, args, callSession, genericTypes, specs);
            // THIS IS WHERE METHOD BODY IS CALLED
            var result = body.apply(scope, args);
            // END OF METHOD BODY CALL
            return pmcStages.OnAfterCall(body, meta, scope, args, result, callSession, genericTypes, specs);
        } finally {
            pmcStages.OnCallFinally(body, meta, scope, callSession, genericTypes, specs);
        }
    }

    /**
     *
     * @param {String} stage
     * @param {Function} worker
     */
    ria.__API.addPipelineMethodCallStage = function (stage, worker) {
        switch (stage) {
            case 'CallInit': pmcStages.callInit_.push(worker); break;
            case 'BeforeCall': pmcStages.beforeCall_.push(worker); break;
            case 'AfterCall': pmcStages.afterCall_.push(worker); break;
            case 'CallFinally': pmcStages.callFinally_.push(worker); break;
        }
    };

    /**
     * @param {Function} body
     * @param {ria.__API.MethodDescriptor} meta
     * @param {Object} scope
     * @param {Object[]} genericTypes
     * @param {Object[]} specs
     * @return {Function}
     */
    ria.__API.getPipelineMethodCallProxyFor = function (body, meta, scope, genericTypes, specs) {
        var f_ = function () {
            return PipelineMethodCall(body, meta, scope || this, [].slice.call(arguments), genericTypes, specs);
        };

        f_.__META = meta;

        Object.defineProperty(f_, '__META', {
            writable: false,
            configurable: false,
            enumerable: false
        });

        return f_;
    };
})();