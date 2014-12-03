'use strict';

// var api = require('services/api-utils');
// var runManager = require('services/run-manager');
// var endpoints = require('services/endpoints');


function GameModel(options) {
    options = options || {};
    this.run = options.run;
    this.player = options.player || 'p1';

    _.bindAll(this, ['setPrice', 'loadData', 'advanceRound', 'reset']);
}

GameModel.prototype = {

    getVarName: function (varName, sep) {
        sep = sep || '_';
        return [this.player, varName].join(sep);
    },

    setPrice: function (price) {
        var data = {};
        data[this.getVarName('current.prices', '.')] = price;
        this.run.variables().save(data);
    },

    advanceRound: function () {
        return this.run.do('advanceRound');
    },

    reset: function () {
        return this.run.do('initialize');
    },

    loadData: function () {
        var variables = [
            'total.rounds',
            'current.round',
            'p1.share',
            'p1.prices',
            'p1.revenue',
            'p1.profit',
            'p2.share',
            'p2.prices',
            'p2.revenue',
            'p2.profit',
            'p1.overall.profit',
            'p2.overall.profit',
        ];

        var _this = this;
        return this.run.variables()
            .query(variables)
            .then(function (resp) {
                _this._data = {};
                for (var key in resp) {
                    if (resp.hasOwnProperty(key)) {
                        _this._data[key.replace(/\./g, '_')] = resp[key];
                    }
                }
            });
    },

    get: function (varName) {
        return this._data[varName];
    },

    getForCurPlayer: function (varName) {
        return this.get(this.getVarName(varName));
    }
};


module.exports = GameModel;
