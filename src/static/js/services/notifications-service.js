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
    },

    onNotify: function (msg) {

    }


};

module.exports = Notifications;