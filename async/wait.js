REQUIRE('ria.async.Completer');

NAMESPACE('ria.async', function () {
    "use strict";

    /**
     * @param {ria.async.Future|Array} future...
     * @returns {ria.async.Future}
     */
    ria.async.wait = function (future) {
        var futures = Array.isArray(future) ? future : [].slice.call(arguments)
          , completer = new ria.async.Completer
          , counter = 0
          , size = futures.length + 1
          , results = []
          , resolved = []
          , complete = false;

        futures.unshift(ria.async.DeferredAction()); // just in case futures are empty or all resolved :)

        futures.forEach(function (_, index) {
            VALIDATE_ARG('future', [ria.async.Future], _);

            _.then(function (data) {
                if (complete) return ;

                counter++;
                results[index] = data;
                resolved[index] = true;

                if (counter == size) {
                    complete = true;
                    completer.complete(results.slice(1));
                } else {
                    completer.progress(counter);
                }
            })
            .catchError(function (e) {
                if (complete) throw e;

                complete = true;
                completer.completeError(e);
            })
            .complete(function () {
                if (resolved[index] || complete) return;

                complete = true;
                completer.cancel();
            })
        });

        return completer.getFuture();
    };
})
