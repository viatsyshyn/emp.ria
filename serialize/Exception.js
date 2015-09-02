NAMESPACE('ria.serialize', function () {

    /** @class ria.serialize.Exception */
    EXCEPTION(
        'Exception', [
            function $(msg, inner_) {
                BASE(msg, inner_);
            }
        ])
});