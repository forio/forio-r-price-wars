'use strict';

var auth = require('services/auth');
var api = require('services/api-utils');
var runManager = require('services/run-manager');
var endpoints = require('services/endpoints');
var templates = require('templates');

function App() {}

App.prototype = {
    initialize: function () {
        if (!auth.isLoggedIn()) {
            window.location.href = 'login.html';
        } else {
            _.bindAll(this, ['assignUser', 'renderGames', 'deleteGame', 'resetGame']);
            this.render();
            this.bindEvents();
        }
    },

    bindEvents: function () {
        $('#logout').on('click', this.logout);
        $('#create-game').on('click', this.createGame);
        $('#users').on('click', '.assign-user', this.assignUser);
        $('#games').on('click', '.delete-game', this.deleteGame);
        $('#games').on('click', '.reset-game', this.resetGame);
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
            group: auth.groupName(),
            model: endpoints.model
        };

        return $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(game)
        })
        .then(this.renderGames);
    },

    deleteGame: function (e) {
        var target = $(e.target);
        var gameId = target.parents('tr').data('id');
        var url = [endpoints.host, endpoints.game, gameId].join('/');

        api.remove(url).then(this.renderGames);
    },

    resetGame: function (e) {
        var target = $(e.target);
        var gameId = target.parents('tr').data('id');
        var url = [endpoints.game, gameId, 'run'].join('/');

        api.post(url, null, { apiRoot: endpoints.host })
            .then(function (runId) {
                return api.post([runId, 'operations', 'initialize'].join('/'));
            })
            .then(_.partial(this.alert, 'The game was re-initialized'))
            .then(this.renderGames);
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
        var gameRowTemplate = templates['facilitator/game-row'];

        gamesTable.empty();
        runManager.getGames().then(function (games) {
            games.sort(function (a, b) { return new Date(b.lastModified) - new Date(a.lastModified); });
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
        var userRowTemplate = _.template('<tr data-id="<%=userId%>"><td><%= userId.substr(0,5) %></td><td><select class="role"><option value="1">Player 1</option><option value="2">Player 2</option></select></td><td><a class="assign-user" href="javascript: void(0);">></a></td>');
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
    },

    alert: function (msg) {
        alert(msg);
    }
};

new App().initialize();
