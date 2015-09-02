REQUIRE('ria.async.Future');

NAMESPACE('ria.async', function () {
    "use strict";

    /** @class ria.async.Completer */
    CLASS(
        'Completer', IMPLEMENTS(ria.async.ICancelable), [
            READONLY, ria.async.Future, 'future',
            READONLY, Boolean, 'completed',

            [[ria.async.ICancelable]],
            function $(canceler_) {
                BASE();
                this.future = new ria.async.Future(canceler_).getImpl();
                this.completed = false;
            },

            VOID, function progress(data) {
                this.future.updateProgress(data);
            },

            VOID, function complete(data) {
                Assert(!this.completed, 'Can not complete completed completer');

                this.future.finish(data);
                this.completed = true;
            },

            VOID, function completeError(error) {
                Assert(!this.completed, 'Can not completeError completed completer');

                this.future.completeError(error);
                this.completed = true;
            },

            VOID, function cancel() {
                this.future.completeBreak();
                this.completed = true;
            }
        ])
});