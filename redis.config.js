const redis = require('redis');

const REQUEST_QUEUE = 'user_to_crawl';
const CRAWLED_SET = 'user_has_crawled';

const client = redis.createClient({
  host: '127.0.0.1',
  port: '6379',
  db: 1
});

client.on('error', err => {
  console.log('Redis Error ' + err);
});

const red_crawl_user = usertoken => {
  client.lpush(REQUEST_QUEUE, usertoken);
}

const check_usertoken = usertoken => {
  // 已爬取集合没有该usertoken，则加入到未爬取列表
  client.sadd(CRAWLED_SET, usertoken, (err, res) => {
    if (err) return;

    if (res) {
      client.lpush(REQUEST_QUEUE, usertoken);
    }
  });
}

module.exports = {
  red: client,
  red_crawl_user,
  check_usertoken,
  REQUEST_QUEUE,
  CRAWLED_SET
};
