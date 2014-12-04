'use strict';

var auth = require('services/auth');
var runManager = require('services/run-manager');
var templates = require('templates');
var GameModel = require('models/game-model');
var Notifications = require('services/notifications-service');

var moneyFormatter = d3.format('$,.0f');
var perFormatter = d3.format('%');


function App() {
    this.runManager = runManager;
}

App.prototype = {
    template: templates['data-table'],

    initialize: function () {
        if (!auth.isLoggedIn()) {
            window.location.href = 'login.html';
        } else {
            _.bindAll(this, ['bindEvents', 'bindNotifications', 'render', 'renderInputs', 'submitPrice', 'advanceRound', 'reset']);
            var _this = this;
            this.runManager.getRun().then(function () {
                var curUserId =  auth.userId();
                _this.currentUser = _.findWhere(_this.runManager.game.users, { userId: curUserId });
                _this.bindEvents();

                _this.bindNotifications();
                _this.model = new GameModel({ run: _this.runManager.run, player: 'p' + _this.currentUser.role });
                _this.model.loadData()
                    .then(_this.render);
            });

        }

        return this;
    },

    bindNotifications: function () {
        this.notifications = new Notifications({ gameId: this.runManager.game.id });
        this.notifications.initialize();

        this.notifications.subscribe('run', 'operation', function () {
            this.model
                .loadData()
                .then(this.render);
        }.bind(this));
    },

    bindEvents: function () {
        $('#logout').on('click', this.logout);
        $('body').on('click', '#submit', this.submitPrice);
        $('#advance').on('click', this.advanceRound);
        $('#reset').on('click', this.reset);
    },

    logout: function () {
        auth.logout().then(function () {
            window.location = 'login.html';
        });
    },

    submitPrice: function (e) {
        e.preventDefault();
        var target = $('#price');
        var price = +$('#price').val();

        target.parents('form').removeClass('has-error');
        $('#error-message').empty();

        if (_.isNaN(price)) {
            target.parents('form').addClass('has-error');
            $('#error-message').text('Price must be a number');

            return;
        }

        $(e.target)
            .addClass('disabled');

        this.model.setPrice(price)
            .then(this.model.advanceIfReady)
            .then(this.render);
    },

    advanceRound: function (e) {
        this.model.advanceRound()
            .then(this.render);
    },

    reset: function () {
        this.model.reset()
            .then(this.render);
    },

    render: function () {
        this.renderUserName();
        this.renderMarketShare();
        this.renderPrices();
        this.renderCharts();

        this.renderInputs();
    },

    renderInputs: function () {
        $('#inputs').html(templates['inputs']({ isPriceSubmitted: this.model.isPriceSubmitted() }));
    },

    renderUserName: function () {
        var curUser = this.currentUser;

        $('.userName').text('Player ' + curUser.role + ' (' + curUser.userName + ')');
    },

    renderCharts: function () {
        this.renderProfitChart();
        this.renderCorrelationChart();
    },

    renderPrices: function () {
        $('.prices').html(this.template({ caption: 'Prices' }));
        var table = $('.prices tbody');
        this.renderProductData(table, 0, 'prices', null, 'number');
    },

    renderMarketShare: function () {
        $('.market-share').html(this.template({ caption: 'Market Share' }));
        var table = $('.market-share tbody');
        this.renderProductData(table, 0, 'share', d3.format('%'), 'percentage');
    },

    renderProductData: function (table, productIndex, field, formatter, cellClass) {
        formatter = formatter || d3.format('$.2f');
        this.renderDataRow(table, 'Player 1', this.model.get('p1_' + field)[productIndex].map(formatter), cellClass);
        this.renderDataRow(table, 'Player 2', this.model.get('p2_' + field)[productIndex].map(formatter), cellClass);
    },

    renderProductSeparator: function (table, product) {
        $('<tr>').append($('<th>').text(product)).appendTo(table);
    },

    renderDataRow: function (table, player, data, cellClass) {
        var tr = $('<tr>');
        var curRound = this.model.get('current_round')[0];
        tr.append($('<td>').text(player));

        for (var j = 0; j<curRound - 1; j++) {
            var cell = $('<td>').text(data[j]);
            if (cellClass) {
                cell.addClass(cellClass);
            }

            tr.append(cell);
        }

        table.append(tr);
    },

    renderProfitChart: function () {
        var categories = _.range(5).map(function (a) { return a + 2015; });
        this.profitChart = this.profitChart || new Contour({
            el: '.profit-chart',
            chart: {
                animations: false,

                padding: {
                    left: 45
                }
            },

            xAxis: {
                title: 'Year',
                min: 0,
                max: 4,
                labels: {
                    formatter: function (d) {
                        return categories[d];
                    }
                }
            },

            yAxis: {
                title: 'Profit',
                labels: {
                    formatter: function (v) {
                        return v < 100 && v > 100 ? d3.format('d')(v) : d3.format('$.2s')(v);
                    }
                }
            },

            tooltip: {
                formatter: function (d) {
                    return '<h5>' + moneyFormatter(d.y) + '</h5>Cumulative Profit ' + d.series + ' - ' + categories[d.x];
                }
            }
        })
        .cartesian()
        .line()
        .legend()
        .tooltip();

        var curRound = this.model.get('current_round')[0];
        var cleanSeries = function (v, i) { return i < curRound - 1 ? v : null; };
        if (curRound > 1) {
            var series = [{
                name: 'Player 1',
                data: this.model.get('p1_cumulative_profit')[0].map(cleanSeries)
            }, {
                name: 'Player 2',
                data: this.model.get('p2_cumulative_profit')[0].map(cleanSeries)
            }];

            this.profitChart.setData(series).render();
        } else {
            this.profitChart.setData([{ name: 'Player 1', data: [] }, { name: 'Player 2', data: [] }]).render();
        }
    },

    renderCorrelationChart: function () {
        var prodId = 0;

        this.correlationChart = this.correlationChart || new Contour({
            el: '.correlation-chart',
            chart: {
                padding: {
                    left: 45
                }
            },

            yAxis: {
                title: 'Price',
                labels: {
                    format: '$.2s'
                }
            },

            xAxis: {
                min: 0,
                max: 1,
                labels: {
                    formatter: function (d) {
                        if (d * 10 % 2 === 0) {
                            return perFormatter(d);
                        }

                        return null;
                    }
                },
                title: 'Market Share (%)'
            },

            tooltip: {
                formatter: function (d) {
                    return '<h5>' + perFormatter(d.x) + ' market share at ' + moneyFormatter(d.y) + '</h5>';
                }
            }

        })
        .cartesian()
        .scatter()
        .tooltip();

        var _this = this;
        var curRound = this.model.get('current_round')[0];
        if (curRound > 1) {
            var prices = _this.model.getForCurPlayer('prices')[0];
            var data = this.model.getForCurPlayer('share')[prodId].slice(0, curRound - 1).map(function (share, round) {
                return {
                    x: share,
                    y: prices[round]
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
