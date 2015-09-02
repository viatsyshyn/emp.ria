REQUIRE('ria.dom.Dom');

NAMESPACE('ria.dom', function () {

    var singleton = null;

    /** @class ria.dom.FavIcon */
    CLASS(
        'FavIcon', [
            function $$() {
                return singleton || (singleton = ria.__API.init.call(undefined, arguments));
            },

            [[String]],
            ria.dom.Dom, function setUrl(url) {
                ria.dom.Dom('head link[rel=~icon]').removeSelf();

                return ria.dom.Dom()
                    .fromHTML('<link/>')
                    .setAllAttrs({
                        type: 'image/x-icon',
                        rel: 'shortcut icon',
                        url: url
                    })
                    .appendTo('head');
            },

            String, function getUrl() {
                return ria.dom.Dom('head link[rel=~icon]').getAttr('url');
            }
        ]);
});