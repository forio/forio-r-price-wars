
'use strict';

var net = require('./api-utils');
var endpoints = require('./endpoints');

var isFacilitator = function (resp, userId) {

    if (resp && resp.length) {
        var project = _.find(resp, function (project) {
            return project.project === endpoints.project && project.account === endpoints.account;
        });

        if (project) {
            return _.any(project.members, function (member) {
                return member.userId === userId && (member.role === 'facilitator');
            });
        }
    }

    return false;
};

var authToken = function (cookie) {
    return JSON.parse(new Buffer(cookie['access_token'].split('.')[1], 'base64').toString('ascii'));
};

module.exports = {
    login: function (user, password, options) {
        options = options || {};

        var success = options.success;
        delete options.success;

        var onSuccess = function (data) {
            $.ajaxSetup({
                headers: { 'Authorization': 'Bearer ' + data['access_token'] }
            });

            var jwt = JSON.parse(new Buffer(data['access_token'].split('.')[1], 'base64').toString('ascii'));

            var userId = jwt['user_id'];
            var userName = jwt['user_name'];
            // end users always have a slash in the name
            var isFacUserName = !/\//.test(userName);

            var query = 'account=' + endpoints.account + '&project=' + endpoints.project + '&userId=' + userId;
            var dtd = $.Deferred();

            net.get('member/local', query, {
                apiRoot: endpoints.host,
                success: function (resp) {
                    var isFac = isFacilitator(resp, userId) || isFacUserName;

                    /// TODO: this needs to change for multi-group login
                    var group = resp[0];
                    var cookieObj = {
                        'access_token': data['access_token'],
                        'account': endpoints.account,
                        'project': endpoints.project,
                        'groupId': group.groupId,
                        'groupName': group.name,
                        'isFac': isFac
                    };

                    net.createCookie(endpoints.sessionCookieName, cookieObj);

                    var userObject = {
                        userName: userName,
                        userId: userId,
                        isFacilitator: isFac,
                        groupId: group.groupId,
                        groupName: group.name,
                        account: group.account,
                        project: group.project
                    };

                    if (success) {
                        success.call(this, userObject);
                    }

                    dtd.resolve(userObject);
                },
                error: function (a, b, c) {
                    dtd.rejectWith(null, a, b, c);
                }
            });

            return dtd.promise();
        };

        options.apiRoot = endpoints.host;

        return net.post(endpoints.login, { userName: user, account: this.account, password: password }, options)
            .then(onSuccess);
    },

    account: endpoints.account,

    project: endpoints.project,

    isLoggedIn: function () {
        var cookie = net.getCookie(endpoints.sessionCookieName);
        if (!cookie || !cookie['access_token']) {
            return false;
        }

        $.ajaxSetup({
            headers: { 'Authorization':'Bearer ' + cookie['access_token'] }
        });

        return true;
    },

    logout: function (callback) {
        net.clearCookie(endpoints.sessionCookieName);
        if (callback) {
            callback();
        }

        return $.Deferred().resolve().promise();
    },

    _getTokenField: function (field) {
        var cookie = net.getCookie(endpoints.sessionCookieName);

        if (!cookie || !cookie['access_token']) {
            return '';
        }

        return authToken(cookie)[field];
    },

    isFac: function () {
        var cookie = net.getCookie(endpoints.sessionCookieName);
        return cookie.isFac;
    },

    userId: function () {
        return this._getTokenField('user_id');
    },

    userName: function () {
        return this.userId().substr(0,5);
    },

    groupName: function () {
        var cookie = net.getCookie(endpoints.sessionCookieName);
        return cookie.groupName;
    },

    groupId: function () {
        var cookie = net.getCookie(endpoints.sessionCookieName);
        return cookie.groupId;
    }
};
