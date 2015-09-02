(function (ria) {
    "use strict";

    TestCase("IdentifierTestCase").prototype = {
        setUp: function(){},

        testDeclaration: function () {
            var CardValue = function () {
                var values = {};
                function CardValue(value) {
                    return values.hasOwnProperty(value) ? values[value] : (values[value] = new CardValueImpl(value));
                }
                ria.__API.identifier(CardValue, 'CardValue');

                function CardValueImpl(value) {
                    this.valueOf = function () { return value; };
                    this.toString = function toString() { return '[CardValue#' + value + ']'; };
                    Object.freeze(this);
                };
                ria.__API.extend(CardValueImpl, CardValue);
                return CardValue;
            }();

            assertFunction(CardValue);
            assertNotUndefined(CardValue.__META);
            assertInstanceOf(ria.__API.IdentifierDescriptor, CardValue.__META);
            assertTrue(ria.__API.isIdentifier(CardValue));
            assertFalse(ria.__API.isIdentifier(Number));
        },

        testUsage: function() {
            var CardValue = function () {
                var values = {};
                function CardValue(value) {
                    return values.hasOwnProperty(value) ? values[value] : (values[value] = new CardValueImpl(value));
                }
                ria.__API.identifier(CardValue, 'CardValue');

                function CardValueImpl(value) {
                    this.valueOf = function () { return value; };
                    this.toString = function toString() { return '[CardValue#' + value + ']'; };
                    Object.freeze(this);
                }
                ria.__API.extend(CardValueImpl, CardValue);
                return CardValue;
            }();

            var MoneyValue = function () {
                var values = {};
                function MoneyValue(value) {
                    return values.hasOwnProperty(value) ? values[value] : (values[value] = new MoneyValueImpl(value));
                }
                ria.__API.identifier(MoneyValue, 'MoneyValue');

                function MoneyValueImpl(value) {
                    this.valueOf = function () { return value; };
                    this.toString = function toString() { return '[MoneyValue#' + value + ']'; };
                    Object.freeze(this);
                }
                ria.__API.extend(MoneyValueImpl, MoneyValue);
                return MoneyValue;
            }();

            assertSame(CardValue(1).valueOf(), 1);
            assertSame(CardValue(1).toString(), '[CardValue#1]');
            assertNotEquals(CardValue(1), MoneyValue(1));
        }
    }
})(ria);
