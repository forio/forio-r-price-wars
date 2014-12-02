var parts = window.location.pathname.split('/');

var curAccount = 'jaimedp';
var curProject = 'rdemo';
var model = 'marketshare.R';
var proto = /http(s)?/.test(window.location.protocol) ? window.location.protocol : 'https:';
proto = 'https:';
var host = window.location.host.match('localhost') ? proto + '//api.forio.com' : proto + '//api.' + window.location.host;

if (parts[1] === 'app') {
    curAccount = parts[2];
    curProject = parts[3];
}

module.exports = {
    root: host + '/run/' + curAccount + '/' + curProject,
    host: host,
    model: model,
    account: curAccount,
    project: curProject,
    login: 'authentication',
    sessionCookieName: 'sim-session',
    game: '/multiplayer/game',
    member: '/member/local',
    user: 'user',
    data: '/data',
    cometdBaseUrl: host + '/channel/subscribe/',
};
