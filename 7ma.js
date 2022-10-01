/**
 作者QQ:1483081359 欢迎前来提交bug
 7MA出行 每日签到、看广告得积分  每天18积分，188积分可换3次免费骑行
 github仓库： https://github.com/zhacha222/NoteJS

 抓包：7MA出行 微信小程序或者app都可以，抓 newmapi.7mate.cn 这个域名下 hearders 部分的 Authorization ,
 把抓到的值去掉 Bearer，只保留 eyJ0eXAiOiJKV1QiLCJhbGciOiJIUxxxxxxxxxxxxxxxxx 后面这部分

 变量：mateToken  多个账号 换行分割

 定时一天一次
 cron: 10 12 * * *

 [task_local]
 #7MA出行
 10 12 * * * https://raw.githubusercontent.com/zhacha222/NoteJS/main/7ma.js, tag=7MA出行, enabled=true
 [rewrite_local]
 https://newmapi.7mate.cn/api/user url script-request-hearder https://raw.githubusercontent.com/zhacha222/NoteJS/main/7ma.js
 [MITM]
 hostname = newmapi.7mate.cn

 工作日志：
 1.0.0 完成签到、看广告等基本内容
 1.0.1 适配圈x

 */
//cron: 10 12 * * *

//===============通知设置=================//
const Notify = 1; //0为关闭通知，1为打开通知,默认为1
////////////////////////////////////////////

const $ = new Env('7MA出行');
const notify = $.isNode() ? require('./sendNotify') : '';
const {log} = console;
//////////////////////
let scriptVersion = "1.0.0";
let scriptVersionLatest = "";
let update_data = '1.0.1 适配圈x';
//7MA出行账号数据
let mateToken = ($.isNode() ? process.env.mateToken : $.getdata("mateToken")) || "";
let mateTokenArr = [];
let login_log =``;
let login_notice_log =``;
let loginBack =0;
let signinBack =0;
let extraadResultBack =0;
let adResultBack =1;
let token =``;
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

            if(scriptVersionLatest != scriptVersion){
                log(`\n发现新版本,请拉库更新！\n${update_data}`)
            }

            log(`\n=================== 共找到 ${mateTokenArr.length} 个账号 ===================`)


            for (let index = 0; index < mateTokenArr.length; index++) {


                let num = index + 1
                if (num >1){
                    await $.wait(2 * 1000);
                }
                log(`\n========= 开始【第 ${num} 个账号】=========\n`)

                token = mateTokenArr[index];

                loginBack =0
                await login()
                await $.wait(2 * 1000);
                log(login_log)
                if (loginBack>0) {
                    signinBack =0
                    await signin()
                    await $.wait(2 * 1000);
                    if (signinBack>0)  {
                        extraadResultBack =0
                        await extraadResult()
                        await $.wait(2 * 1000);
                        if(extraadResultBack>0) {
                            adResultBack =1
                            for (let i = 0; i < 10; i++) {
                                if(adResultBack=1){
                                    await adResult()
                                    await $.wait(2 * 1000);
                                }

                            }

                        }

                    }

                }

                await login()
                msg += `============= 账号${num} =============\n`+login_notice_log+`\n`
            }
            log(`\n\n============== 推送 ==============`)
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
            url: `https://newmapi.7mate.cn/api/user`,
            headers: {
                "Host": "newmapi.7mate.cn",
                "Authorization": `Bearer ${token}`,
                "Referer": "https://servicewechat.com/wx9a6a1a8407b04c5d/143/page-frame.html",
                "content-type": "application/json"
            },
            data: "",
        }

        $.get(url, async (error, response, data) => {
            try {
                let result = data == "undefined" ? await login() : JSON.parse(data);

                if(result.data.phone) {
                    login_log = `登录成功\n` + `手机号：` + result.data.phone + `\nID：` + result.data.id + `\n积分：` + result.data.points
                    login_notice_log = `手机号：` + result.data.phone + `\n积分：` + result.data.points
                    loginBack = 1
                }else if(result.status_code==401){ //登录失败
                    login_log=`登录失败，`+decodeURI(result.message)
                    login_notice_log = `登录失败，\n`+decodeURI(result.message)
                    loginBack =0
                }else{
                    login_log =`登录失败，发送未知错误`
                    loginBack =0
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
 * 签到
 */
function signin(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://newmapi.7mate.cn/api/signin`,
            headers: {
                "Host": "newmapi.7mate.cn",
                "Authorization": `Bearer ${token}`,
                "Referer": "https://servicewechat.com/wx9a6a1a8407b04c5d/143/page-frame.html",
                "content-type": "application/json"
            },
            body: ``,
        }

        $.post(url, async (error, response, data) => {
            try {
                let result = data == "undefined" ? await signin() : JSON.parse(data);

                if(result.status_code==200){ //签到成功
                    log(`\n签到成功，获得1积分`)
                    signinBack=1
                }else if(result.status_code==406 ){ //已签到
                    log(`\n`+decodeURI(result.message))
                    signinBack=1
                }else if(result.status_code==401 ){ //异地登录
                    log(decodeURI(result.message))
                }else{
                    log(`发生未知错误 ❌`)
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
 * 签到后看一次广告（获得7积分，每天1次）
 */
function extraadResult(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://newmapi.7mate.cn/api/adResult`,
            headers: {
                "Host": "newmapi.7mate.cn",
                "Authorization": `Bearer ${token}`,
                "Referer": "https://servicewechat.com/wx9a6a1a8407b04c5d/143/page-frame.html",
                "content-type": "application/json"
            },
            body: `is_sign=1&finish=1`,
        }

        $.post(url, async (error, response, data) => {
            try {
                let result = data == "undefined" ? await extraadResult() : JSON.parse(data);

                if(result.status_code==200){ //广告观看成功
                    log(`签到额外任务完成，获得7积分`)
                    extraadResultBack =1
                }else if(result.status_code==512 ){ //已观看
                    log(decodeURI(result.message))
                    extraadResultBack =1
                }else if(result.status_code==401 ){ //异地登录
                    log(decodeURI(result.message))
                }else{
                    log(`发生未知错误 ❌`)
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
 * 看广告得积分（每天10次，每次1积分）
 */
function adResult(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://newmapi.7mate.cn/api/adResult`,
            headers: {
                "Host": "newmapi.7mate.cn",
                "Authorization": `Bearer ${token}`,
                "Referer": "https://servicewechat.com/wx9a6a1a8407b04c5d/143/page-frame.html",
                "content-type": "application/json"
            },
            body: `finish=1`,
        }

        $.post(url, async (error, response, data) => {
            try {
                let result = data == "undefined" ? await adResult() : JSON.parse(data);

                if(result.status_code==200){ //广告观看成功
                    log(`广告观看成功,获得1积分`)
                    adResultBack=1
                }else if(result.status_code==512 ){ //已观看
                    log(decodeURI(result.message))
                    adResultBack=0
                }else if(result.status_code==401 ){ //异地登录
                    log(decodeURI(result.message))
                    adResultBack=0
                }else{
                    log(`发生未知错误 ❌`)
                    adResultBack=0
                }


            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
}

// ============================================重写============================================ \\
async function GetRewrite() {
    if ($request.url.indexOf("api/user") > -1) {
        const ck = $request.hearders;
        $.msg(`${ck}`);
        if (mateToken) {
            if (mateToken.indexOf(ck) == -1) {
                mateToken = mateToken + "@" + ck;
                $.setdata(mateToken, "mateToken");
                let List = mateToken.split("@");
                $.msg(`【${$.name}】` + ` 获取第${List.length}个 ck 成功: ${ck} ,不用请自行关闭重写!`);
            }
        } else {
            $.setdata(ck, "mateToken");
            $.msg(`【${$.name}】` + ` 获取第1个 ck 成功: ${ck} ,不用请自行关闭重写!`);
        }
    }
    $.msg(`【${$.name}】` + ` 获取第1个 ck 失败: ${ck} ,不用请自行关闭重写!`);
}

// ============================================变量检查============================================ \\
async function Envs() {
    if (mateToken) {
        if (mateToken.indexOf("@") != -1 || mateToken.indexOf("&") != -1) {
            mateToken.split("@"&&"&").forEach((item) => {
                mateTokenArr.push(item);
            });
        }
        else if (mateToken.indexOf("\n") != -1) {
            mateToken.split("\n").forEach((item) => {
                mateTokenArr.push(item);
            });
        }
        else {
            mateTokenArr.push(mateToken);
        }
    } else {
        log(`\n 未填写变量 mateToken`)
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
            await notify.sendNotify($.name, msg+ `\n运行时间：${t()}\n`);
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
            url: `https://ghproxy.com/https://raw.githubusercontent.com/zhacha222/NoteJS/main/7ma.js`,
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
