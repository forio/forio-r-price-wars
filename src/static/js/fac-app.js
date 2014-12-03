'use strict';

var auth = require('services/auth');

if (!auth.isLoggedIn()) {
    window.location.href = 'login.html';
} else {
    bindEvents();
}






function bindEvents() {
    $('#logout').on('click', function () {
        auth.logout(function () {
            window.location = 'login.html';
        });
    });
}
