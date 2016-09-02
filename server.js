var restify = require('restify');
var builder = require('botbuilder');

var port = process.env.PORT || 8080;

// Create bot and add dialogs
var bot = new builder.BotConnectorBot({ appId: '89548bba-9f9d-4740-8b5a-b879cda0cbb6', appSecret: 'PuheGujkkXpe1oRsJEZAUbN' });
bot.add('/', function (session) {
   session.send('Hello World');
});

// Setup Restify Server
var server = restify.createServer();
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());
server.listen(port, function () {
   console.log('%s listening to %s', server.name, server.url);
});
