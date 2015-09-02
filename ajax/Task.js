/**
 * @class ria.ajax.AjaxTask
 *
    Usage:

    new ria.ajax.Task('/service/')
        .method(ria.async.Method.GET)
        .params({a: 1, b: 3})
        .disableCache()
        .timeout(500) // ms
        .run() // returns Future
            .handleProgress(function (event) {})
            .then(function (data) {})
            .catchError(function (event) {})
            .complete(function () {})
 */

REQUIRE('ria.async.Task');
REQUIRE('ria.async.Timer');

NAMESPACE('ria.ajax', function () {
    "use strict";

    function first1024(x) {
        return x && x.length > 1024 ? x.substr(0, 1024) : (x || '');
    }

    /** @class ria.ajax.AjaxException */
    EXCEPTION(
        'AjaxException', [
            READONLY, String, 'url',
            READONLY, Number, 'status',
            READONLY, String, 'statusText',
            READONLY, String, 'response',

            function $(status, statusText, response, url_) {
                BASE('Ajax error: ' + status + ' ' + statusText);
                this.status = status;
                this.statusText = statusText;
                this.response = response;
                this.url = url_ || null;
            },

            OVERRIDE, String, function toString() {
                var lines = BASE().split('\n');
                lines.splice(1, 0, [
                    '  URL: ' + this.url,
                    '  Response: ' + first1024(this.response)
                ]);
                return lines.join('\n');
            }
        ]);

    /** @class ria.ajax.ConnectionException */
    EXCEPTION(
        'ConnectionException', [
            function $(e_) {
                BASE('Internet connection failed', e_);
            }
        ]);

    /** @class ria.ajax.Method */
    ENUM(
        'Method', {
            GET: 'get',
            POST: 'post',
            PUT: 'put',
            DELETE: 'delete'
        });

    /** @class ria.ajax.Task */
    CLASS(
        'Task', EXTENDS(ria.async.Task), [
            [[String, ria.ajax.Method, Object]],
            function $(url, method_, params_) {
                BASE();

                this._method = method_;
                this._url = url;
                this._params = params_ || {};
                this._requestHeaders = {};
                this._requestTimeout = null;
                this._rawPostData = null;

                this._xhr = new XMLHttpRequest();

                //this._xhr.addEventListener("progress", this.updateProgress_, false);
                this._xhr.addEventListener("load", this.transferComplete_, false);
                this._xhr.addEventListener("error", this.transferFailed_, false);
                this._xhr.addEventListener("abort", this.transferCanceled_, false);

                //this._xhr.upload.addEventListener("progress", this.updateProgress_, false);
                //this._xhr.upload.addEventListener("error", this.transferFailed_, false);
                //this._xhr.upload.addEventListener("abort", this.transferCanceled_, false);
            },

            OVERRIDE, VOID, function cancel() {
                this._xhr.abort();
            },

            [[ria.ajax.Method]],
            SELF, function method(method) {
                this._method = method;
                return this;
            },

            /*
             dictionary of headers
             */
            [[Object]],
            SELF, function requestHeaders(headers) {
                this._requestHeaders = ria.__API.merge(headers, this._requestHeaders);
                return this;
            },


            function applyRequestHeaders_(){
                for(var reqHeader in this._requestHeaders){
                    if (this._requestHeaders.hasOwnProperty(reqHeader)){
                        var value = this._requestHeaders[reqHeader];
                        this._xhr.setRequestHeader(reqHeader, value);
                    }
                }
            },

            [[Object]],
            SELF, function params(obj) {
                var p = this._params;
                for(var key in obj) if (obj.hasOwnProperty(key) && (obj[key] != undefined) && (obj[key] != null)) {
                    p[key] = obj[key];
                }
                return this;
            },

            SELF, function rawPostData(data) {
                this._rawPostData = data;
                return this;
            },

            [[String]],
            SELF, function disableCache(paramName_) {
                this._params[paramName_ || '_'] = Math.random().toString(36).substr(2) + (new Date).getTime().toString(36);
                return this;
            },

            [[Number]],
            SELF, function timeout(duration) {
                this._requestTimeout = duration;
                return this;
            },

            FINAL, String, function getParamsAsQueryString_() {
                var p = this._params, r = [];
                for(var key in p) if (p.hasOwnProperty(key)) {
                    r.push([key, p[key]].map(encodeURIComponent).join('='));
                }
                return r.join('&');
            },

            VOID, function updateProgress_(oEvent) {
                this._completer.progress(oEvent);
            },

            VOID, function transferComplete_(evt) {
                if (this._xhr.status == 200) {
                    this._completer.complete(this._xhr.responseText);
                } else {
                    this._completer.completeError(this._xhr.status == 0
                        ? ria.ajax.ConnectionException()
                        : ria.ajax.AjaxException(this._xhr.status, this._xhr.statusText, this._xhr.response, this._url));
                }
            },

            VOID, function transferFailed_(evt) {
                this._completer.completeError(ria.ajax.ConnectionException());
            },

            VOID, function transferCanceled_(evt) {
                this._completer.cancel();
            },

            String, function getUrl_() {
                if (this._method != ria.ajax.Method.GET)
                    return this._url;

                return this._url + ((/\?/).test(this._url) ? "&" : "?") + this.getParamsAsQueryString_();
            },

            Object, function getBody_() {
                return this._method != ria.ajax.Method.GET ? (this._rawPostData || this.getParamsAsQueryString_()) : '';
            },

            // todo : was final
            OVERRIDE, VOID, function do_() {
                try {
                    BASE();
                    this._xhr.open(this._method.valueOf(), this.getUrl_(), true);
                    this.applyRequestHeaders_();
                    this._xhr.send(this.getBody_());

                } catch (e) {
                    this._completer.completeError(e);
                }

                this._requestTimeout && new ria.async.Timer.$once(this._requestTimeout, this.timeoutHandler_);
            },

            [[ria.async.Timer, Number]],
            VOID, function timeoutHandler_(timer, lag) {
                this._completer.isCompleted() || this.cancel();
            }
        ]);
});
