(function (global) {

    function ClassOfDescriptor(clazz) {
        this.clazz = clazz;
    }

    /**
     * @param ds
     * @returns {boolean}
     */
    ClassOfDescriptor.isClassOfDescriptor = function (ds) {
        return ds instanceof ClassOfDescriptor;
    };

    ClassOfDescriptor.prototype = {
        toString: function () { return 'ClassOf<' + ria.__API.getIdentifierOfType(this.clazz) + '>'; },
        valueOf: function () { return this.clazz; }
    };

    _DEBUG && Object.freeze(ClassOfDescriptor);

    ria.__API.ClassOfDescriptor = ClassOfDescriptor;

    function ClassOf(clazz) {
        if (clazz == undefined)
            throw Error('Expected class in ClassOf, but got undefined');

        if (!ria.__API.isClassConstructor(clazz) && clazz !== global.SELF)
            throw Error('Expected class in ClassOf, but got ' + ria.__API.getIdentifierOfType(clazz));

        return new ClassOfDescriptor(clazz);
    }

    ria.__API.ClassOf = ClassOf;
    ria.__API.isClassOfDescriptor = ClassOfDescriptor.isClassOfDescriptor;
})(this);
