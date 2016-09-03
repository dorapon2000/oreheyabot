var restify = require('restify');
var builder = require('botbuilder');
var http = require('http');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());


//=========================================================
// Activity Events
//=========================================================

bot.on('conversationUpdate', function (message) {
   // Check for group conversations
    if (message.address.conversation.isGroup) {
        // Send a hello message when bot is added
        if (message.membersAdded) {
            message.membersAdded.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                            .address(message.address)
                            .text("Hello everyone!");
                    bot.send(reply);
                }
            });
        }

        // Send a goodbye message when bot is removed
        if (message.membersRemoved) {
            message.membersRemoved.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                        .address(message.address)
                        .text("Goodbye");
                    bot.send(reply);
                }
            });
        }
    }
});

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
                .address(message.address)
                .text("Hello %s... Thanks for adding me. Say 'hello' to see some great demos.", name || 'there');
        bot.send(reply);
    } else {
        // delete their data
    }
});

bot.on('deleteUserData', function (message) {
    // User asked to delete their data
});


//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^goodbye/i });
bot.beginDialogAction('help', '/help', { matches: /^help/i });

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', new builder.IntentDialog()
    .matches(/^(tundere|つんでれ|ツンデレ)/i, '/tundere')
    .matches(/^(hello|ハロー|こんにちわ)$/i, '/hello')
    .onDefault(builder.DialogAction.send("I'm sorry. I didn't understand."))
);


bot.dialog('/hello',
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
        sessoin.send("ツンデレ度 : " + result.probability_class_1);
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
