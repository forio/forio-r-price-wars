'use strict';

module.exports = function () {
    var cometd = $.cometd;

    var activeChannels = {}; // {channelId: [subsObj1, subsObj2]
    var subscriptions = {}; // {<subsid>: [fn1, fn2]

    var isConnected = false; //Flag showing status of connection;
    var isInitialized = false;

    var connectionSucceeded = function (message, callback) {
        // console.log("F.Comet: connection success", message, callback)
        //Unsubscribe older events and resubscribe them
        //TODO: why do i have to do this and not the lib?
        //TODO: why not do _clearSubscriptions(); That's being called during handshake anyway? or clearSubscriptions & clearListeners
        cometd.batch(function () {
            var channelSubscriptions;
            var channel;
            var subscription;
            var thissubs;

            for (channel in activeChannels) {
                if (activeChannels.hasOwnProperty(channel)) {
                    channelSubscriptions = activeChannels[channel];
                    for (subscription in channelSubscriptions) {
                        if (channelSubscriptions.hasOwnProperty(subscription)) {
                            thissubs = channelSubscriptions[subscription];
                            cometd.unsubscribe(thissubs);
                        }
                    }
                }
            }

            for (channel in activeChannels) {
                if (activeChannels.hasOwnProperty(channel)) {
                    channelSubscriptions = activeChannels[channel];
                    for (subscription in channelSubscriptions) {
                        if (channelSubscriptions.hasOwnProperty(subscription)) {
                            thissubs = channelSubscriptions[subscription];

                            var subsFns = subscriptions[thissubs];
                            for (var fn in subsFns) {
                                if (subsFns.hasOwnProperty(fn)) {
                                    var thisFn = subsFns[fn];
                                    cometd.subscribe(channel, thisFn);
                                }
                            }
                        }
                    }
                }
            }

            isInitialized = true;
        });

        callback(message);
    };

    var connectionBroken = function (message, callback) {
        callback(message);
    };

    // Disconnect when the page unloads
    $(window).unload(function () {
        if (cometd) {
            cometd.disconnect();
        }
        isInitialized = false;
    });

    return {
        //connectEvent
        subscribe: function (channel, handler) {
            var thissub = cometd.subscribe(channel, handler);

            //Add to channels
            var subs = (activeChannels[channel]) || [];
            if (!_.contains(thissub, subs)) {
                subs.push(thissub);
            }
            activeChannels[channel] = subs;

            //Add handler to subs
            var handlers =  (subscriptions[thissub]) || [];
            if (!_.contains(handler, handlers)) {
                handlers.push(handler);
            }
            subscriptions[thissub] = handlers;
        },
        /** Send message on channel
         *
         * @param {Object} channel
         * @param {Object} message
         */
        publish: function (channel, message) {
            cometd.publish(channel, message);
        },

        /** Intialize connection to server and handshake
         * @param {string} cometURL - URL of comet server
         * @param {object} options
         */
        init: function (cometURL, options, cometOptions) {
            //console.log("F.comet.init", cometURL, options, cometOptions);
            //var cometURL = "http://channel1.forio.com/cometd/";
            if (!cometURL){
                throw new Error('F.Comet: No URL provided');
            }

            //TODO: Document this with the default fns from the lib
            var defaultCometOptions = {
                url: cometURL,
                logLevel: 'info'
            };

            $.extend(defaultCometOptions, cometOptions);

            var defaults = {
                /** Connection success handler
                 * @config onConnect
                 * @type Function
                 */
                onConnect: $.noop,

                /** Connection failure handler
                 * @config onConnect
                 * @type Function
                 */
                onDisconnect: $.noop
            };

            $.extend(defaults, options);

            cometd.configure(defaultCometOptions);

            /* /meta/connect is a bayeux-defined comet channel
             * Use to listen for error messages from server. E.g: Network error
             */
            cometd.addListener('/meta/connect', function (message) {
                var wasConnected = isConnected;
                isConnected = (message.successful === true);
                if (!wasConnected && isConnected){ //Connecting for the first time
                    connectionSucceeded(message, defaults.onConnect);
                } else if (wasConnected && !isConnected) {
                    connectionBroken(message, defaults.onDisconnect);
                }
            });

            /* Service channels are for request-response type commn.
             *
             */
//           cometd.addListener('/meta/connect', function(message){
//          });
//
            cometd.handshake();
        }
    };
};
