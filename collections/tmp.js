/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 7/19/13
 * Time: 2:19 PM
 * To change this template use File | Settings | File Templates.
 */


var ConstPair = CLASS(GENERIC('TKey', 'TValue'),
    'ConstPair', [
        READONLY, TKey, 'key',
        READONLY, TValue, 'value',

        [[TKey, TValue]],
        function $(key, value) {
            this.key = key;
            this.value = value;
        }
    ]);

CLASS(GENERIC('TKey', 'TValue'),
    'Pair', [
        TKey, 'key',
        TValue, 'value',

        [[TKey, TValue]],
        function $(key, value) {
            this.key = key;
            this.value = value;
        }
    ]);

INTERFACE(GENERIC('TKey', 'TValue'),
    'ICollection', [
        ConstPair.OF(TKey, TValue), function __iterator__() {},
        [[TKey]],
        TValue, function get(key) {},
        [[TKey, TValue]],
        VOID, function put(key, value) {},
        [[TKey]],
        VOID, function removeKey(key) {},
        [[TValue]],
        Boolean, function contains(value) {},
        [[TValue]],
        TKey, function keyOf(value) {}
    ]);

var BaseIterable = CLASS(GENERIC('TKey', 'TValue'),
    PRIVATE, 'BaseIterable', [
        ConstPair.OF(TKey, TValue), function __iterator__() {
            for(var k in this) if (this.hasOwnProperty(k))
                yield new ConstKey(this.TKey, this.TValue, k, this[k]);
        },

        [[TKey]],
        TValue, function get(key) {
            if (this.hasOwnProperty(k)) // check if enumerable
                return this[key];

            throw KeyNotFoundException(key);
        },

        [[TKey, TValue]],
        VOID, function put(key, value) {
            this[key] = value; // check is enumerable
        },

        [[TKey]],
        VOID, function removeKey(key) {
            if (this.hasOwnProperty(k))  // check is enumerable
                delete this[key];

            throw KeyNotFoundException(key);
        },

        [[TValue]],
        Boolean, function contains(value) {
            for(var k in this) if (this.hasOwnProperty(k) && this[k] === value)
                return true;

            return false;
        },

        [[TValue]],
        TKey, function keyOf(value) {
            for(var k in this) if (this.hasOwnProperty(k) && this[k] === value)
                return k;

            throw ValueNotFoundException(value);
        }
    ]);

var Dictionary = CLASS(GENERIC('TValue'),
    PRIVATE, FINAL, 'Dictionary', EXTENDS(BaseIterable.OF(String, TValue)), []);

var List = CLASS(GENERIC('TValue'),
    FINAL, 'List', EXTENDS(BaseIterable.OF(Number, TValue)), []);

var HashMap = CLASS(GENERIC('TKey', EXTENDS(Class), 'TValue'),
    FINAL, 'HashMap', [
        function $() {
            this._keys = new Dictionary(this.TValue);
            this._values = new Dictionary(this.TValue);
        },

        ConstPair.OF(TKey, TValue), function __iterator__() {
            var key = this._keys.__iterator__();
            return new ConstPair(this.TKey, this.TValue, key.getValue(), this._values.get(key.getKey()));
        },

        [[TKey]],
        TValue, function get(key) {
            var index = key.getHashCode();
            return this._values.get(index);
        },

        [[TKey, TValue]],
        VOID, function put(key, value) {
            var index = key.getHashCode();
            this._keys.put(index, key);
            this._values.put(index, value);
        },

        [[String]],
        VOID, function removeKey(key) {
            var index = key.getHashCode();
            this._keys.removeKey(index);
            this._values.removeKey(index);
        }
    ]);

CLASS(GENERIC('TKey', 'TValue'),
    FINAL, 'Map', [
        function $$(instance, clazz, ctor, args) {
            if (args[0] === String)
                return Dictionary.apply(undefined, args.slice(1));

            if (args[0] === Number)
                return List.apply(undefined, args.slice(1));

            return ria.__API.init(instance, clazz, ctor, args);
        }
    ]);
