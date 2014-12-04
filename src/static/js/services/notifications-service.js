'use strict';


var Channel = require('services/multiplayer-service');
var auth = require('services/auth');
var endpoints = require('services/endpoints');


var Notifications = function (options) {
    var gameId = (options || {}).gameId;
    this.options = _.defaults(options || {}, {
        baseUrl: endpoints.cometdBaseUrl,
        channel: '/game/' + [auth.account, auth.project, auth.groupName(), gameId].join('/')
    });

    this.cometd = new Channel();
};

Notifications.prototype = {
    initialize: function () {
        this.cometd.init(this.options.baseUrl);
        this.cometd.subscribe(this.options.channel, this.onNotify.bind(this));
        this.events = {};
    },

    onNotify: function (msg) {
        if (msg.user.id !== auth.userId()) {
            this.notifyAll(msg.data.type, msg.data.subType, msg);
        }
    },

    notifyAll: function (type, subType, msg) {
        var events = ((this.events[type] || {})[subType] || []);

        _.invoke(events, 'callback');
    },

    subscribe: function (type, subType, callback, ctx) {
        subType = subType || 'all';
        this.events[type] = this.events[type] || {};
        this.events[type][subType] = this.events[type][subType] || [];
        this.events[type][subType].push({ callback: callback, context: ctx });
    }
};

module.exports = Notifications;