'use strict';

var auth = require('services/auth');
var runManager = require('services/run-manager');
var templates = require('templates');

function App() {
    this.runManager = runManager;
}

App.prototype = {
    template: templates['data-table'],

    initialize: function () {
        if (!auth.isLoggedIn()) {
            window.location.href = 'login.html';
        } else {
            _.bindAll(this, ['bindEvents', 'render', 'loadData', 'submitPrice', 'advanceRound', 'reset']);
            var _this = this;
            this.runManager.getRun().then(function () {
                _this.bindEvents();
                _this.run = _this.runManager.run;
                _this.loadData();

            });

        }

        return this;
    },

    bindEvents: function () {
        $('#logout').on('click', this.logout);
        $('#submit').on('click', this.submitPrice);
        $('#advance').on('click', this.advanceRound);
        $('#reset').on('click', this.reset);
    },

    logout: function () {
        auth.logout().then(function () {
            window.location = 'login.html';
        });
    },

    submitPrice: function (e) {
        var price = +$('#price').val();
        this.run.variables().save({ 'p1.current.prices': price });
    },

    advanceRound: function (e) {
        this.run.do('advanceRound')
            .then(this.loadData);
    },

    reset: function () {
        this.run.do('initialize')
            .then(this.loadData);
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
        this.run.variables()
            .query(variables)
            .then(function (resp) {
                _this.model = {};
                for (var key in resp) {
                    if (resp.hasOwnProperty(key)) {
                        _this.model[key.replace(/\./g, '_')] = resp[key];
                    }
                }
            })
            .then(this.render);
    },


    render: function () {
        this.renderUserName();
        this.renderMarketShare();
        this.renderPrices();
        this.renderCharts();
    },

    renderUserName: function () {
        var curUserId =  auth.userId();
        var curUser = _.find(this.runManager.game.users, function (u) {
            return u.userId === curUserId;
        });

        $('.userName').text('Player ' + curUser.role + ' (' + curUser.userName + ')');
    },

    renderCharts: function () {
        this.renderProfitChart();
        this.renderCorrelationChart();
    },

    renderPrices: function () {
        $('.prices').html(this.template({ caption: 'Prices' }));
        var table = $('.prices tbody');
        this.renderProductData(table, 0, 'prices');
        // this.renderProductData(table, 1, 'share');
        // this.renderProductData(table, 2, 'share');
    },

    renderMarketShare: function () {
        $('.market-share').html(this.template({ caption: 'Market Share' }));
        var table = $('.market-share tbody');
        this.renderProductData(table, 0, 'share', d3.format('%'));
        // this.renderProductData(table, 1, 'share');
        // this.renderProductData(table, 2, 'share');
    },

    renderProductData: function (table, productIndex, field, formatter) {
        formatter = formatter || d3.format('$.2f');
        // this.renderProductSeparator(table, 'Product ' + (productIndex + 1));
        this.renderDataRow(table, 'Player 1', this.model['p1_' + field][productIndex].map(formatter));
        this.renderDataRow(table, 'Player 2', this.model['p2_' + field][productIndex].map(formatter));
    },

    renderProductSeparator: function (table, product) {
        $('<tr>').append($('<th>').text(product)).appendTo(table);
    },

    renderDataRow: function (table, player, data) {
        var tr = $('<tr>');
        var curRound = this.model['current_round'][0];
        tr.append($('<td>').text(player));

        for (var j = 0; j<curRound - 1; j++) {
            tr.append($('<td>').text(data[j]));
        }

        table.append(tr);
    },

    renderProfitChart: function () {
        var categories = _.range(5).map(function (a) { return a + 2015; });
        this.profitChart = this.profitChart || new Contour({
            el: '.profit-chart',
            chart: {
                padding: {
                    // left: 45
                }
            },
            xAxis: {
                labels: {
                    formatter: function (d) {
                        return categories[d];
                    }
                }
            },

            yAxis: {
                title: 'Profit',
                innerTickSize: 0,
                outerTickSize: 0,
                labels: {
                    formatter: function (v) {
                        return v < 100 && v > 100 ? d3.format('d')(v) : d3.format('$.2s')(v);
                    }
                }
            }
        })
        .cartesian()
        .line()
        .tooltip();

        var curRound = this.model['current_round'][0];
        if (curRound > 1) {
            var data =  this.model['p1_overall_profit'].map(function (v, i) { return i < curRound - 1 ? v : null; });
            var series = [{
                name: 'Overall Profit',
                data: data
            }];

            this.profitChart.setData(series).render();
        } else {
            this.profitChart.setData([]).render();
        }
    },

    renderCorrelationChart: function () {
        var prodId = 0;

        this.correlationChart = this.correlationChart || new Contour({
            el: '.correlation-chart'
        })
        .cartesian()
        .scatter()
        .tooltip();

        var _this = this;
        var curRound = this.model['current_round'][0];
        if (curRound > 1) {
            var data = this.model['p1_share'][prodId].slice(0, curRound - 1).map(function (share, round) {
                return {
                    x: share,
                    y: _this.model['p1_prices'][0][round]
                };
            });
            var series = [{
                name: 'Profit vs. Market Share',
                data: data
            }];
            this.correlationChart.setData(series).render();
        } else {
            this.correlationChart.setData([]).render();
        }
    }
};


new App().initialize();
