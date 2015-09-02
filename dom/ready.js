REQUIRE('ria.async.Task');
REQUIRE('ria.dom.Dom');

/**
 * ria.dom.ready()
 *   .then(function () {
 *      doSomeInit()
 *   });
 */

NAMESPACE('ria.dom', function () {
    "use strict";

    var isPageReady = !_BROWSER,
        onReady = [];

    /* THE FOLLOWING CODE BLOCK IS PORTED FROM jQuery 1.5.1 */
    _BROWSER && (function () {
        var window = _GLOBAL,
            document = window.document;

        function onLoaded() {
            isPageReady = true;
            onReady.forEach(function (_) { _(null); });
        }

        // Cleanup functions for the document ready method
        var DOMContentLoaded;
        if ( document.addEventListener ) {
            DOMContentLoaded = function() {
                document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
                onLoaded();
            };

        } else if ( document.attachEvent ) {
            DOMContentLoaded = function() {
                // Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
                if ( document.readyState === "complete" ) {
                    document.detachEvent( "onreadystatechange", DOMContentLoaded );
                    onLoaded();
                }
            };
        }

        // Catch cases where $(document).ready() is called after the
        // browser event has already occurred.
        if ( document.readyState === "complete" ) {
            // Handle it asynchronously to allow scripts the opportunity to delay ready
            return setTimeout(onLoaded, 1);
        }

        // Mozilla, Opera and webkit nightlies currently support this event
        if ( document.addEventListener ) {
            // Use the handy event callback
            document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );

            // A fallback to window.onload, that will always work
            window.addEventListener( "load", onLoaded, false );

            // If IE event model is used
        } else if ( document.attachEvent ) {
            // ensure firing before onload,
            // maybe late but safe also for iframes
            document.attachEvent("onreadystatechange", DOMContentLoaded);

            // A fallback to window.onload, that will always work
            window.attachEvent( "onload", onLoaded );
        }
    })();
    /* END OF PORTED BLOCK */

    // make private
    CLASS(
        'DomReadyTask', EXTENDS(ria.async.Task), [
            OVERRIDE, VOID, function do_() {
                onReady.push(this._completer.complete);
            }
        ]);

    /**
     * ria.dom.ready()
     * @returns {ria.async.Future}
     */
    ria.dom.ready = function () {
        return !isPageReady
                ? new ria.dom.DomReadyTask().run()
                : ria.async.Future.$fromData(null);
    };
});