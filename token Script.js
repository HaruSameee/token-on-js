(function() {
    'use strict';
    //--------------------------------------------------
    function copy(str, useExecCommand) { // 文字列をクリップボードにコピーする
        if (!useExecCommand && typeof navigator === "object" && typeof navigator.clipboard === "object" &&
            typeof location === "object" && location.protocol === "https:") navigator.clipboard.writeText(str).catch(function() {
            copy(str, true);
        });
        else {
            var e = $("<textarea>").val(str).appendTo(h).select();
            document.execCommand("copy");
            e.remove();
        };
    };

    function makeSpan(html, back, color, radius) { // 装飾用のspanタグを作成する
        return '<span style="' + [
            "word-wrap: break-word; ",
            back === undefined ? "" : "background-color: " + back + "; ",
            color === undefined ? "" : "color: " + color + "; ",
            "border-radius: " + (radius === undefined ? "5" : radius) + "px;"
        ].join("") + '">' + (typeof html === "object" ? html.join("<br>") : html) + "</span>";
    };

    function splitLine(str) { // 行ごとに分割して空行を排除して返す
        return str.split("\n").filter(function(v) {
            return v.length > 0;
        });
    };

    function initInterval(num) { // リクエスト送信間隔を初期化する
        return (!isFinite(num) || isNaN(num) || num < 0.01) ? 0.01 : num;
    };

    function makeDelay(delay, i, o, len) { // 遅延を計算する
        return (i + (o === undefined ? 0 : o) * (len === undefined ? 0 : len)) * initInterval(Number(delay)) * 1000;
    };

    function disabledElement(elm, bool) { // 子孫要素のdisabled属性を設定する
        return elm.find("*").each(function(i, e) {
            e.disabled = !!bool;
        });
    };

    function outputLog(elm, str, ip_flag, textonly) { // ログを出力する
        var standardText = ((!textonly ? "[" + new Date().toString().match(/[0-9]{2}:[0-9]{2}:[0-9]{2}/)[0] + "]" : "") + str);
        if (!ip_flag) elm.val([standardText].concat(splitLine(elm.val())).join("\n")).trigger("updatetextarea");
        else $.get("https://ipinfo.io/?callback=a").always(function(body, statusText, data) {
            elm.val([(statusText === "success" ? "<" + JSON.parse(body.match(/\{.*?\}/)[0]).ip + ">" : "") + standardText].concat(splitLine(elm.val())).join("\n")).trigger("updatetextarea");
        });
        return elm;
    };

    function addBtn(h, title, func) { // ボタンを追加する
        return $("<button>").text(title).on("click", func).appendTo(h);
    };

    function addInputBool(h, title, func) { // ON/OFFボタンを追加する
        var flag = false,
            e = addBtn(h, title),
            check = $("<input>", {
                type: "checkbox"
            }).prependTo(e.on("click", function() {
                flag = !flag;
                check.prop("checked", flag);
                e.css("background-color", flag ? "orange" : "gray");
                if (typeof func === "function") func(flag);
            }).css("background-color", "gray"));
        return e;
    };

    function addInput(h, title, placeholder) { // 入力欄を追加する
        return $("<input>", {
            placeholder: placeholder
        }).appendTo($("<div>").text(title + ": ").appendTo(h));
    };

    function addTextarea(h, placeholder, readonly) { // テキストエリアを追加する
        var e = $("<textarea>", {
            placeholder: placeholder,
            readonly: !!readonly
        }).css({
            width: "80%",
            maxWidth: "80%",
            height: "3em"
        }).appendTo(h);
        (function(resize) {
            e.on("change click updatetextarea", resize).trigger("updatetextarea");
            if (!!readonly) e.css({
                backgroundColor: "#e9e9e9",
                tabIndex: "-1",
                cursor: "pointer"
            }).on("click", function() {
                copy(e.val());
                e.select();
            });
        })(function() { // resize
            var placeholderLine = e.attr("placeholder").split("\n").length,
                line = e.val().split("\n").length;
            e.height((placeholderLine > line && e.val().length === 0 ? placeholderLine : line + 2) + "em");
        });
        return e;
    };

    function addTab(h, area) { // ボタンで切り替えられるタブを追加する
        var e = $("<div>").appendTo(h),
            tabs = $("<div>").appendTo(e),
            container = $("<div>").appendTo(e);
        Object.keys(area).forEach(function(k) {
            (function(k) {
                var btn = addBtn(tabs, k, function(e) {
                    tabs.find("button").css("background-color", "gray");
                    $(e.target).css("background-color", "yellow");
                    container.children().hide();
                    area[k].show();
                    $(window).trigger("resize");
                });
            })(k);
            container.append(area[k]);
        });
        tabs.find("button").first().click();
        return e;
    };

    function addDesc(h, html) { // 説明を追加する
        return $("<div>").html(typeof html === "object" ? html.join("<br>") : html).css({
            backgroundColor: "lightgray",
            fontSize: "12px",
            padding: "5px",
            border: "solid 2.5px gray",
            borderRadius: "10px",
            display: "inline-block",
            maxWidth: "80%"
        }).appendTo(h);
    };
    //--------------------------------------------------
    var g_aliveCheckResultClearBtn, // Tokenの生存確認結果クリアボタンを格納する変数
        g_output, // ログの要素を格納する変数
        g_ip_flag = false, // ログ出力時にIPアドレスを表示するかの真偽値を格納する変数
        g_ajaxTimeoutIds = [], // 通信を行う遅延された関数のsetTimeoutのidを格納する配列
        h = $("<div>").appendTo("body").append($("<h1>").text($("title").text())),
        area = {};
    ["基本設定", "生存確認", "", "", "", "", "", ""].forEach(function(k) {
        area[k] = $("<div>").css({
            backgroundColor: "white",
            padding: "10px"
        });
    });
    addDesc(h, [
        makeSpan($("title").text() + " " + makeSpan("Ver.2.1.1", "gray", "skyblue; font-size: 12px; padding: 2.5px"), "darkgray", "purple; font-size: 16px; padding: 2.5px"),
        "このつーるは色々な文字と混じったtokenを抽出するつーるだよ、checker機能もあるよ",
        "",
        "作成 はるさめ",
        
    ]);
    //--------------------------------------------------
    h.append("<hr>");
    var content = $("<div>").css({
        backgroundColor: "lightgray",
        borderRadius: "10px"
    }).appendTo(h);
    content.append(makeSpan("ツール", "darkgray", "black; font-size: 15px", 2.5));
    var sendCancelBtn = addBtn(content, "送信キャンセル", function() {
        sendCancelBtn.prop("disabled", true);
        while (g_ajaxTimeoutIds.length) {
            var id = g_ajaxTimeoutIds.pop();
            clearTimeout(id);
            outputLog(g_output, "CANCEL: IDが" + id + "の送信予定の通信をキャンセルしました", g_ip_flag);
        };
        disabledElement(content, false);
        sendCancelBtn.prop("disabled", true);
    }).prop("disabled", true);
    addTab(content, area).css({
        border: "solid 5px gray",
        borderRadius: "5px"
    }).find("div").first().css("background-color", "darkgray");
    //--------------------------------------------------
    var inputInterval = addInput(area["基本設定"], "リクエスト送信間隔", "[秒]").on("change", function() {
        inputInterval.val(initInterval(Number(inputInterval.val())));
    }).val("0.5");
    area["基本設定"].append("<br>" + makeSpan("Token", "darkgray", "black", 2.5));
    var inputToken = addTextarea(area["基本設定"], "Tokenを改行で区切って入力\n\n例: " + new Array(4).join("\n************************.******.***************************")).on("change", function() {
        inputToken.val((inputToken.val().match(/[\w\-.]{59}/g) || []).filter(function(x, i, arr) {
            return arr.indexOf(x) === i;
        }).join("\n")).trigger("updatetextarea");
    });
    addBtn(area["基本設定"], "コピー").remove().insertBefore(inputToken).on("click", function() {
        copy(inputToken.val());
        inputToken.select();
    });
    addBtn(area["基本設定"], "クリア").remove().insertBefore(inputToken).after("<br>").on("click", function() {
        inputToken.val("").trigger("updatetextarea");
    });
    //--------------------------------------------------
    var aliveCheckDesc = addDesc(area["生存確認"], [
            makeSpan("警告", "pink", "purple"),
            "この機能を使うとtokenの生死を確認できるよ。",
            "判定方法はステータスをオンラインにする通信(オフラインのものがオンラインになることはありません)を送信し、レスポンスの内容によって判定するよ。",
            "アカウントを認証してくださいというエラーと認証失敗(Tokenが存在しない)エラーが死亡判定となるよ。"
        ]),
        outputAliveToken = addTextarea(area["生存確認"], "", true).before("<br>" + makeSpan("生存判定", "darkgray", "black", 2.5) + makeSpan("テキストエリアをクリックでコピー", "lightgray", "black; font-size: 10px") + "<br>"),
        outputDeadToken = addTextarea(area["生存確認"], "", true).before("<br>" + makeSpan("死亡判定", "darkgray", "black", 2.5) + makeSpan("テキストエリアをクリックでコピー", "lightgray", "black; font-size: 10px") + "<br>"),
        aliveCheckBtn = addBtn(area["生存確認"], "判定").remove().insertAfter(aliveCheckDesc).before("<br><br>").after("<br>").on("click", function() {
            if (inputToken.val().length === 0) outputLog(g_output, "WARNING: Tokenが入力されていません", g_ip_flag);
            if (g_aliveCheckResultClearBtn !== undefined) {
                outputAliveToken.val("").trigger("updatetextarea");
                outputDeadToken.val("").trigger("updatetextarea");
                g_aliveCheckResultClearBtn.remove();
                g_aliveCheckResultClearBtn = undefined;
            };
            splitLine(inputToken.val()).forEach(function(v, i) {
                g_ajaxTimeoutIds.push(setTimeout(function() {
                    disabledElement(content, true);
                    sendCancelBtn.prop("disabled", false);
                    $.ajax({
                        type: "PATCH",
                        url: "https://discord.com/api/v8/users/@me/settings",
                        headers: {
                            authorization: v,
                            "content-type": "application/json"
                        },
                        data: JSON.stringify({
                            status: "online"
                        })
                    }).always(function(body, statusText, data) {
                        if (statusText === "error") {
                            outputLog(g_output, "ERROR: " + (body.responseJSON.message === "You need to verify your account in order to perform this action." ? "アカウントの確認エラー" :
                                body.responseJSON.message === "401: Unauthorized" ? "認証エラー" :
                                "不明な通信エラー") + "が発生しました", g_ip_flag);
                            outputLog(outputDeadToken, v, false, true); // 死亡
                        } else if (statusText === "success") outputLog(outputAliveToken, v, false, true); // 生存
                        outputLog(g_output, "ALIVECHECK#" + (statusText === "error" ? body : data).status + "@" + v, g_ip_flag);
                        g_ajaxTimeoutIds.shift(1);
                        if (g_ajaxTimeoutIds.length === 0) {
                            disabledElement(content, false);
                            sendCancelBtn.prop("disabled", true);
                            g_aliveCheckResultClearBtn = addBtn(area["生存確認"], "クリア").remove().insertAfter(aliveCheckBtn).on("click", function(e) {
                                outputAliveToken.val("").trigger("updatetextarea");
                                outputDeadToken.val("").trigger("updatetextarea");
                                $(e.target).remove();
                                g_aliveCheckResultClearBtn = undefined;
                            });
                        };
                    });
                }, makeDelay(inputInterval.val(), i)));
            });
        });
    //--------------------------------------------------
    
    //--------------------------------------------------
    
    h.append("<hr>");
    addDesc(h, [
        "開発者ツールが使用できない端末でも簡易的に通信の情報を見るためのものです。",
        "通信情報以外にも不正な入力値の警告などが表示されます。",
        "以下のログをコピーして開発者や詳しい人に見せることで開発者ツールが使用できない端末の方や、ネットワークに詳しくない方でもエラーなどの原因の特定ができます。",
        "",
        makeSpan("注意", "Transparent", "red"),
        "ログを他の場所へ貼る場合は「IPアドレスとTokenをマスク」を押してログ内のIPアドレスとTokenを隠すことを推奨します。",
        "「ログにIPアドレスを表示」をONにするとログ出力時に先頭にIPアドレスが表示されますが、IPアドレスの取得にAPIを使用しているので出力までに遅延が発生します。",
        "そのため、このオプションは" + makeSpan("非推奨", "darkgray", "red") + "です。"
    ]).after("<br><br>");
    addBtn(h, "クリア", function() {
        g_output.val("").trigger("updatetextarea");
    });
    addBtn(h, "IPアドレスとTokenをマスク", function() {
        g_output.val(g_output.val().replace(/<[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+>/g, "<*.*.*.*>").replace(/[\w\-\.]{24}\.[\w\-\.]{6}\.[\w\-\.]{27}/g, function(m) {
            return m.replace(/[^\.]/g, "*");
        }));
    });
    addInputBool(h, "ログにIPアドレスを表示", function(flag) {
        g_ip_flag = flag;
    });
    g_output = addTextarea(h, "", true).before("<br>" + makeSpan("ログ", "darkgray", "black", 2.5) + makeSpan("テキストエリアをクリックでコピー", "lightgray", "black; font-size: 10px") + "<br>");
    //--------------------------------------------------
})();
