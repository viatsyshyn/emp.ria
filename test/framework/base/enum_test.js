(function (ria) {
    "use strict";

    TestCase("EnumTestCase").prototype = {
        setUp: function(){},

        testDeclaration: function () {
            var Suit = function () {
                var values = {};
                function Suit(raw) { return values[raw];}
                ria.__API.enumeration(Suit, 'Suit');
                function SuitImpl(raw) { this.valueOf = function () { return raw; } }
                ria.__API.extend(SuitImpl, Suit);
                values[1] = Suit.CLUB = new SuitImpl(1);
                values[2] = Suit.DIAMOND = new SuitImpl(2);
                values[3] = Suit.HEART = new SuitImpl(3);
                values[4] = Suit.SPADE = new SuitImpl(4);
                return Suit;
            }();

            assertFunction(Suit);
            assertNotUndefined(Suit.__META);
            assertInstanceOf(ria.__API.EnumDescriptor, Suit.__META);
            assertTrue(ria.__API.isEnum(Suit));
            assertFalse(ria.__API.isEnum(Number));
        },

        testUsage: function() {
            var Suit = function () {
                var values = {};
                function Suit(raw) { return values[raw];}
                ria.__API.enumeration(Suit, 'Suit');
                function SuitImpl(raw) { this.valueOf = function () { return raw; } }
                ria.__API.extend(SuitImpl, Suit);
                values[1] = Suit.CLUB = new SuitImpl(1);
                values[2] = Suit.DIAMOND = new SuitImpl(2);
                values[3] = Suit.HEART = new SuitImpl(3);
                values[4] = Suit.SPADE = new SuitImpl(4);
                return Suit;
            }();

            assertSame(Suit.CLUB.valueOf(), 1);
            assertSame(Suit.HEART.valueOf(), 3);
        }
    }
})(ria);
