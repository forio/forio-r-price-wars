'use strict';

var auth = require('services/auth');
var runManager = require('services/run-manager');
var templates = require('templates');

function App() {
}

App.prototype = {
    template: templates['market-share'],

    initialize: function () {
        if (!auth.isLoggedIn()) {
            window.location.href = 'login.html';
        } else {
            runManager.getRun();

            this.bindEvents();
        }

        return this;
    },

    bindEvents: function () {
        $('#logout').on('click', function () {
            auth.logout().then(function () {
                window.location = 'login.html';
            });
        });
    },

    render: function () {
        $('.market-share').html(this.template());
    }
};


new App().initialize().render();
