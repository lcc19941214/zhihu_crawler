const mode = process.env.MODE;
console.log(`mode: ${mode}`); // development production

const redisDB = mode === 'production' ? 2 : 1
console.log(`redisDB: ${redisDB}`); // development redisDB: 1

const redis = require('redis');
const bluebird = require('bluebird');

// promised redis
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const REQUEST_QUEUE = 'user_to_crawl';
const CRAWLED_SET = 'user_has_crawled';

// connect with redis
const client = redis.createClient({
  host: '127.0.0.1',
  port: '6379',
  db: redisDB
});

client.on('error', err => {
  console.log('Redis Error ' + err);
});

const red_crawl_user = usertoken => {
  client.lpush(REQUEST_QUEUE, usertoken);
}

const check_usertoken = usertoken => {
  // check wether usertoken is in user_has_crawled or not
  client.saddAsync(CRAWLED_SET, usertoken).then(res => {
    if (res) {
      client.lpush(REQUEST_QUEUE, usertoken);
    }
  })
  .catch(err => {
    console.log(err);
  });
}

module.exports = {
  red: client,
  red_crawl_user,
  check_usertoken,
  REQUEST_QUEUE,
  CRAWLED_SET
};
