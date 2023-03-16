# 一些随手写的脚本  青龙面板或圈x

## 拉库

```
ql repo https://github.com/zhacha222/NoteJS.git
```

## 1.青年大学习 ，每周自动学习 （仅适用于 陕西省 三秦青年）

#### 抓包：
开着抓包软件进入公众号【三秦青年】——青年大学习，抓 `www.sxgqt.org.cn` 包中 `request header` 里的 `token`
#### token有效期只有一天，未解决

#### 环境变量

变量名称：`qndxxToken`
 
 多用户用在【环境变量】内单独新建变量； 

 也可以 只建一个变量，各用户的token`换行`隔开，或者用`&`隔开 例如：`xxxxx&xxxxx&xxxxx`
 
 定时：`一周一次（默认每周二早上8点执行一次）`
 
 ```
 cron：0 8 * * 2 
 ```
 
 #### 适配圈x
 
 ```
 [task_local]
 #青年大学习
 0 8 * * 2 https://ghproxy.com/https://raw.githubusercontent.com/zhacha222/NoteJS/main/qndxx.js, tag=青年大学习, enabled=true
 [rewrite_local]
 https://www.sxgqt.org.cn/h5sxapiv2/user/base url script-request-header https://ghproxy.com/https://raw.githubusercontent.com/zhacha222/NoteJS/main/qndxx.js
 [MITM]
 hostname = www.sxgqt.org.cn
```

## 2.“7MA出行” 每日签到、看广告得积分  每天18积分，188积分可换3次免费骑行

#### 抓包：
”7MA出行“微信小程序或者app都可以，抓 `newmapi.7mate.cn` 这个域名下 `hearders` 部分的 `Authorization` ,把抓到的值去掉前面的 `Bearer` ，只保留 `eyJ0eXAiOiJKxxxxxxxxxxx` 后面这部分

#### 环境变量

 变量名称：`mateToken`   多个账号 换行分割 或者 新建变量

 定时: `10 8 * * *`
 
 
 #### 适配圈x
 
 ```
 [task_local]
 #7MA出行
 10 8 * * * https://raw.githubusercontent.com/zhacha222/NoteJS/main/7ma.js, tag=7MA出行, enabled=true
 [rewrite_local]
 https://newmapi.7mate.cn/api/user url script-request-header https://raw.githubusercontent.com/zhacha222/NoteJS/main/7ma.js
 [MITM]
 hostname = newmapi.7mate.cn
 ```

## 3.“云达人 qpp” 每日签到、观看视频，浏览二手市场，浏览校园头条文章得积分

 #### 定时：`15 8 * * *`

 #### 变量名称：`ydrToken` 多个账号在【环境变量】单独新建变量，
 
 
 #### 变量值：
 ```
 {
   "uid": "123456",
   "Authorization": "xxxxxxxxx",
   "video_sign": "xxxxxxxxx",
   "market_sign": "xxxxxxxxx",
   "article_sign": "xxxxxxxxx"
   }
```

 #### 关于变量值中各参数的说明:
 
 ```
 uid ———————————————————— h5.jinghaojian.net 包中 request header里的uid
 Authorization —————————— h5.jinghaojian.net 包中 request header里的Authorization，不要带前面的Bearer
 video_sign ————————————— 观看视频获得积分的sign
 market_sign ———————————— 获得积分的sign
 article_sign ——————————— 获得积分的sign
 
 三条sign必须各自单独抓，
 url都是 http://h5.jinghaojian.net:8088/jfapi/mall/sign/v2/addScore
 区别是请求body里面的type不同，6是二手市场，7是头条文章，8是观看视频，注意区分！
 sign就在请求hearder里面
 ```
 
 #### 注意事项:
*  1.支持青龙和圈x，青龙在【环境变量】页添加变量，圈x在boxjs中手动添加变量
 
*  2.青龙脚本变量只推荐在的【环境变量】页添加，有强迫症在【配置文件】config.sh中添加的如果出现问题自己解决
 
*  3.支持多用户，每一用户在【环境变量】单独新建变量ydrToken，切勿一个变量内填写多个用户的参数
 
*  4.变量中的所有符号都是 英文符号 ！！！
 
*  5.脚本通知方式采用青龙面板默认通知，请在【配置文件】config.sh里配置
 
*  6.浏览视频，二手市场，校园头条任务三者的sign需要各自单独抓，并不通用

