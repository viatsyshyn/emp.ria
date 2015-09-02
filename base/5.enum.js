(function () {
    "use strict";

    /**
     * @param {Function} enumClass
     * @param {String} name
     * @constructor
     */
    function EnumDescriptor(enumClass, name) {
        this.enumClass = enumClass;
        this.name = name;
    }

    ria.__API.EnumDescriptor = EnumDescriptor;

    /**
     * @param {Function} enumClass
     * @param {String} name
     */
    ria.__API.enumeration = function (enumClass, name) {
        enumClass.__META = new EnumDescriptor(enumClass, name);
    };

    ria.__API.isEnum = function (value) {
        return (value && value.__META) ? value.__META instanceof EnumDescriptor : false;
    }
})();