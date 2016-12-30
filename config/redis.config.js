const MODE = process.env.MODE;

const redisDB = MODE === 'production' ? 2 : 1
console.log(`redisDB: ${redisDB}`); // development redisDB: 1

const redis = require('redis');
const bluebird = require('bluebird');

// promised redis
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const USER_TO_CRAWL = 'user_to_crawl';
const USER_HAS_CRAWLED = 'user_has_crawled';
const QUESTION_TO_CRAWL = 'question_to_crawl';
const QUESTION_HAS_CRAWLED = 'question_has_crawled';

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
  client.lpush(USER_TO_CRAWL, usertoken);
}

const check_usertoken = usertoken => {
  // check wether usertoken is in user_has_crawled or not
  client.saddAsync(USER_HAS_CRAWLED, usertoken).then(res => {
    if (res) {
      client.lpush(USER_TO_CRAWL, usertoken);

      // add usertoken to question set and list
      client.saddAsync(QUESTION_HAS_CRAWLED, usertoken);
      client.lpush(QUESTION_TO_CRAWL, usertoken);
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
  USER_TO_CRAWL,
  USER_HAS_CRAWLED,
  QUESTION_TO_CRAWL,
  QUESTION_HAS_CRAWLED
};
