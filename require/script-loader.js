
(function () {
    "use strict";

    ria.__REQUIRE.addLoader(
        function filter(path) {
            return /\.js$/.test(path);
        },

        function loader(src, callback) {
            var script_tag = document.createElement('script');
            script_tag.setAttribute('type', 'text/javascript');
            script_tag.setAttribute('src', src);

            var fired = false;
            script_tag.onload = script_tag.onreadystatechange = function() {
                if(!this.readyState
                    || this.readyState == "loaded"
                    || this.readyState == "complete") {

                    fired || setTimeout(function () {
                        callback(true, null);
                    }, 1);
                    fired = true;
                }
            };

            script_tag.onerror = function(e) {
                fired || setTimeout(function () {
                    callback(null, Error());
                }, 1);
                fired = true;
            };

            document.getElementsByTagName('head')[0].appendChild(script_tag);
        }
    )
})();