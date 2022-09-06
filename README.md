# 青年大学习 ，每周自动学习  青龙面板 （仅适用于 陕西省 三秦青年）

## 抓包：
开着抓包软件进入公众号【三秦青年】——青年大学习，抓 www.sxgqt.org.cn 包中 request header里的token

## 拉库

```
ql repo https://github.com/zhacha222/qingniandaxuexi.git
```

## 环境变量

变量名称：`qndxxToken`
 
 多用户用在【环境变量】内单独新建变量； 也可以 只建一个变量，各用户的token`换行`隔开，或者用`&`隔开 例如：`xxxxx&xxxxx&xxxxx`
 
 定时：`一周一次（默认每周二早上8点执行一次）`
 
 ```
 cron：0 8 * * Tue
 ```
