var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');

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
    .matches(/^(tundere|ツンデレ|つんでれ)$/i, '/tundere')
    .matches(/^(hello|ハロー|こんにちわ)/i, '/hello')
    .matches(/^bmi$/i,'bmi')
);


bot.dialog('/hello',
    function (session) {
        session.send("こんちゃ!!");
        session.endDialog();
    }
);

bot.dialog('/tundere', [
    function (session) {
        builder.Prompts.text(session, "[ツンデレ判定] 文を書いてね！");
    },
    function (session, results) {
        var options = {
            url: 'http://coco.user.surume.tk/api/v1/is_tundere',
            qs: {text: results.response},
            json: true
        };

        request.get(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var judge = body.status ? "ツンデレ" : "ツンデレじゃない";
                session.send("判定 : %s",judge);
            } else {
                console.log('error: '+ response.statusCode);
            }
            session.endDialog();
        });
    }
]);

bot.dialog('bmi',[
    function (session) {
        builder.Prompts.text(session, "[BMI] 身長(cm)を入力してね！");
    },
    function (session, results) {
        session.userData.height = results.response;
        builder.Prompts.text(session, "[BMI] 体重(kg)を入力してね！");
    },
    function (session, results) {
        session.userData.weight = results.response;
        var bmi = session.userData.weight / Math.pow(session.userData.height/100.0, 2);
        var best_weight = Math.pow(session.userData.height/100.0, 2) * 22;
        var advice = (function() {
            if (bmi < 16) return "痩せすぎだよ";
            else if (16 <= bmi && bmi < 17) return "痩せてるね！";
            else if (17 <= bmi && bmi < 18.5) return "痩せ気味かな";
            else if (18.5 <= bmi && bmi < 25) return "普通体重だ！やったね！";
            else if (25 <= bmi && bmi < 30) return "太り気味かな";
            else if (30 <= bmi && bmi < 35) return "治療対象だよ - 肥満(1度)";
            else if (35 <= bmi && bmi < 40) return "治療対象だよ - 肥満(2度)";
            else return "治療対象だよ - 肥満(3度)";
        })();
        session.send("[BMI]\n\nBMIは %.1f\n\n適正体重は %.1f\n\n%s", bmi, best_weight ,advice);
        session.endDialog();
    }
]);
