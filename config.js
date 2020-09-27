let config = {};

config.twitch = {};
config.app = {};
//DO NOT TOUCH ANYTHING ABOVE THIS LINE

config.twitch.clientid = 'YOUR TWITCH APP CLIENT ID HERE';
config.twitch.clientsecret = 'YOUR TWITCH APP CLIENT SECRET HERE';
config.twitch.game = '488552'; //The game ID internally in Twitch. Overwatch is 488552, Valorant is 516575. You can specify any game you would like.

config.app.useMultipleAccounts = false; //Doesnt do anything right now
config.app.collectChannelPoints = true;
config.app.refreshRate = 15; //In minutes
config.app.dropsOnly = true; //Doesnt do anything right now
config.app.fallback = true; //Doesnt do anything right now

module.exports = config; //DO NOT TOUCH THIS LINE