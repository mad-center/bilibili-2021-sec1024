# 流量的界定
> 原题目：https://security.bilibili.com/sec1024/q/r7.html

- 全局流量 = 真实人为流量 + 机器流量。
- 机器流量 = 正常机器流量 + 恶意机器流量。

机器指互联网的爬虫、自动程序或者模拟器。

- 低频率的搜索引擎爬虫用于数据采集、RSS 订阅服务等，属于正常机器流量。
- 自动化攻击、僵尸网络、高频率爬虫等，属于恶意机器流量。

## 当前数据集下的流量字段分析

首先，该数据集已经经过脱敏处理。选取其中一个流量进行说明：

```json
{
  "@timestamp": "2021-10-18T02:00:04+0000",
  "bytes_sent": "10346",
  "cdn_scheme": "https",
  "cookie_buvid": "-",
  "cookie_sid": "-",
  "cookie_userid": "-",
  "http_host": "www.bilibili.com",
  "http_path": "/s/video/BV1Jt4y1D7jJ",
  "http_referer": "\"-\"",
  "http_user_agent": "\"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)\"",
  "request_length": "582",
  "request_time": "0.129",
  "scheme": "http",
  "server_name": "www.bilibili.com",
  "status": "200",
  "upstream_status": "200",
  "x_backend_bili_real_ip": "gg.cej.hd.bii"
}
```

> 关于bilibili允许的爬虫代理，请参考：https://www.bilibili.com/robots.txt

其中这些字段已经被脱敏：

- `"cookie_buvid": "-",` 这个字段有些是UUID形式，似乎看不出很大的参考意义。
- `"cookie_sid": "-",`
- `"cookie_userid": "-",`
- `"http_referer": "\"-\"",` 其实这个来源字段很有用，可惜这里被脱敏了。

需要关注的字段有：

- @timestamp：访问时间
- http_host：主机名
- http_path：访问路径
- http_user_agent：访问的设备标识
- x_backend_bili_real_ip：访问的ip

## 定义恶意流量的类型

- API 路径/参数碰撞。例如账号检测，账号扫描拖库。API参数漏洞等。
- 高频率爬虫采集数据。
- 流量欺诈。这种属于虚伪流量，刷热度，刷粉丝。
- 掉入爬虫陷阱的流量。这种属于后端挖了一个坑给恶意爬虫来跳，有些爬虫跳进去了。

## 细化恶意流量的场景和判定依据

### 高频采集

> 是否存在某个IP在一段很短的时间范围内，以非正常的高频率访问API？

例如，将时间窗口设定为10分钟，假设人类正常访问时间间隔为1 action/(1-3秒)。10分钟就是600秒。 人类正常行为是200-600次API访问。一般取不到上界。

判定依据：如果10分钟内，IP 1访问速度高于600秒，那么可以认为这是恶意爬虫：高频采集。

策略：此时，后端应该启动限流机制：滑动时间窗口限流或者动态漏斗模型限流。

### 流量欺诈

> 是否存在某个IP间歇性地访问同一个视频/文章路径，且数量达到异常范围？

例如，某个视频刷播放数，在1小时内，间歇性地每5秒访问一次（时间间隔达到播放量计算所需观看时长）。
那么可以获得3600/5=720播放量。假如一天24小时刷，就是24x720=17280次播放。

判定依据：启发于redis的数据保存机制，设定每10分钟，1小时，1天作为时间衡量窗口。对同一个IP：
- 10分钟内超过600
- 1小时超过2000
- 一天超过10000

则认为是流量欺诈行为。

策略：在自定义的时间范围内，如果每个IP访问达到上述情况。执行流量惩罚，将部分流量进行丢弃处理，防止虚伪的热度。启动IP限流。

### API 路径/参数碰撞
> 是否存在某个IP，不停地访问一些不存在的API路径，例如bilibili/implode/2233。或者，篡改参数值，rank_type=2233?

判定依据：定义一个完善的路径黑名单列表，满足列表关键字匹配的认为是碰撞流量。

策略：启动IP限流。

> 注意，这个判定维度在该数据集中不可行，因为大部分路径已经乱改了。

### 掉入爬虫陷阱的流量
为了有效阻击和反抗一些恶意流量，主动出击。设定一个捕获机制。

例如，某个页面在当前自身逻辑中，绝对不可能出现某些API的访问形式，注意这个形式不属于无效URL类型，它是可访问的，
而且是对于爬虫很有诱惑性的。例如一个分页数据可以拿500个数据记录。正常界面逻辑最多也就50个记录。

掉入此链接的一律认为是掉入流量陷阱，启动IP限流。

## 传统风控检测模型的不足
传统风控检测模型，往往是定义某方面风险的满足条件，达到条件就认为是，或者不是恶意流量。

这种二值判定类型显然不够全面，细化程度太低。基于评分机制的多方面加权判定的风控模型显然更加有力。

## 人工智能-深度学习的风控模型
监督学习-跑模型-优化模型。数据量越大，效果越好。 注意，最终输出值，此时是这样的形式：
> 流量1是恶意流量的概率为67.5%，属于自身定义的中风险级别。

这里不会继续讲解这个DL模型。

## 回到做题
- 将log处理为json document，放入mongodb
- 利用mongodb QL进行数据提取和转化，然后利用代码进行排序，人为评估恶意流量。
