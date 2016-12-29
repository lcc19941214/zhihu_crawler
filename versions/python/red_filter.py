# -*- coding: utf-8 -*-
# encoding:utf-8

import sys
reload(sys)
sys.setdefaultencoding("utf-8")

import redis

# 待爬取列表
red_queue = "the_test_the_url_queue"
# 已经爬取的集合
red_crawled_set = "the_test_url_has_crawled"

# connect to redis server
red = redis.Redis(host='localhost', port=6379, db=1)

# 在待取列表插入url
def re_crawl_url(url):
    red.lpush(red_queue, url)

# 已爬取的集合
def check_url(url):
    # 如果没有爬取过，就注入到待爬取列表
    if red.sadd(red_crawled_set, url):
        red.lpush(red_queue, url)
