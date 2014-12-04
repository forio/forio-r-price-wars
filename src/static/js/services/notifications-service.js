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

    sendChat: function (from, text) {
        var msg = {
            time: new Date(),
            type: 'chat',
            from: from,
            message: text
        };

        this.cometd.publish(this.options.channel, msg);
    },

    onNotify: function (msg) {
        if (!msg.user || msg.user.id !== auth.userId()) {
            this.notifyAll(msg.data.type, msg.data.subType, msg);
        }
    },

    notifyAll: function (type, subType, msg) {
        var events = ((this.events[type] || {})[subType || 'all'] || []);

        _.invoke(events, 'callback', msg);
    },

    subscribe: function (type, subType, callback, ctx) {
        subType = subType || 'all';
        this.events[type] = this.events[type] || {};
        this.events[type][subType] = this.events[type][subType] || [];
        this.events[type][subType].push({ callback: callback, context: ctx });
    }
};

module.exports = Notifications;