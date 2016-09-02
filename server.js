var restify = require('restify');
var builder = require('botbuilder');
var http = require('http');

var port = process.env.PORT || 8080;

// Create bot
var bot = new builder.BotConnectorBot({ appId: '89548bba-9f9d-4740-8b5a-b879cda0cbb6', appSecret: 'PuheGujkkXpe1oRsJEZAUbN' });

// Setup Restify Server
var server = restify.createServer();
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());
server.listen(port, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// bot function

bot.dialog('/', new builder.IntentDialog()
    .matches(/^[tundere|つんでれ|ツンデレ]/i, '/tundere')
    .matches(/^[hello|ハロー|こんにちわ]$/i, '/hello')
    .onDefault(builder.DialogAction.send("I'm sorry. I didn't understand."))
);


dot.dialog('/hello',
    function (session) {
        session.send("こんちゃ!!");
    }
);

bot.dialog('/tundere', [
    function (session) {
        builder.Prompts.text(session, "文を書いてね！");
    },
    function (session, results) {
        session.userData.name = results.response;
        var tundereApiUrl = "http://coco.user.surume.tk/api/v1/is_tundere?";
        result = JSON.parse(httpRequest(tundereApiUrl + results.response));
        sessoin.send("ツンデレ度 : " + result.probability_class_ツンデレ);
        builder.Prompts.number(session, "" + results.response + "");
    }
]);

function httpRequest(url){
    var req = http.get(targetUrl, function(res) {
      console.log('get response');
      res.setEncoding('utf8');
      res.on('data', function(str) {
        console.log(str);
      });
    });
    req.setTimeout(1000);

    req.on('timeout', function() {
      console.log('request timed out');
      req.abort();
    });

    res.on('end', function(res) {
        return res;
    });

    req.on('error', function(err) {
      console.log("Error: " + err.code + ", " + err.message);
    });
}
