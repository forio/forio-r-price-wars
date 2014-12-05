'use strict';

var auth = require('services/auth');
var runManager = require('services/run-manager');
var templates = require('templates');
var GameModel = require('models/game-model');
var Notifications = require('services/notifications-service');

var moneyFormatter = d3.format('$,.0f');
var perFormatter = d3.format('%');

var duration = 800;
var categories = _.range(5).map(function (a) { return a + 2015; });
var profitChartOptions = {
    el: '.profit-chart',
    chart: {
        // animations: false,
        animations: {
            duration: duration
        },
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

    legend: {
        vAlign: 'top',
        hAlign: 'right',
        direction: 'horizontal'
    }
};


function App() {
    this.runManager = runManager;
}

App.prototype = {
    template: templates['data-table'],

    initialize: function () {
        if (!auth.isLoggedIn()) {
            window.location.href = 'login.html';
        } else {
            _.bindAll(this, ['bindEvents', 'bindNotifications', 'render', 'renderInputs', 'submitPrice', 'advanceRound', 'reset', 'sendChat']);
            var _this = this;
            this.runManager.getRun().then(function () {
                var curUserId =  auth.userId();
                _this.currentUser = _.findWhere(_this.runManager.game.users, { userId: curUserId });
                _this.bindEvents();

                _this.bindNotifications();
                _this.model = new GameModel({ run: _this.runManager.run, player: 'p' + _this.currentUser.role });
                _this.model.loadData()
                    .then(_this.render);
            })
            .fail(function () {
                $('.network-error').show();
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

        this.notifications.subscribe('chat', null, function (msg) {
            var template = _.template('<div class="message"><span class="from"><%= from %> @ <%= new Date(time).toLocaleTimeString() %></span><span class="message-text"><%= message %></span></div>');
            $('.chat .messages').prepend(template(msg.data));
        });
    },

    bindEvents: function () {
        $('#logout').on('click', this.logout);
        $('body').on('click', '#submit', this.submitPrice);
        $('body').on('click', '#send-chat', this.sendChat);
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
        var price = +($('#price').val().replace(/[,$]/g, ''));

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

    sendChat: function (e) {
        e.preventDefault();
        var text = $('#chat-message').val();
        this.notifications.sendChat(this.currentUser.lastName, text);
        $('#chat-message').val('');

    },

    render: function () {
        this.updateState();
        this.renderUserName();
        this.renderMarketShare();
        this.renderPrices();
        this.renderCharts();

        this.renderInputs();
        this.renderChat();
    },

    updateState: function () {

        $('#main-content, .footer').show();

        if (this.model.get('current_round')[0] <= this.model.get('total_rounds')[0]) {
            $('#advance, #inputs').show();
            $('#end-of-game').hide();
        } else {
            $('#advance, #inputs').hide();
            $('#end-of-game').show();
        }
    },

    renderInputs: function () {
        $('#inputs').html(templates['inputs']({ isPriceSubmitted: this.model.isPriceSubmitted() }));
    },

    renderChat: function () {
        $('.chat-container').html(templates['chat']());
    },

    renderUserName: function () {
        var curUser = this.currentUser;

        $('.userName').text('Player ' + curUser.role + ' (' + curUser.userName + ')');
    },

    renderCharts: function () {
        this.renderCumulativeProfitChart();
        this.renderRoundProfitChart();
        this.renderCorrelationChart();
        this.renderMarketShareChart();
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
        formatter = formatter || d3.format('$,.0f');
        this.renderDataRow(table, '1', this.model.get('p1_' + field)[productIndex].map(formatter), cellClass);
        this.renderDataRow(table, '2', this.model.get('p2_' + field)[productIndex].map(formatter), cellClass);
    },

    renderProductSeparator: function (table, product) {
        $('<tr>').append($('<th>').text(product)).appendTo(table);
    },

    renderDataRow: function (table, player, data, cellClass) {
        var tr = $('<tr>');
        var curRound = this.model.get('current_round')[0];
        tr.append($('<td>').addClass('center').text(player));

        for (var j = 0; j<curRound - 1; j++) {
            var cell = $('<td>').text(data[j]);
            if (cellClass) {
                cell.addClass(cellClass);
            }

            tr.append(cell);
        }

        table.append(tr);
    },

    renderCumulativeProfitChart: function () {
        this.profitChart = this.profitChart || new Contour(_.extend({}, profitChartOptions, {
            el: '.profit-chart',
            column: {
                groupPadding: 3
            },
            tooltip: {
                formatter: function (d) {
                    return '<h5>' + moneyFormatter(d.y) + '</h5>Cumulative Profit ' + d.series + ' - ' + categories[d.x];
                }
            }
        }))
        .cartesian()
        .column()
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

    renderRoundProfitChart: function (chart, selector, dataSelector) {
        this.roundProfitChart = this.roundProfitChart || new Contour(_.merge({}, profitChartOptions, {
            el: '.round-profit-chart',
            line: {
                marker: {
                    size: 5
                }
            },
            xAxis: {
                type: 'linear'
            },
            tooltip: {
                formatter: function (d) {
                    return '<h5>' + moneyFormatter(d.y) + '</h5>Round Profit ' + d.series + ' - ' + categories[d.x];
                }
            }
        }))
        .cartesian()
        .line()
        .legend()
        .tooltip();

        var curRound = this.model.get('current_round')[0];
        var cleanSeries = function (v, i) { return i < curRound - 1 ? v : null; };
        if (curRound > 1) {
            var series = [{
                name: 'Player 1',
                data: this.model.get('p1_profit')[0].map(cleanSeries)
            }, {
                name: 'Player 2',
                data: this.model.get('p2_profit')[0].map(cleanSeries)
            }];

            this.roundProfitChart.setData(series).render();
        } else {
            this.roundProfitChart.setData([{ name: 'Player 1', data: [] }, { name: 'Player 2', data: [] }]).render();
        }
    },

    renderCorrelationChart: function () {
        var prodId = 0;
        var scale = d3.scale.sqrt().range([3, 15]);
        var _this = this;

        this.correlationChart = this.correlationChart || new Contour({
            el: '.correlation-chart',
            chart: {
                padding: {
                    right: 35
                },
                animations: {
                    duration: duration
                }
            },

            yAxis: {
                title: 'Profit',
                ticks: 5,
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
                    return '<h5>Revenue: ' + moneyFormatter(d.rev) + '</h5><h5>Profit: ' + moneyFormatter(d.y) + '</h5><h5>Market Share: ' + perFormatter(d.x) + '</h5>';
                }
            },

            scatter: {
                radius: function (d, i) {
                    var revenue = _this.model.getForCurPlayer('revenue')[0];
                    scale.domain(d3.extent(revenue));
                    return scale(revenue[i]);
                }
            }

        })
        .cartesian()
        .scatter()
        .tooltip();

        var curRound = this.model.get('current_round')[0];
        if (curRound > 1) {
            var prices = _this.model.getForCurPlayer('profit')[0];
            var data = this.model.getForCurPlayer('share')[prodId].slice(0, curRound - 1).map(function (share, round) {
                return {
                    y: prices[round],
                    x: share,
                    rev: _this.model.getForCurPlayer('revenue')[0][round]
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
    },

    renderMarketShareChart: function () {
        this.marketShareChart = this.marketShareChart || new Contour({
            el: '.market-share-chart',
            chart: {
                animations: {
                    duration: duration / 3
                }
            },
            tooltip: {
                formatter: function (d) {
                    return '<h5>Market share: ' + perFormatter(d.data.y) + '</h5>Player ' + (d.data.x + 1) + '';
                }
            }
        })
        .pie()
        .pieLegend()
        .tooltip();

        var curRound = this.model.get('current_round')[0] - 1;
        if (curRound >= 1) {
            var p1 = this.model.get('p1_share')[0][curRound - 1];
            var p2 = this.model.get('p2_share')[0][curRound - 1];
            var series = [{
                name: 'Market Share',
                data: [p1, p2]
            }];
            this.marketShareChart.setData(series).render();
        } else {
            this.marketShareChart.setData([]).render();
        }

    }
};


new App().initialize();
