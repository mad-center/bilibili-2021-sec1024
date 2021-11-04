import time
import datetime


def get__days(date1, date2):
    date_1 = time.strptime(date1, "%Y-%m-%d")
    date_2 = time.strptime(date2, "%Y-%m-%d")

    date_1 = datetime.datetime(date_1[0], date_1[1], date_1[2])
    date_2 = datetime.datetime(date_2[0], date_2[1], date_2[2])
    diff_days = (date_2 - date_1).days
    return diff_days


if __name__ == '__main__':
    print(get__days("2003-03-26", "2021-10-24"))