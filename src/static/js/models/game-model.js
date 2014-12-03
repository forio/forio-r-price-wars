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
        return this.run.variables().save(data);
    },

    advanceRound: function () {
        return this.run.do('advanceRound');
    },

    reset: function () {
        return this.run.do('initialize');
    },

    isPriceSubmitted: function () {
        var curPrices = this.getForCurPlayer('current_prices');
        return _.isArray(curPrices);
    },

    isReadyToStep: function () {
        return this.get('p1_current_prices')[0] && this.get('p2_current_prices')[0];
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
            'p1.current.prices',
            'p2.current.prices'
        ];

        function convertDotsToUnderscores(variables) {
            var hash = {};
            for (var key in variables) {
                if (variables.hasOwnProperty(key)) {
                    hash[key.replace(/\./g, '_')] = variables[key];
                }
            }

            return hash;
        }

        var _this = this;
        return this.run.variables()
            .query(variables)
            .then(function (resp) {
                _this._data = convertDotsToUnderscores(resp);
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
