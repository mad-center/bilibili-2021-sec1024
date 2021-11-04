sticklength = 27  # 木棍长度
antnum = 5  # 蚂蚁数量
position = [3, 7, 11, 17, 23]  # 蚂蚁位置
speed = 1  # 速度

max = 0  # 全部完成的最长时间
min = 0  # 全部完成的最短时间
tmp_max = 0
tmp_min = 0

for p in position:
    if p < (sticklength / 2):  # 木棍左半边
        tmp_max = (sticklength - p) / speed
        tmp_min = p / speed
    else:  # 木棍右半边
        tmp_max = p / speed
        tmp_min = (sticklength - p) / speed

    print("p:{0}, tmp_max:{1}, tmp_min:{2}".format(p, tmp_max, tmp_min))

    if max < tmp_max:
        max = tmp_max
    if min < tmp_min:
        min = tmp_min

print("max: {0}, min: {1}".format(max, min))
