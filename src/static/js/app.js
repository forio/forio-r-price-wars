'use strict';

var auth = require('services/auth');
var runManager = require('services/run-manager');


if (!auth.isLoggedIn()) {
    window.location.href = 'login.html';
} else {
    runManager.getRun();

    bindEvents();

}


function bindEvents() {
    $('#logout').on('click', function () {
        auth.logout(function () {
            window.location = 'login.html';
        });
    });
}
