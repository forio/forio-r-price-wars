'use strict';

var auth = require('./services/auth');

var setError = function (msg) {
    $('.error-msg')
        .text(msg)
        .show(50);
};

var clearError = function () {
    $('.error-msg').hide(50);
};

var onLoginSuccess = function (userObject) {
    var target = 'index.html';

    if (userObject.isFacilitator) {
        target = 'facilitator.html';
    }

    window.location.href = target;
};

var onLoginFailed = function () {
    setError('Login Failed. Incorrect user name or password');
    $('#login').removeAttr('disabled').removeClass('disabled');
};


$('#login').on('click', function () {
    var userName = $('#username').val();
    var pass = $('#password').val();
    $('#login').attr('disabled', 'disabled').addClass('disabled');

    clearError();

    auth.login(userName, pass)
        .then(onLoginSuccess)
        .fail(onLoginFailed);
});

