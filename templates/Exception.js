NAMESPACE('ria.templates', function () {

    /** @class ria.templates.Exception */
    EXCEPTION(
        'Exception', [
            function $(msg, inner_) {
                BASE(msg, inner_);
            }
        ]);
});
