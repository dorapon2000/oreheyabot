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
bot.beginDialogAction('help', '/help', { matches: /^(help|ヘルプ|コマンド)/i });

//=========================================================
// Bots Dialogs
//=========================================================

/**
 * コマンドの説明
 */
bot.dialog('/help', function(session) {
    text = '[コマンド一覧]\n\n' +
           'ハロー : 挨拶を返してくれる\n\n' +
           'ツンデレ : ツンデレ判定機能(休止中)\n\n' +
           '天気 : 天気予報\n\n' +
           'bmi : BMIを計算\n\n' +
           'カラパイア : サイト「カラパイア」の最新記事を5つ表示\n\n' +
           'アニメ or 今期 : 今期アニメ一覧の画像を表示\n\n' +
           '次期 : 次期アニメ一覧の画像を表示\n\n' +
           '前期 : 前期アニメ一覧の画像を表示\n\n' +
           '漢検 : 漢字読み問題\n\n' +
           'クイズ : ウルトラクイズ3択\n\n' +
           '--\n\n' +
           'まだまだ機能は追加予定。欲しい機能があれば管理者まで。';
    session.send(text);
    session.endDialog();
});

bot.dialog('/', new builder.IntentDialog()
    .matches(/^(tundere|ツンデレ|つんでれ)$/i, '/tundere')
    .matches(/^(hello|ハロー|こんにちわ)/i, '/hello')
    .matches(/^(weather|tenki|天気|てんき)$/i, '/weather')
    .matches(/^bmi$/i,'/bmi')
    .matches(/^(karapaia|カラパイア|からぱいあ)$/i, '/karapaia')
    .matches(/^(zaeega|ザイーガ|ざいーが)$/i, '/zaeega')
    .matches(/^(anime|アニメ|あにめ|konki|今期|こんき)(アニメ|あにめ|anime)?$/, '/konki')
    .matches(/^(jiki|giki|次期|じき)(アニメ|あにめ|anime)?$/, '/jiki')
    .matches(/^(zenki|前期|ぜんき)(アニメ|あにめ|anime)?$/, '/zenki')
    .matches(/^(oekaki|お絵かき|おえかき)$/i, '/oekaki')
    .matches(/^(kanken|漢検)$/i, '/kanken')
    .matches(/^(quiz|kuizu|クイズ|くいず)$/i, '/ultraquiz')
);

/**
 *  てとらちゃんが挨拶してくれるだけ
 */
bot.dialog('/hello',
    function (session) {
        session.send('こんちゃ!!');
        session.endDialog();
    }
);

/**
 * ツンデレAPIを介して入力された文がツンデレかどうか判定する。
 * API廃止
 * @link http://qiita.com/temperance/items/557ee72231979b840ca5
 */
// bot.dialog('/tundere', [
//     function (session) {
//         builder.Prompts.text(session, '[ツンデレ判定] 文を書いてね！');
//     },
//     function (session, results) {
//         var options = {
//             url: 'http://coco.user.surume.tk/api/v1/is_tundere/' + encodeURIComponent(results.response),
//             json: true
//         };
//
//         request.get(options, function (error, response, body) {
//             if (!error && response.statusCode === 200) {
//                 var judge = body.status === 'tundere' ? 'ツンデレ' : 'ツンデレじゃない';
//                 session.send('判定 : %s',judge);
//             } else {
//                 console.log('error: '+ response.statusCode);
//                 session.send('[ツンデレ判定] %d 管理者に連絡してね。', response.statusCode);
//             }
//             session.endDialog();
//         });
//     }
// ]);

/**
 * BMIを計算する。
 */
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

/**
 * 選択した地域の天気予報を天気予報APIを介して表示する。
 * @link http://weather.livedoor.com/weather_hacks/webservice
 */
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
            'hamamatu': '220040',
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

/**
 * 要望で「カラパイア」の最新記事5つを表示。
 * RSSをパースしている。
 */
bot.dialog('/karapaia', function (session) {
    var rssUrl = 'http://karapaia.livedoor.biz/index.rdf';
    fetchRss(rssUrl, function (text) {session.send(text);});

    session.endDialog();
});

/**
 * 要望で「ザイーガ」の最新記事5つを表示。
 * カラパイアと同じ。
 */
bot.dialog('/zaeega', function (session) {
    var rssUrl = 'http://www.zaeega.com/index.rdf';
    fetchRss(rssUrl, function (text) {session.send(text);});

    session.endDialog();
});

/**
 * 今期アニメ一覧の画像をudurainfoさんから拝借して表示する。
 * スクレイピングはcheerio-httpcliを使用。
 * @link http://qiita.com/ktty1220/items/e9e42247ede476d04ce2 cheerio-httpcli
 *
 * TODO
 *  - 今期、次期、前期は取得できるがもっと幅広く習得できるようにしたい。
 *  - getUdurainfoUrlは既に対応している。
 */
bot.dialog('/konki', function (session) {
    var siteUrl = getUdurainfoUrl(0);
    session.send(siteUrl);

    var client = require('cheerio-httpcli');
    client.fetch(siteUrl,function (error, $, response, body){
        if (error) {
            console.log(error);
            return;
        }

        imgUrl = 'http://uzurainfo.han-be.com/' + $('img').attr('src');
        var imgMsg = new builder.Message(session)
        .attachments([{
            contentType: 'image/jpeg',
            contentUrl: imgUrl
        }]);
        session.send(imgMsg);
    });

    session.endDialog();
});

/**
 * 次期アニメ版。
 *
 * TODO
 * ほぼ今期アニメと同じ構造になっているが、なんとかできないか。
 */
bot.dialog('/jiki', function (session) {
    var siteUrl = getUdurainfoUrl(1);
    session.send(siteUrl);

    var client = require('cheerio-httpcli');
    client.fetch(siteUrl,function (error, $, response, body){
        if (error) {
            console.log(error);
            return;
        }

        imgUrl = 'http://uzurainfo.han-be.com/' + $('img').attr('src');
        var imgMsg = new builder.Message(session)
        .attachments([{
            contentType: 'image/jpeg',
            contentUrl: imgUrl
        }]);
        session.send(imgMsg);
    });

    session.endDialog();
});

/**
 * 前期アニメ版。
 *
 * TODO
 * ほぼ今期アニメと同じ構造になっているが、なんとかできないか。
 */
bot.dialog('/zenki', function (session) {
    var siteUrl = getUdurainfoUrl(-1);
    session.send(siteUrl);

    var client = require('cheerio-httpcli');
    client.fetch(siteUrl,function (error, $, response, body){
        if (error) {
            console.log(error);
            return;
        }

        imgUrl = 'http://uzurainfo.han-be.com/' + $('img').attr('src');
        var imgMsg = new builder.Message(session)
        .attachments([{
            contentType: 'image/jpeg',
            contentUrl: imgUrl
        }]);
        session.send(imgMsg);
    });

    session.endDialog();
});

/**
 * お絵かきURLを張る
 */
bot.dialog('/oekaki', function (session) {
    session.send('http://casual.hangame.co.jp/oekaki/');
    session.endDialog();
});

/**
 * udurainfoからアニメ一覧画像のURLを取得する。
 * periodは時期の意。
 *
 * @param  {number} relativePeriod  - 0なら今期、-1なら前期、1なら次期の画像を取得。それ以上も可。
 * @return {string}                 - アニメ一覧画像のURL。
 */
function getUdurainfoUrl(relativePeriod) {
    var periodCodeTable = {
        0: 'w',
        1: 'sp',
        2: 'sm',
        3: 'a'
    };
    var d = new Date();

    var currentYear = (d.getFullYear() + '').slice(-2);
    var currentPeriod = Math.floor(d.getMonth() / 3);
    var period = (currentPeriod + relativePeriod) % 4;
    var year = parseInt(currentYear) + (Math.floor((currentPeriod + relativePeriod) / 4));
    var periodCode = periodCodeTable[period];
    return  'http://uzurainfo.han-be.com/' + year + periodCode + '.html';
}

/**
 * RSSから最新記事5つを取得する。
 * @link https://github.com/danmactough/node-feedparser/blob/master/examples/compressed.js feedparser
 *
 * @param  {string}   rssUrl    - 取得するRSSのURL
 * @param  {Function} callback  - 取得後にcallback関数で表示することを想定している。
 * @return {void}
 */
function fetchRss(rssUrl, callback) {
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

        /**
         * 記事の投稿日時を'mm/yy hh:mi'と簡易的なものに変換する。
         *
         * @param  {string} dateStr     - Date型になる文字列
         * @return {string} mmddhhmi    - mm/yy hh:mi形式にした日時
         */
        function parseDate(dateStr) {
            var date = new Date(dateStr);
            var mmddhhmi = ('0'+(date.getMonth()+1)).slice(-2) + '/'  + ('0'+date.getDate()).slice(-2) + ' ' +
                           ('0'+date.getHours()).slice(-2) + ':' + ('0'+date.getMinutes()).slice(-2);
            return mmddhhmi;
        }
    });
}


/**
 * 漢字の読み問題を出題する
 *
 *
 */
bot.dialog('/kanken',[
    function (session) {
        var dataList = csv2Array('data/kanjiyomi.csv');
        var questionList = [];

        QUESTION_NUM = 5;
        for (var i = 0; i < QUESTION_NUM; i++) {
            var rand = Math.floor( Math.random() * dataList.length );
            questionList.push(dataList[rand]);
        }
        session.dialogData.questions = questionList.concat(); //concatは配列のコピーに使ってる
        session.dialogData.rightNum = 0;

        builder.Prompts.text(session, '[1問目] ' + session.dialogData.questions[0].kanji);
    },
    function (session, results) {
        var resultMsg;
        if (results.response == session.dialogData.questions[0].yomi ) {
            resultMsg = '[答え] あたり！';
            session.dialogData.rightNum++;
        } else
            resultMsg = '[答え] ' + session.dialogData.questions[0].yomi;
        session.send(resultMsg);

        builder.Prompts.text(session, '[2問目] ' + session.dialogData.questions[1].kanji);
    },
    function (session, results) {
        var resultMsg;
        if (results.response == session.dialogData.questions[1].yomi ) {
            resultMsg = '[答え] あたり！';
            session.dialogData.rightNum++;
        } else
            resultMsg = '[答え] ' + session.dialogData.questions[1].yomi;
        session.send(resultMsg);

        builder.Prompts.text(session, '[3問目] ' + session.dialogData.questions[2].kanji);
    },
    function (session, results) {
        var resultMsg;
        if (results.response == session.dialogData.questions[2].yomi ) {
            resultMsg = '[答え] あたり！';
            session.dialogData.rightNum++;
        } else
            resultMsg = '[答え] ' + session.dialogData.questions[2].yomi;
        session.send(resultMsg);

        builder.Prompts.text(session, '[4問目]' + session.dialogData.questions[3].kanji);
    },
    function (session, results) {
        var resultMsg;
        if (results.response == session.dialogData.questions[3].yomi ) {
            resultMsg = '[答え] あたり！';
            session.dialogData.rightNum++;
        } else
            resultMsg = '[答え] ' + session.dialogData.questions[3].yomi;
        session.send(resultMsg);

        builder.Prompts.text(session, '[5問目]' + session.dialogData.questions[4].kanji);
    },
    function (session, results) {
        var resultMsg;
        if (results.response == session.dialogData.questions[4].yomi ) {
            resultMsg = '[答え] あたり！';
            session.dialogData.rightNum++;
        } else
            resultMsg = '[答え] ' + session.dialogData.questions[4].yomi;
        session.send(resultMsg);

        session.send('[結果] ' + session.dialogData.rightNum + ' 問正解!!');
        session.endDialog();
    }
]).endConversationAction('endKanken','中止',{
    matches: /^(stop|cancel|中止|終了|終わり|キャンセル)$/i,
});


/**
 * ウルトラクイズの問題を出題する
 *
 *
 */
bot.dialog('/ultraquiz',[
    function (session) {
        var dataList = csv2Array('data/ultraquizdata.csv');
        var questionList = [];

        QUESTION_NUM = 5;
        for (var i = 0; i < QUESTION_NUM; i++) {
            var rand = Math.floor( Math.random() * dataList.length );
            questionList.push(dataList[rand]);
        }
        session.dialogData.questions = questionList.concat(); //concatは配列のコピーに使ってる
        session.dialogData.rightNum = 0;

        var q = session.dialogData.questions;

        builder.Prompts.choice(session,
            '[1問目] ' + q[0].question,
            [q[0].c1, q[0].c2, q[0].c3],
            builder.ListStyle.button);
    },
    function (session, results) {
        var q = session.dialogData.questions;

        var resultMsg;
        if (results.response.entity == q[0].anser ) {
            resultMsg = '[答え] あたり！';
            session.dialogData.rightNum++;
        } else
            resultMsg = '[答え] ' + q[0].anser;
        session.send(resultMsg);

        builder.Prompts.choice(session,
            '[2問目] ' + q[1].question,
            [q[1].c1, q[1].c2, q[1].c3],
            builder.ListStyle.button);
    },
    function (session, results) {
        var q = session.dialogData.questions;

        var resultMsg;
        if (results.response.entity == q[1].anser ) {
            resultMsg = '[答え] あたり！';
            session.dialogData.rightNum++;
        } else
            resultMsg = '[答え] ' + q[1].anser;
        session.send(resultMsg);

        builder.Prompts.choice(session,
            '[3問目] ' + q[2].question,
            [q[2].c1, q[2].c2, q[2].c3],
            builder.ListStyle.button);
    },
    function (session, results) {
        var q = session.dialogData.questions;

        var resultMsg;
        if (results.response.entity == q[2].anser ) {
            resultMsg = '[答え] あたり！';
            session.dialogData.rightNum++;
        } else
            resultMsg = '[答え] ' + q[2].anser;
        session.send(resultMsg);

        builder.Prompts.choice(session,
            '[4問目] ' + q[3].question,
            [q[3].c1, q[3].c2, q[3].c3],
            builder.ListStyle.button);
    },
    function (session, results) {
        var q = session.dialogData.questions;

        var resultMsg;
        if (results.response.entity == q[3].anser ) {
            resultMsg = '[答え] あたり！';
            session.dialogData.rightNum++;
        } else
            resultMsg = '[答え] ' + q[3].anser;
        session.send(resultMsg);

        builder.Prompts.choice(session,
            '[5問目] ' + q[4].question,
            [q[4].c1, q[4].c2, q[4].c3],
            builder.ListStyle.button);
    },
    function (session, results) {
        var q = session.dialogData.questions;

        var resultMsg;
        if (results.response.entity == q[4].anser ) {
            resultMsg = '[答え] あたり！';
            session.dialogData.rightNum++;
        } else
            resultMsg = '[答え] ' + q[4].anser;
        session.send(resultMsg);

        session.send('[結果] ' + session.dialogData.rightNum + ' 問正解!!');
        session.endDialog();
    }
]).endConversationAction('endKanken','中止',{
    matches: /^(stop|cancel|中止|終了|終わり|キャンセル)$/i,
});

/**
 * CSVファイルを読み込む関数
 *
 * @link
 * http://qiita.com/tag1216/items/5a5253de7e1377a24c89
 * https://github.com/d3/d3-dsv/blob/master/README.md#csvParse
 */
var fs = require('fs');
var d3 = require('d3');
function csv2Array(filePath){
    var csv_text = fs.readFileSync(filePath, 'utf-8');
    var csv = d3.csvParse(csv_text);
    return csv;
}
