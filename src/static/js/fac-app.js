'use strict';

var auth = require('services/auth');
var runManager = require('services/run-manager');
var endpoints = require('services/endpoints');

function App() {}

App.prototype = {
    initialize: function () {
        if (!auth.isLoggedIn()) {
            window.location.href = 'login.html';
        } else {
            this.render();
            this.bindEvents();
        }
    },

    bindEvents: function () {
        $('#logout').on('click', this.logout);
        $('#create-game').on('click', this.createGame);
    },

    logout: function () {
        auth.logout().then(function () {
            window.location = 'login.html';
        });
    },

    createGame: function () {
        var url = endpoints.host + endpoints.game;
        var game = {
            account: auth.account,
            project: auth.project,
            group: auth.groupName()
        };

        return $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json',
            // dataType: 'json',
            data: JSON.stringify(game)
        });
    },

    render: function () {
        var userRowTemplate = _.template('<tr data-id=<%=userId%>><td><%= userId.substr(0,5) %></td><td><select><option value="1">Player 1</option><option value="2">Player 2</option></select></td>');
        var gameRowTemplate = _.template('<tr><td><%= id.substr(0,5) %></td><td></td>');
        var usersTable = $('#users tbody');
        var gamesTable = $('#games tbody');
        var url = endpoints.host + endpoints.member + '/' + auth.groupId();
        $.getJSON(url, function (json) {
            json.members
                .filter(function (u) {
                    return u.role !== 'facilitator';
                })
                .forEach(function (user) {
                    usersTable.append(userRowTemplate(user));
                });
        });

        runManager.getGames().then(function (games) {
            if (!games.length) {
                gamesTable.append('<tr><td colspan="2">No games available</td></tr>');
            } else {
                games.forEach(function (game) {
                    gamesTable.append(gameRowTemplate(game));
                });
            }

        });
    }
};



new App().initialize();
