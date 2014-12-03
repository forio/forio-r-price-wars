'use strict';

var api = require('services/api-utils');
var auth = require('services/auth');
var endpoints = require('services/endpoints');

module.exports = {
    getGames: function (userId) {
        ///multiplayer/game?account={team id}&project={project id}&group={group name}&userId={user id}
        var query = [
            'account=' + auth.account,
            'project=' + auth.project,
            'group=' + auth.groupName()
        ];

        if (userId) {
            query.push(userId);
        }

        return api.get('multiplayer/game', query.join('&'), { apiRoot: endpoints.host  });
    },

    getRun: function () {
        // callback hell!
        var _this = this;

        return this.getGames(auth.userId())
            .then(function (resp) {
                if (!resp.length) {
                    var t = $.Deferred().reject(null, 'error', 'You haven\'t been assigned to a game yet. Ask the facilitator to assign you to a game');
                    return t.promise();
                }

                resp.sort(function (a,b) { return new Date(b.lastModified) - new Date(a.lastModified); });
                var game = _this.game = resp[0];
                return api.post('multiplayer/game/' + game.id + '/run', null, { apiRoot: endpoints.host })
                    .then(function (runId) {
                        _this.run = new F.service.Run({
                            account: auth.account,
                            project: auth.project
                        });
                        return _this.run.load(runId).then(function (run) {
                            if (!run.initialized) {
                                return _this.run.do('initialize').then(function () {
                                    _this.run.save({ initialized: true });
                                });
                            }
                        });
                    })
                    .fail(function (xhr, error, msg) {
                        var t = $.Deferred().rejectWith('There was an error creating the run. Please refresh to try again (' + msg + ')');
                        console.log ('there was an error creating the run', msg);
                        return t.promise();
                    });

            })
            .fail(function (xhr, error, msg) {
                console.log('error ' + msg);
            });
    }
};
