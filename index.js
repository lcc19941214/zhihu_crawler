const requestOptions = require('./request.config.js');
const Crawler = require('./crawler.js');
const Queue = require('queue');
const {
  red,
  red_crawl_user,
  check_usertoken,
  REQUEST_QUEUE,
  CRAWLED_SET
} = require('./redis.config.js');

const queue = new Queue({
  timeout: 5000,
  concurrency: 5
});
const crawler = new Crawler({
  queue
});

console.log('start');

const startTime = new Date();
console.log(startTime.toLocaleString());

// const usertokens = [
//   'jin-wei-37',
//   'achuan',
//   'mali'
// ];

// 入口
// 用户基本信息
function start_people (usertoken) {
  const { userInfo } = requestOptions.url;
  const options = Object.assign({}, requestOptions.options, {
    url: userInfo.replace('{{usertoken}}', usertoken)
  });
  crawler.fetch({ usertoken }, options, (res) => {
    crawler.parseContent(res);

    crawler.queue.push(() => {
      start_followees(usertoken, after_followees);
    });
    // crawler.queue.push(() => {
    //   start_activities(usertoken);
    // });
  });
}

// 用户关注的列表
function start_followees (usertoken, offset = 0, limit = 20) {
  const { followees } = requestOptions.url;
  const options = Object.assign({}, requestOptions.options, {
    url: followees.replace('{{usertoken}}', usertoken)
      .replace('{{offset}}', offset)
      .replace('{{limit}}', limit)
  });
  crawler.fetch({ usertoken, offset, limit }, options, (res) => {
    // 重复回调
    crawler.parseFolloweeData(res, start_followees);
  });
}

// 用户动态
function start_activities (usertoken, after_id = new Date().getTime()) {
  const { activities } = requestOptions.url;
  const options = Object.assign({}, requestOptions.options, {
    url: activities.replace('{{usertoken}}', usertoken)
      .replace('{{after_id}}', after_id.toString().slice(0, 10))
  });
  crawler.fetch({ usertoken, after_id }, options, (res) => {
    // 重复回调
    crawler.parseActivityData(res, start_activities);
  });
}

// 同一个人的关注列表爬取结束后执行回调
function after_followees () {
  red.llen(REQUEST_QUEUE, (err, res) => {
    if (res > 0) {
      const usertoken = red.lpop(REQUEST_QUEUE);
      crawler.queue.push(() => {
        start_people(usertoken);
      });
    }
  });
}

red.lpush(REQUEST_QUEUE, 'achuan');
const usertoken = red.lpop(REQUEST_QUEUE);

queue.push(() => {
  start_people(usertoken);
});

queue.start();
