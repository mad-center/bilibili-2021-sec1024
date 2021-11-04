def f(n):
    if n == 1:
        return 1
    elif n == 2:
        return 2
    elif n == 3 or n == 6:
        return 0
    if n > 3:
        return f(n - 1) + f(n - 2) + f(n - 3)


print(f(10))
