let readline = require("readline");
let fs = require("fs");

const jsonPath = 'visit-map.json';

function readDataAndSave() {
    // map(key: ip, value:{ count, http_paths })
    const map = {};

    // evil-log.log.zip v2 => 481888 lines
    let rl = readline.createInterface({
        input: fs.createReadStream("./evil-log.log"),
    });

    rl.on("line", function (line) {
        let lineTemp = JSON.parse(line);
        let {x_backend_bili_real_ip: ip, http_path} = lineTemp;
        if (map[ip]) {
            // increment count
            map[ip].count++;
            // and push this http_path to array if not exist
            !map[ip].http_paths.includes(http_path) && map[ip].http_paths.push(http_path);
        } else {
            map[ip] = {
                count: 1,
                http_paths: [http_path]
            };
        }
    });

    rl.on("close", function () {
        fs.writeFileSync(jsonPath, JSON.stringify(map))
        console.log('convert data to map done.')
    });
}
// 将之前处理得到的map进行排序，排序字段：count, 方式：desc
// 在内存中对其进行处理不是很方便，考虑将evil-log每行一个document放入mongodb，后续提取视图和map-reduce会比较方便。

function analyze() {
    const buffer = fs.readFileSync(jsonPath);
    const map = JSON.parse(buffer);
    console.log('map keys length: ', Object.keys(map).length)

    // 思路：从访问路径中寻找敏感的路径。
    // - 访问次数不能作为判定依据。但是可以作为排序依据。单位时间范围内，访问次数越多，是恶意流量的嫌疑越高。
    //    - 数据集中都是一天内的数据。单位时间因此可以划分为小时粒度。把单位小时内疯狂访问的up都抓起来。
    // - 使用黑名单机制，一旦发现包含敏感路径，可以进行标记。标记次数越多，风险级别越高。

    let suspiciousIp = [];
    let notSuspiciousIp = [];
    let ips = [];

    let pathExp = new RegExp("account/check");
    // for (let key in map) {
    //     console.log('checking key', key)
    //     if (map[key].count > 200) {
    //         let flag = false;
    //         for (let path of map[key].http_paths) {
    //             if (pathExp.test(path)) {
    //                 flag = true;
    //             }
    //         }
    //         flag && (suspiciousIp.push(map[key]), ips.push(key));
    //     } else {
    //         notSuspiciousIp.push(map[key]);
    //     }
    // }

    // let fWrite = fs.createWriteStream("output.json");
    // fWrite.write(JSON.stringify(suspiciousIp));
    // // fWriteNot.write(JSON.stringify(notSuspiciousIp));
    // console.log('map length: ', Object.keys(map).length)
    // console.log('not suspicious ip length: ', notSuspiciousIp.length)
    // fs.writeFileSync("ips.txt", ips.join(","));
}

analyze()
