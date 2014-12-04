'use strict';

var PATH_FOR_COOKIES = window.location.pathname.replace(/\/([\w\d\s\.]*)$/, function () { return ''; });
var endpoints = require('./endpoints');

var defaults = {
    apiRoot: endpoints.root,
};

function wrapError(fn) {
    return function (xhr, error, message) {
        console.log('Error from the API', error, message);
        if (fn) {
            fn.apply(this, arguments);
        }
    };
}

function createCookie(name, value, days, domain) {
    var options = {
        expires: days || 30,
        domain: domain,
        path: PATH_FOR_COOKIES
    };

    if (typeof value === 'object') {
        value = JSON.stringify(value);
    }

    return $.cookie(name, value, options);
}

function getCookie(name) {
    var value = $.cookie(name);

    // check if this was and JSON object originally
    if (value && value[0] === '{' && value[value.length - 1] === '}') {
        value = JSON.parse(value);
    }

    return value || '';
}

function clearCookie(name, domain, path) {
    $.removeCookie(name, { domain: domain, path: path || PATH_FOR_COOKIES });
}

function prepareHeaders(extraHeaders) {
    var cookie = getCookie('sim-session');
    extraHeaders = extraHeaders || {};

    var headers = _.extend({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // 'Cache-Control':'no-cache'
    }, extraHeaders);

    if (cookie && cookie['access_token']) {
        _.extend(headers, {
            Authorization: 'Bearer ' + cookie['access_token']
        });
    }

    return headers;
}

function cacheBust(url) {
    var v = Math.floor(Math.random() * 10000 + 10000);
    return /\?/.test(url) ? url + '&v=' + v : url + '?v=' + v;
}

module.exports = {

    prepareHeaders: function () {
        var cookie = getCookie('sim-session');

        var headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };

        if (cookie['access_token']) {
            _.extend(headers, {
                Authorization: 'Bearer ' + cookie['access_token']
            });
        }

        return headers;
    },

    get: function (endpoint, query, options) {
        var opt = _.extend({}, defaults, options || {});
        var headers = prepareHeaders();

        return $.ajax({
            type: 'GET',
            headers: headers,
            cache: false,
            url: cacheBust(opt.apiRoot + '/' + endpoint + '?' + query),
            success: opt.success || _.noop,
            error: wrapError(opt.error),
            complete: opt.complete || _.noop
        });
    },

    post: function (endpoint, body, options) {
        var opt = _.extend({}, defaults, options || {});
        var headers = prepareHeaders();

        return $.ajax({
            type: 'POST',
            headers: headers,
            dataType: 'json',
            data: JSON.stringify(body),
            url: opt.apiRoot + '/' + endpoint,
            success: opt.success || _.noop,
            error: wrapError(opt.error),
            complete: opt.complete || _.noop
        });
    },

    patch: function (runId, body, options) {
        var opt = _.extend(options || {}, defaults);
        var headers = prepareHeaders();

        return $.ajax({
            type: 'PATCH',
            headers: headers,
            dataType: 'json',
            data: JSON.stringify(body),
            url: opt.apiRoot + '/' + runId + '/variables',
            success: opt.success || _.noop,
            error: wrapError(opt.error),
            complete: opt.complete || _.noop
        });
    },

    head: function (endpoint, options) {
        var opt = _.extend(options || {}, defaults);
        var headers = prepareHeaders();

        return $.ajax({
            type: 'HEAD',
            headers: headers,
            url: cacheBust(opt.apiRoot + '/' + endpoint),
            success: opt.success || _.noop,
            error: wrapError(opt.error),
            complete: opt.complete || _.noop
        });
    },

    removeFromMemory: function (runId, options) {
        var opt = _.extend(options || {}, defaults);
        var headers = prepareHeaders();

        return $.ajax({
            type: 'DELETE',
            headers: headers,
            url: endpoints.host + '/model/run/' + runId,
            success: opt.success || _.noop,
            error: wrapError(opt.error),
            complete: opt.complete || _.noop
        });
    },

    remove: function (endpoint, options) {
        var opt = _.extend(options || {}, defaults);
        var headers = prepareHeaders();

        return $.ajax({
            type: 'DELETE',
            headers: headers,
            url: endpoint,
            success: opt.success || _.noop,
            error: wrapError(opt.error),
            complete: opt.complete || _.noop
        });
    },

    createCookie: createCookie,

    getCookie: getCookie,

    clearCookie: clearCookie
};
