'use strict';

var auth = require('services/auth');
var api = require('services/api-utils');
var runManager = require('services/run-manager');
var endpoints = require('services/endpoints');

function App() {}

App.prototype = {
    initialize: function () {
        if (!auth.isLoggedIn()) {
            window.location.href = 'login.html';
        } else {
            _.bindAll(this, ['assignUser']);
            this.render();
            this.bindEvents();
        }
    },

    bindEvents: function () {
        $('#logout').on('click', this.logout);
        $('#create-game').on('click', this.createGame);
        $('#users').on('click', '.assign-user', this.assignUser);
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
            data: JSON.stringify(game)
        });
    },

    assignUser: function (e) {
        var target = $(e.target);
        var userId = target.parents('tr').data('id');
        var role = target.parents('tr').find('.role').val();
        var gameId = $('#games tbody tr:first-child').data('id');

        var url = [endpoints.game, gameId, 'users'].join('/');
        var list = [{
            userId: userId,
            role: role
        }];

        var _this = this;
        return api.post(url, list, { apiRoot: endpoints.host }).then(function () {
            _this.renderGames();
        });
    },

    render: function () {
        this.renderGames();
        this.renderUsers();
    },

    renderGames: function () {
        var gamesTable = $('#games tbody');
        var gameRowTemplate = _.template('<tr data-id="<%= id %>"><td><%= id.substr(0,5) %></td><td><%= player1 %></td><td><%= player2 %></td>');

        gamesTable.empty();
        runManager.getGames().then(function (games) {
            if (!games.length) {
                gamesTable.append('<tr><td colspan="2">No games available</td></tr>');
            } else {
                games.forEach(function (game) {
                    game.player1 = game.player2 = '';
                    game.users.forEach(function (u, i) {
                        game['player' + u.role] = u.userName;
                    });

                    gamesTable.append(gameRowTemplate(game));
                });
            }
        });
    },

    renderUsers: function () {
        var userRowTemplate = _.template('<tr data-id="<%=userId%>"><td><%= userId.substr(0,5) %></td><td><select class="role"><option value="1">Player 1</option><option value="2">Player 2</option></select></td><td><a class="assign-user" href="#">></a></td>');
        var usersTable = $('#users tbody');
        var url = endpoints.host + endpoints.member + '/' + auth.groupId();

        usersTable.empty();
        $.getJSON(url, function (json) {
            json.members
                .filter(function (u) {
                    return u.role !== 'facilitator';
                })
                .forEach(function (user) {
                    usersTable.append(userRowTemplate(user));
                });
        });
    }
};

new App().initialize();
