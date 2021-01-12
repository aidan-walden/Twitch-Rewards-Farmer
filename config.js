let config = {};

config.twitch = {};
config.app = {};
//DO NOT TOUCH ANYTHING ABOVE THIS LINE

config.twitch.clientid = 'YOUR TWITCH APP CLIENT ID HERE';
config.twitch.clientsecret = 'YOUR TWITCH APP CLIENT SECRET HERE';
config.twitch.game = '488552'; //The game ID internally in Twitch. Overwatch is 488552, Valorant is 516575, Rust is 263490. You can specify any game you would like.

config.app.useMultipleAccounts = false; //Does nothing currently
config.app.collectChannelPoints = true;
config.app.refreshRate = 15; //In minutes
config.app.dropsOnly = true; //Does nothing currently
config.app.fallback = true; //Does nothing currently

module.exports = config; //DO NOT TOUCH THIS LINE