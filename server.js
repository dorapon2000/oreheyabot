var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');
var FeedParser = require('feedparser');

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
                            .text('Hello everyone!');
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
                        .text('Goodbye');
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
                .text('Hello %s... Thanks for adding me. Say "hello" to see some great demos.', name || 'there');
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
    .matches(/^(weather|tenki|天気|てんき)$/i, '/weather')
    .matches(/^bmi$/i,'/bmi')
    .matches(/^(karapaia|カラパイア|からぱいあ)$/i, '/karapaia')
    .matches(/^(zaeega|ザイーガ|ザイーガ)$/i, '/zaeega')
);


bot.dialog('/hello',
    function (session) {
        session.send('こんちゃ!!');
        session.endDialog();
    }
);

bot.dialog('/tundere', [
    function (session) {
        builder.Prompts.text(session, '[ツンデレ判定] 文を書いてね！');
    },
    function (session, results) {
        var options = {
            url: 'http://coco.user.surume.tk/api/v1/is_tundere',
            qs: {text: results.response},
            json: true
        };

        request.get(options, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var judge = body.status ? 'ツンデレ' : 'ツンデレじゃない';
                session.send('判定 : %s',judge);
            } else {
                console.log('error: '+ response.statusCode);
                session.send('error: %d', response.statusCode);
            }
            session.endDialog();
        });
    }
]);

bot.dialog('/bmi',[
    function (session) {
        builder.Prompts.text(session, '[BMI] 身長(cm)を入力してね！');
    },
    function (session, results) {
        session.userData.height = results.response;
        builder.Prompts.text(session, '[BMI] 体重(kg)を入力してね！');
    },
    function (session, results) {
        session.userData.weight = results.response;
        var bmi = session.userData.weight / Math.pow(session.userData.height/100.0, 2);
        var best_weight = Math.pow(session.userData.height/100.0, 2) * 22;
        var advice = (function() {
            if (bmi < 16) return '痩せすぎだよ';
            else if (16 <= bmi && bmi < 17) return '痩せてるね！';
            else if (17 <= bmi && bmi < 18.5) return '痩せ気味かな';
            else if (18.5 <= bmi && bmi < 25) return '普通体重だ！やったね！';
            else if (25 <= bmi && bmi < 30) return '太り気味かな';
            else if (30 <= bmi && bmi < 35) return '太り過ぎだよ - 肥満(1度)';
            else if (35 <= bmi && bmi < 40) return '治療対象だよ - 肥満(2度)';
            else return '治療対象だよ - 肥満(3度)';
        })();
        session.send('[BMI]\n\nBMIは %.1f\n\n適正体重は %.1f\n\n%s', bmi, best_weight ,advice);
        session.endDialog();
    }
]);

bot.dialog('/weather', [
    function (session) {
        builder.Prompts.text(session, '[天気予報] 地域を選んでね\n\n' +
                                      '静岡 = {浜松, 静岡}\n\n' +
                                      '愛知 = {名古屋}\n\n' +
                                      '茨城 = {土浦}\n\n' +
                                      '東京 = {東京}'
                            );
    },
    function (session, results) {
        var locationTable = {
            '浜松': '220040',
            'hamaamtu': '220040',
            '静岡': '220010',
            'sizuoka': '220010',
            '名古屋': '230010',
            'nagoya': '230010',
            '土浦': '080020',
            'tutiura': '080020',
            '東京': '130010',
            'toukyou': '130010'
        };
        var options = {
            url: 'http://weather.livedoor.com/forecast/webservice/json/v1',
            qs: {city: locationTable[results.response]},
            json: true
        };

        request.get(options, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var publicOclock = (body.publicTime).slice(11,13);
                var publicMonth = (body.publicTime).slice(5,7);
                var publicDay = (body.publicTime).slice(8,10);
                session.send('[天気予報]\n\n' +
                             '%s (%d/%d %d時 時点)\n\n' + // タイトル (予報時刻)
                             '%s\n\n' + // リンクURL
                             '%s : %s\n\n' + // 今日 : 晴れ
                             '%s : %s\n\n' + // 明日 : 雨
                             '---\n\n' +
                             '%s',// copyright
                             body.title,
                             publicMonth,
                             publicDay,
                             publicOclock,
                             body.link,
                             body.forecasts[0].dateLabel,
                             body.forecasts[0].telop,
                             body.forecasts[1].dateLabel,
                             body.forecasts[1].telop,
                             body.copyright.title);
            } else {
                console.log('error: '+ response.statusCode);
                sessino.send('status: %d',response.statusCode);
            }
            session.endDialog();
        });
    }

]);

bot.dialog('/karapaia', function (session) {
    rssUrl = 'http://karapaia.livedoor.biz/index.rdf';

    fetchRss(rssUrl,
              function (dateStr) {
                  var monthTable = {
                      'Jan' : '01',
                      'Feb' : '02',
                      'Mar' : '03',
                      'Apr' : '04',
                      'May' : '05',
                      'Jun' : '06',
                      'Jul' : '07',
                      'Aug' : '08',
                      'Sep' : '09',
                      'Oct' : '10',
                      'Nov' : '11',
                      'Dec' : '12'
                  };
                  var month = monthTable[dateStr.slice(4,7)];
                  var day = dateStr.slice(8,10);
                  var oclock = dateStr.slice(16,18);
                  var minutes = dateStr.slice(19,21);
                  return month + '/' + day + ' ' + oclock + ':' + minutes;
              },
              function (text) {
                  session.send(text);
              }
    );

    session.endDialog();
});

bot.dialog('/zaeega', function (session) {
    rssUrl = 'http://www.zaeega.com/index.rdf';

    fetchRss(rssUrl,
              function (dateStr) {
                  var monthTable = {
                      'Jan' : '01',
                      'Feb' : '02',
                      'Mar' : '03',
                      'Apr' : '04',
                      'May' : '05',
                      'Jun' : '06',
                      'Jul' : '07',
                      'Aug' : '08',
                      'Sep' : '09',
                      'Oct' : '10',
                      'Nov' : '11',
                      'Dec' : '12'
                  };
                  var month = monthTable[dateStr.slice(4,7)];
                  var day = dateStr.slice(8,10);
                  var oclock = dateStr.slice(16,18);
                  var minutes = dateStr.slice(19,21);
                  return month + '/' + day + ' ' + oclock + ':' + minutes;
              },
              function (text) {
                  session.send(text);
              }
    );

    session.endDialog();
});

function fetchRss(rssUrl, parseDate, callback) {
    var req = request(rssUrl);
    var feedparser = new FeedParser();
    var meta;
    var articleList = [];

    req.on('error', function (error) {
        session.send('[更新情報] HTTPリクエストエラー。管理者に連絡してね。');
    });
    req.on('response', function (res) {
        var stream = this;
        if (res.statusCode !== 200) {
            return this.emit('error', new Error('Bad status code'));
        }
        stream.pipe(feedparser);
    });

    feedparser.on('error', function(error) {
        session.send('[更新情報] RSSパースエラー。管理者に連絡してね。');
        console.log(error);
    });
    feedparser.on('readable', function() {
        // metaプロパティはfeedeparserインスタンスのコンテキストに常に置き換える
        var stream = this;
        meta = this.meta;
        var item;
        while (null !== (item = stream.read())) {
            articleList.push({'title': item.title, 'pubdate': item.pubdate, 'link': item.link});
        }
    });
    feedparser.on('end', function() {
        var text = '[更新情報] ' + meta.title + '\n\n' +
                    (function() {
                        var articles = '';
                        for (var i = 0; i < Math.min(5, articleList.length); i++) {
                            articles += '[' + parseDate(articleList[i].pubdate + '') +'] ' + articleList[i].title + '\n\n' +
                            articleList[i].link + '\n\n' +
                            '--\n\n';
                        }
                        return articles;
                    }());
        callback(text);
    });
}
