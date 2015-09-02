(function () {
    "use strict";

    /**
     * @param {String} name
     * @param {Array} argsTypes
     * @param {String[]} argsNames
     * @constructor
     */
    function AnnotationDescriptor(name, argsTypes, argsNames) {
        this.name = name;
        //noinspection JSUnusedGlobalSymbols
        this.argsNames = argsNames;
        //noinspection JSUnusedGlobalSymbols
        this.argsTypes = argsTypes;
        this.ret = null;

        _DEBUG && Object.freeze(this);
    }

    ria.__API.AnnotationDescriptor = AnnotationDescriptor;

    /**
     * @class AnnotationInstance
     * @param {Object} args
     * @param {AnnotationDescriptor} meta
     * @constructor
     */
    function AnnotationInstance(args, meta) {

        for(var k in args) if (args.hasOwnProperty(k)) {
            this[k] = args[k];
        }

        this.__META = meta;

        _DEBUG && Object.freeze(this);
    }

    /**
     * @param {String} name
     * @param {Array} [argsTypes_]
     * @param {String[]} [argsNames_]
     * @return {Function}
     */
    ria.__API.annotation = function(name, argsTypes_, argsNames_) {

        /**
         * @return {AnnotationInstance}
         * @constructor
         */
        function AnnotationProxy() {
            var args = [].slice.call(arguments);
            var o = {};
            for(var index = 0; index < argsNames_.length; index++) {
                o[argsNames_[index]] = args[index];
            }

            return new AnnotationInstance(o, AnnotationProxy.__META);
        }

        AnnotationProxy.__META = new AnnotationDescriptor(name, argsTypes_, argsNames_);
        var fn_ = AnnotationProxy;
        fn_ = !_RELEASE
            ? ria.__API.getPipelineMethodCallProxyFor(fn_, fn_.__META, null)
            : fn_;

        _DEBUG && Object.freeze(fn_);
        return fn_;
    };

    ria.__API.isAnnotation = function (value) {
        if (typeof value === 'function') {
            return value.__META instanceof AnnotationDescriptor;
        }

        return value instanceof AnnotationInstance;
    };
})();