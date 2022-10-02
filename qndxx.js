/**
* 作者: QQ1483081359 欢迎前来提交bug
* 微信公众号：三秦青年 青年大学习 每周自动学习
* 抓包：开着抓包软件进入 公众号【三秦青年】——青年大学习，抓 www.sxgqt.org.cn 包中 request header里的 token
* 变量：qndxxToken  多个账号 换行分割 或者 新建变量
* 定时：一周一次（默认每周二早上8点执行一次）
* cron: 0 8 * * 2
* github仓库：https://github.com/zhacha222/NoteJS

 [task_local]
 #青年大学习
 0 8 * * 2 https://ghproxy.com/https://raw.githubusercontent.com/zhacha222/NoteJS/main/qndxx.js, tag=青年大学习, enabled=true
 [rewrite_local]
 https://www.sxgqt.org.cn/h5sxapiv2/user/base url script-request-header https://ghproxy.com/https://raw.githubusercontent.com/zhacha222/NoteJS/main/qndxx.js
 [MITM]
 hostname = www.sxgqt.org.cn

 工作日志：
 1.0.0 完成学习的基本功能
 1.0.1 修改doPunchIn一处单词错误
 1.0.2 适配圈x

 */
//cron: 0 8 * * 2

//===============通知设置=================//
const Notify = 1; //0为关闭通知，1为打开通知,默认为1
////////////////////////////////////////////

const $ = new Env('青年大学习');
const notify = $.isNode() ? require('./sendNotify') : '';
const {log} = console;
//////////////////////
let scriptVersion = "1.0.2";
let scriptVersionLatest = "";
let update_data = "1.0.2 适配圈x";
//青年大学习账号数据
let qndxxToken = ($.isNode() ? process.env.qndxxToken : $.getdata("qndxxToken")) || "";
let qndxxTokenArr = [];
let loginBack =0;
let PunchInBack =0;
let status_code =0;
let token =``;
let realname =``;
let id =``;
let name =``;
let status =``;
let isStudy =``;
let res =``;
let msg =``;

!(async () => {
    if (typeof $request !== "undefined") {
        await GetRewrite();
    } else {
        if (!(await Envs()))
            return;
        else {

            log(`\n\n=============================================    \n脚本执行 - 北京时间(UTC+8)：${new Date(
                new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 +
                8 * 60 * 60 * 1000).toLocaleString()} \n=============================================\n`);

            await poem();
            await getVersion();
            log(`\n============ 当前版本：${scriptVersion}  最新版本：${scriptVersionLatest} ============`)

            if (scriptVersionLatest != scriptVersion) {
                log(`\n发现新版本,请拉库更新！\n${update_data}`)
            }

            log(`\n=================== 共找到 ${qndxxTokenArr.length} 个账号 ===================`)


            for (let index = 0; index < qndxxTokenArr.length; index++) {


                let num = index + 1
                if (num >1){
                    log('**********休息15s，防止黑IP**********');
                    await $.wait(15 * 1000);
                }
                log(`\n========= 开始【第 ${num} 个账号】=========\n`)

                token = qndxxTokenArr[index];
                //log(token)
                loginBack =0
                log('开始登录...');
                await login()
                await $.wait(2 * 1000);
                if (loginBack>0) {
                    PunchInBack =0
                    await PunchIn()
                    await $.wait(2 * 1000);
                    if (PunchInBack>0) {
                        await doPunchIn()
                        await $.wait(2 * 1000);

                    }

                }

                var resultlog = getResult()
                msg += `学习用户：${realname}\n学习情况：${resultlog}\n\n`
            }

            // log(msg);
            await SendMsg(msg);
        }
    }

})()
    .catch((e) => log(e))
    .finally(() => $.done())


/**
 * 登录
 */
function login(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://www.sxgqt.org.cn/h5sxapiv2/user/base`,
            headers: {
                "token": `${token}`
            },
            data: ``,
        }
        $.get(url, async (error, response, data) => {
            try {
                let result = data == "undefined" ? await login() : JSON.parse(data);
                //登录成功

                if (result.code == 0 ) {
                    realname = result.data.user_info.realname
                    log(`登录成功`+`\n用户：${realname}`)
                    loginBack =1
                } else if(result.code == 1004) {
                    log(`❌ 登录失败，token无效`)
                    status_code=4
                }else if(result.code == 1001) {
                    log(`❌ 登录失败，token值有误`)
                    status_code=4
                }else {
                    log(`❌ 登录失败，发生未知错误`)
                    status_code=0
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
}

/**
 * 判断是否已学习并获取id
 */
function PunchIn(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://www.sxgqt.org.cn/h5sxapiv2/study/getStudyRecord?page=1`,
            headers: {
                "token": `${token}`
            },
            data: ``,
        }
        $.get(url, async (error, response, data) => {
            try {
                let result = data == "undefined" ? await login() : JSON.parse(data);

                if (result.code == 0 ) {
                    id = result.data.data[0].id
                    name = result.data.data[0].name
                    status = result.data.data[0].status  //1为正在学习中，2为当前不在学习时间段内
                    isStudy = result.data.data[0].isStudy //1为已学习，2为未学习
                    log(`本周学习：`+name)
                    if(isStudy==1){
                        log(`🆗 您已经学习了，无需重复学习`)
                        status_code =2
                    }else{
                        log(`暂未进行学习，开始学习···`)
                        PunchInBack =1
                    }
                } else if(result.code == 1004) {
                    log(`❌ token无效`)
                    status_code=4
                }else if(result.code == 1001) {
                    log(`❌ token值有误`)
                    status_code=4
                }else {
                    log(`❌ 发生未知错误`)
                    status_code=0
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
}

/**
 * 开始学习
 */
function doPunchIn(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://www.sxgqt.org.cn/h5sxapiv2/study/statistics?type=new&id=${id}`,
            headers: {
                "token": `${token}`
            },
            data: ``,
        }

        $.get(url, async (error, response, data) => {
            try {
                let result = data == "undefined" ? await doPunchIn() : JSON.parse(data);
                if (result.code == 0){
                    log("✅ 学习成功")
                    status_code=1
                }else if(result.code == 1004) {
                    log(`❌ 学习失败，token无效`)
                    status_code=4
                }else if(result.code == 1001) {
                    log(`❌ 学习失败，token值有误`)
                    status_code=4
                }else {
                    log(`❌ 学习失败，发生未知错误`)
                    status_code=0
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
}


/**
 * 获取学习结果
 */
function getResult(timeout = 3 * 1000) {
    res = status_code
    if (res == 1) return "✅ 学习成功"
    if (res == 2) return "🆗 本周您已经学习了，无需重复学习"
    if (res == 3) return "❌ 学习失败，当前不在学习时间段内"
    if (res == 4) return "❌ 学习失败，token已失效"
    else return "❌ 学习失败，发生未知错误"
}

// ============================================重写============================================ \\
async function GetRewrite() {
    if ($request.url.indexOf("user/base") > -1) {
        const ck = $request.headers.token;
        if (qndxxToken) {
            if (qndxxToken.indexOf(ck) == -1) {
                qndxxToken = qndxxToken + "\n" + ck;
                $.setdata(qndxxToken, "qndxxToken");
                let List = qndxxToken.split("\n");
                $.msg(`【${$.name}】` + ` 获取第${List.length}个 ck 成功：${ck}`);
            }
        } else {
            $.setdata(ck, "qndxxToken");
            $.msg(`【${$.name}】` + ` 获取第1个 ck 成功：${ck}`);
        }
    }
}

// ============================================变量检查============================================ \\
async function Envs() {
    if (qndxxToken) {
        if (qndxxToken.indexOf("@") != -1 || qndxxToken.indexOf("&") != -1) {
            qndxxToken.split("@"&&"&").forEach((item) => {
                qndxxTokenArr.push(item);
            });
        }
        else if (qndxxToken.indexOf("\n") != -1) {
            qndxxToken.split("\n").forEach((item) => {
                qndxxTokenArr.push(item);
            });
        }
        else {
            qndxxTokenArr.push(qndxxToken);
        }
    } else {
        log(`\n 未填写变量 qndxxToken`)
        return;
    }

    return true;
}
// ============================================发送消息============================================ \\
async function SendMsg(msg) {
    if (!msg)
        return;

    if (Notify > 0) {
        if ($.isNode()) {
            var notify = require('./sendNotify');
            await notify.sendNotify($.name, msg+ `\n学习时间：${t()}\n`);
        } else {
            $.msg(msg);
        }
    } else {
        log(msg);
    }
}



/**
 * 获取当前小时数
 */
function local_hours() {
    let myDate = new Date();
    let h = myDate.getHours();
    return h;
}

/**
 * 获取当前分钟数
 */
function local_minutes() {
    let myDate = new Date();
    let m = myDate.getMinutes();
    return m;
}

/**
 * 随机数生成
 */
function randomString(e) {
    e = e || 32;
    var t = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890",
        a = t.length,
        n = "";
    for (i = 0; i < e; i++)
        n += t.charAt(Math.floor(Math.random() * a));
    return n
}

/**
 * 随机整数生成
 */
function randomInt(min, max) {
    return Math.round(Math.random() * (max - min) + min)
}

/**
 * 获取毫秒时间戳
 */
function timestampMs(){
    return new Date().getTime();
}

/**
 *
 * 获取秒时间戳
 */
function timestampS(){
    return Date.parse(new Date())/1000;
}

/**
 * 获取随机诗词
 */
function poem(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://v1.jinrishici.com/all.json`
        }
        $.get(url, async (err, resp, data) => {
            try {
                data = JSON.parse(data)
                log(`${data.content}  \n————《${data.origin}》${data.author}`);
            } catch (e) {
                log(e, resp);
            } finally {
                resolve()
            }
        }, timeout)
    })
}

/**
 * 修改配置文件
 */
function modify() {

    fs.readFile('/ql/data/config/config.sh','utf8',function(err,dataStr){
        if(err){
            return log('读取文件失败！'+err)
        }
        else {
            var result = dataStr.replace(/regular/g,string);
            fs.writeFile('/ql/data/config/config.sh', result, 'utf8', function (err) {
                if (err) {return log(err);}
            });
        }
    })
}

/**
 * 获取远程版本
 */
function getVersion(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://ghproxy.com/https://raw.githubusercontent.com/zhacha222/NoteJS/main/qndxx.js`,
        }
        $.get(url, async (err, resp, data) => {
            try {
                scriptVersionLatest = data.match(/scriptVersion = "([\d\.]+)"/)[1]
                update_data = data.match(/update_data = "(.*?)"/)[1]
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve()
            }
        }, timeout)
    })
}

/**
 * time 输出格式：1970-01-01 00:00:00
 */
function t() {
    var date = new Date();
    // 获取当前月份
    var nowMonth = date.getMonth() + 1;
    // 获取当前是几号
    var strDate = date.getDate();
    //获取当前小时（0-23）
    var nowhour = date.getHours()
    //获取当前分钟（0-59）
    var nowMinute = date.getMinutes()
    //获取当前秒数(0-59)
    var nowSecond = date.getSeconds();
    // 添加分隔符“-”
    var seperator = "-";
    // 添加分隔符“:”
    var seperator1 = ":";

    // 对月份进行处理，1-9月在前面添加一个“0”
    if (nowMonth >= 1 && nowMonth <= 9) {
        nowMonth = "0" + nowMonth;
    }
    // 对月份进行处理，1-9号在前面添加一个“0”
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    // 对小时进行处理，0-9号在前面添加一个“0”
    if (nowhour >= 0 && nowhour <= 9) {
        nowhour = "0" + nowhour;
    }
    // 对分钟进行处理，0-9号在前面添加一个“0”
    if (nowMinute >= 0 && nowMinute <= 9) {
        nowMinute = "0" + nowMinute;
    }
    // 对秒数进行处理，0-9号在前面添加一个“0”
    if (nowSecond >= 0 && nowSecond <= 9) {
        nowSecond = "0" + nowSecond;
    }

    // 最后拼接字符串，得到一个格式为(yyyy-MM-dd)的日期
    var nowDate = date.getFullYear() + seperator + nowMonth + seperator + strDate + ` ` + nowhour + seperator1 + nowMinute + seperator1 + nowSecond
    return nowDate
}

function Env(t, e) {
    "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0);
    class s {
        constructor(t) {
            this.env = t
        }
        send(t, e = "GET") {
            t = "string" == typeof t ? {
                url: t
            } : t;
            let s = this.get;
            return "POST" === e && (s = this.post), new Promise((e, i) => {
                s.call(this, t, (t, s, r) => {
                    t ? i(t) : e(s)
                })
            })
        }
        get(t) {
            return this.send.call(this.env, t)
        }
        post(t) {
            return this.send.call(this.env, t, "POST")
        }
    }
    return new class {
        constructor(t, e) {
            this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`)
        }
        isNode() {
            return "undefined" != typeof module && !!module.exports
        }
        isQuanX() {
            return "undefined" != typeof $task
        }
        isSurge() {
            return "undefined" != typeof $httpClient && "undefined" == typeof $loon
        }
        isLoon() {
            return "undefined" != typeof $loon
        }
        toObj(t, e = null) {
            try {
                return JSON.parse(t)
            } catch {
                return e
            }
        }
        toStr(t, e = null) {
            try {
                return JSON.stringify(t)
            } catch {
                return e
            }
        }
        getjson(t, e) {
            let s = e;
            const i = this.getdata(t);
            if (i) try {
                s = JSON.parse(this.getdata(t))
            } catch {}
            return s
        }
        setjson(t, e) {
            try {
                return this.setdata(JSON.stringify(t), e)
            } catch {
                return !1
            }
        }
        getScript(t) {
            return new Promise(e => {
                this.get({
                    url: t
                }, (t, s, i) => e(i))
            })
        }
        runScript(t, e) {
            return new Promise(s => {
                let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
                i = i ? i.replace(/\n/g, "").trim() : i;
                let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
                r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r;
                const [o, h] = i.split("@"), n = {
                    url: `http://${h}/v1/scripting/evaluate`,
                    body: {
                        script_text: t,
                        mock_type: "cron",
                        timeout: r
                    },
                    headers: {
                        "X-Key": o,
                        Accept: "*/*"
                    }
                };
                this.post(n, (t, e, i) => s(i))
            }).catch(t => this.logErr(t))
        }
        loaddata() {
            if (!this.isNode()) return {}; {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e);
                if (!s && !i) return {}; {
                    const i = s ? t : e;
                    try {
                        return JSON.parse(this.fs.readFileSync(i))
                    } catch (t) {
                        return {}
                    }
                }
            }
        }
        writedata() {
            if (this.isNode()) {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e),
                    r = JSON.stringify(this.data);
                s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
            }
        }
        lodash_get(t, e, s) {
            const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
            let r = t;
            for (const t of i)
                if (r = Object(r)[t], void 0 === r) return s;
            return r
        }
        lodash_set(t, e, s) {
            return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t)
        }
        getdata(t) {
            let e = this.getval(t);
            if (/^@/.test(t)) {
                const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : "";
                if (r) try {
                    const t = JSON.parse(r);
                    e = t ? this.lodash_get(t, i, "") : e
                } catch (t) {
                    e = ""
                }
            }
            return e
        }
        setdata(t, e) {
            let s = !1;
            if (/^@/.test(e)) {
                const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}";
                try {
                    const e = JSON.parse(h);
                    this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i)
                } catch (e) {
                    const o = {};
                    this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i)
                }
            } else s = this.setval(t, e);
            return s
        }
        getval(t) {
            return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null
        }
        setval(t, e) {
            return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null
        }
        initGotEnv(t) {
            this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
        }
        get(t, e = (() => {})) {
            t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
                "X-Surge-Skip-Scripting": !1
            })), $httpClient.get(t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
                hints: !1
            })), $task.fetch(t).then(t => {
                const {
                    statusCode: s,
                    statusCode: i,
                    headers: r,
                    body: o
                } = t;
                e(null, {
                    status: s,
                    statusCode: i,
                    headers: r,
                    body: o
                }, o)
            }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
                try {
                    if (t.headers["set-cookie"]) {
                        const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                        s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar
                    }
                } catch (t) {
                    this.logErr(t)
                }
            }).then(t => {
                const {
                    statusCode: s,
                    statusCode: i,
                    headers: r,
                    body: o
                } = t;
                e(null, {
                    status: s,
                    statusCode: i,
                    headers: r,
                    body: o
                }, o)
            }, t => {
                const {
                    message: s,
                    response: i
                } = t;
                e(s, i, i && i.body)
            }))
        }
        post(t, e = (() => {})) {
            if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
                "X-Surge-Skip-Scripting": !1
            })), $httpClient.post(t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            });
            else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
                hints: !1
            })), $task.fetch(t).then(t => {
                const {
                    statusCode: s,
                    statusCode: i,
                    headers: r,
                    body: o
                } = t;
                e(null, {
                    status: s,
                    statusCode: i,
                    headers: r,
                    body: o
                }, o)
            }, t => e(t));
            else if (this.isNode()) {
                this.initGotEnv(t);
                const {
                    url: s,
                    ...i
                } = t;
                this.got.post(s, i).then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => {
                    const {
                        message: s,
                        response: i
                    } = t;
                    e(s, i, i && i.body)
                })
            }
        }
        time(t, e = null) {
            const s = e ? new Date(e) : new Date;
            let i = {
                "M+": s.getMonth() + 1,
                "d+": s.getDate(),
                "H+": s.getHours(),
                "m+": s.getMinutes(),
                "s+": s.getSeconds(),
                "q+": Math.floor((s.getMonth() + 3) / 3),
                S: s.getMilliseconds()
            };
            /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length)));
            for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length)));
            return t
        }
        msg(e = t, s = "", i = "", r) {
            const o = t => {
                if (!t) return t;
                if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? {
                    "open-url": t
                } : this.isSurge() ? {
                    url: t
                } : void 0;
                if ("object" == typeof t) {
                    if (this.isLoon()) {
                        let e = t.openUrl || t.url || t["open-url"],
                            s = t.mediaUrl || t["media-url"];
                        return {
                            openUrl: e,
                            mediaUrl: s
                        }
                    }
                    if (this.isQuanX()) {
                        let e = t["open-url"] || t.url || t.openUrl,
                            s = t["media-url"] || t.mediaUrl;
                        return {
                            "open-url": e,
                            "media-url": s
                        }
                    }
                    if (this.isSurge()) {
                        let e = t.url || t.openUrl || t["open-url"];
                        return {
                            url: e
                        }
                    }
                }
            };
            if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) {
                let t = ["", "==============📣系统通知📣=============="];
                t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t)
            }
        }
        log(...t) {
            t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator))
        }
        logErr(t, e) {
            const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
            s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t)
        }
        wait(t) {
            return new Promise(e => setTimeout(e, t))
        }
        done(t = {}) {
            const e = (new Date).getTime(),
                s = (e - this.startTime) / 1e3;
            this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
        }
    }(t, e)
}
