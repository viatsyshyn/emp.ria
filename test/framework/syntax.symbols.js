var OVERRIDE = ria.__SYNTAX.Modifiers.OVERRIDE;
var ABSTRACT = ria.__SYNTAX.Modifiers.ABSTRACT;
var VOID = ria.__SYNTAX.Modifiers.VOID;
var SELF = ria.__SYNTAX.Modifiers.SELF;
var FINAL = ria.__SYNTAX.Modifiers.FINAL;
var READONLY = ria.__SYNTAX.Modifiers.READONLY;

var Class = ria.__API.Class;
var Interface = ria.__API.Interface;
var Exception = ria.__API.Exception;

var IMPLEMENTS = ria.__SYNTAX.IMPLEMENTS;
/** @type {Function} */
var EXTENDS = ria.__SYNTAX.EXTENDS;
/** @type {Function} */
var VALIDATE_ARG = ria.__SYNTAX.checkArg;
/** @type {Function} */
var VALIDATE_ARGS = ria.__SYNTAX.checkArgs;
/** @type {Function} */
var ArrayOf = ria.__API.ArrayOf;
/** @type {Function} */
var ClassOf = ria.__API.ClassOf;
/** @type {Function} */
var ImplementerOf = ria.__API.ImplementerOf;
/** @type {Function} */
var GENERIC = ria.__SYNTAX.GENERIC;

function __WRAPPER_E(args, cb) {
    var error = args[0];
    if (error instanceof Error)
        args.shift();
    else
        error = null;

    try {
        cb(args);
    } catch (e) {
        if (e.name == 'AssertError')
            throw e;

        var emsg = e.getMessage ? e.getMessage() : e.message;
        if (error && error.message != emsg) {
            fail('Expected error "' + error.message + '", actual: "' + emsg + '"');
        }

        return;
    }

    fail('Expected error' + (error ? ' "' + error.message + '"': ''));
}

function ANNOTATION(arg) {
    var def = ria.__SYNTAX.parseMember(new ria.__SYNTAX.Tokenizer([].slice.call(arguments)));
    ria.__SYNTAX.validateAnnotationDecl(def);
    return ria.__SYNTAX.compileAnnotation('window.' + def.name, def);
}

function ANNOTATION_E(error, arg) {
    __WRAPPER_E(ria.__API.clone(arguments), function (args) {
        var def = ria.__SYNTAX.parseMember(new ria.__SYNTAX.Tokenizer(args));
        ria.__SYNTAX.validateAnnotationDecl(def);
        return ria.__SYNTAX.compileAnnotation('window.' + def.name, def);
    });
}


function DELEGATE() {
    var def = ria.__SYNTAX.parseDelegate(new ria.__SYNTAX.Tokenizer([].slice.call(arguments)));
    ria.__SYNTAX.validateDelegateDecl(def);
    return ria.__SYNTAX.compileDelegate('window.' + def.name, def);
}

function DELEGATE_E(error, arg) {
    __WRAPPER_E(ria.__API.clone(arguments), function (args) {
        var def = ria.__SYNTAX.parseMember(new ria.__SYNTAX.Tokenizer(args));
        ria.__SYNTAX.validateDelegateDecl(def);
        ria.__SYNTAX.compileDelegate('window.' + def.name, def);
    });
}

/**
 * @param [arg*]
 */
function INTERFACE(arg) {
    var def = ria.__SYNTAX.parseClassDef(new ria.__SYNTAX.Tokenizer([].slice.call(arguments)));
    ria.__SYNTAX.validateInterfaceDecl(def);
    return ria.__SYNTAX.compileInterface('window.' + def.name, def);
}

/**
 * @param {Error} error
 * @param [arg*]
 * @return {*}
 */
function INTERFACE_E(error, arg) {
    __WRAPPER_E(ria.__API.clone(arguments), function (args) {
        var def = ria.__SYNTAX.parseClassDef(new ria.__SYNTAX.Tokenizer(args));
        ria.__SYNTAX.validateInterfaceDecl(def);
        ria.__SYNTAX.compileInterface('window.' + def.name, def);
    });
}

/**
 * @param [arg*]
 */
function CLASS(arg) {
    var def = ria.__SYNTAX.parseClassDef(new ria.__SYNTAX.Tokenizer(ria.__API.clone(arguments)));
    ria.__SYNTAX.precalcClassOptionalsAndBaseRefs(def, ria.__API.Class);
    ria.__SYNTAX.validateClassDecl(def, 'Class');
    return ria.__SYNTAX.compileClass('window.' + def.name, def);
}

/**
 * @param {Error} error
 * @param [arg*]
 * @return {*}
 */
function CLASS_E(error, arg) {
    __WRAPPER_E(ria.__API.clone(arguments), function (args) {
        var def = ria.__SYNTAX.parseClassDef(new ria.__SYNTAX.Tokenizer(args));
        ria.__SYNTAX.precalcClassOptionalsAndBaseRefs(def, ria.__API.Class);
        ria.__SYNTAX.validateClassDecl(def, 'Class');
        ria.__SYNTAX.compileClass('window.' + def.name, def);
    });
}

/**
 * @param [arg*]
 */
function EXCEPTION(arg) {
    var def = ria.__SYNTAX.parseClassDef(new ria.__SYNTAX.Tokenizer(ria.__API.clone(arguments)));
    ria.__SYNTAX.precalcClassOptionalsAndBaseRefs(def, ria.__API.Exception);
    ria.__SYNTAX.validateException(def);
    return ria.__SYNTAX.compileClass('window.' + def.name, def);
}

/**
 * @param {Error} error
 * @param [arg*]
 * @return {*}
 */
function EXCEPTION_E(error, arg) {
    __WRAPPER_E(ria.__API.clone(arguments), function (args) {
        var def = ria.__SYNTAX.parseClassDef(new ria.__SYNTAX.Tokenizer(args));
        ria.__SYNTAX.precalcClassOptionalsAndBaseRefs(def, ria.__API.Exception);
        ria.__SYNTAX.validateException(def);
        ria.__SYNTAX.compileClass('window.' + def.name, def);
    });
}

function IDENTIFIER(name, predefined_) {
    ria.__SYNTAX.validateIdentifierDecl(name, predefined_);
    return ria.__SYNTAX.compileIdentifier('window.' + name, predefined_);
}

function IDENTIFIER_E(error, name, predefined_) {
    __WRAPPER_E(ria.__API.clone(arguments), function (args) {
        ria.__SYNTAX.validateIdentifierDecl(name, predefined_);
        return ria.__SYNTAX.compileIdentifier('window.' + name, predefined_);
    });
}

function ENUM(name, val) {
    ria.__SYNTAX.validateEnumDecl(name, val);
    return ria.__SYNTAX.compileEnum('window.' + name, val);
}

function ENUM_E(error, name, val) {
    __WRAPPER_E(ria.__API.clone(arguments), function (args) {
        ria.__SYNTAX.validateEnumDecl(name, val);
        ria.__SYNTAX.compileEnum('window.' + name, val);
    });
}

function getErrorMessage(e) {
    return ria.__API.getIdentifierOfValue(e) + '(' + (e.getMessage ? e.getMessage() : e.message) + ')' + '\n' + e.toString();
}

function assertNoException(msg, callback) {
    var args = argsWithOptionalMsg_(arguments, 2);
    jstestdriver.assertCount++;

    try {
        args[1]();
    } catch(e) {
        fail(args[0] + 'expected not to throw exception, but threw ' + getErrorMessage(e));
    }
}

function assertException(msg, callback, error) {
    if (arguments.length == 1) {
        // assertThrows(callback)
        callback = msg;
        msg = '';
    } else if (arguments.length == 2) {
        if (typeof callback != 'function') {
            // assertThrows(callback, type)
            error = callback;
            callback = msg;
            msg = '';
        } else {
            // assertThrows(msg, callback)
            msg += ' ';
        }
    } else {
        // assertThrows(msg, callback, type)
        msg += ' ';
    }

    jstestdriver.assertCount++;

    try {
        callback();
    } catch(e) {
        if (e.name == 'AssertError') {
            throw e;
        }

        if (error && (e.getMessage ? e.getMessage() : e.message) != error.message) {
            fail(msg + 'expected to throw "' + error.message + '" but threw ' + getErrorMessage(e));
        }

        return true;
    }

    fail(msg + 'expected to throw ' + getErrorMessage(error));
}