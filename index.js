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

const CONCURRENCY = 5;
let COUNT = 0;

const queue = new Queue({
  timeout: 5000,
  concurrency: CONCURRENCY
});
const crawler = new Crawler({
  queue
});

const startTime = new Date();
console.log(`${startTime.toLocaleString()}: start`);

// 入口
// 用户基本信息
function start_people (usertoken) {
  const { userInfo } = requestOptions.url;
  const options = Object.assign({}, requestOptions.options, {
    url: userInfo.replace('{{usertoken}}', usertoken)
  });
  crawler.fetch({ usertoken }, options, (res) => {
    crawler.parseContent(res);

    // 待爬取人数每达到5000, 只爬用户信息

    crawler.queue.push(() => {
      start_followees(usertoken);
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
    crawler.parseFolloweeData(res, (totals) => {
      if (offset + limit < totals) {
        crawler.queue.push(() => {
          start_followees(usertoken, offset + limit);
        })
      } else {
        // 同一个人的关注列表爬取结束后执行
        after_followees();
      }
    });
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
  COUNT++;
  count_message(COUNT);
  if (COUNT > 1) {
    red.lpopAsync(REQUEST_QUEUE).then(res => {
      crawler.queue.push(() => {
        start_people(res);
      });
    })
    .catch(err => {
      console.log(err);
    });
  } else {
    // 同时并发
    red.lrangeAsync(REQUEST_QUEUE, 0, 4).then(res => {
      res.forEach(usertoken => {
        crawler.queue.push(() => {
          start_people(usertoken);
        });
      });
      red.ltrimAsync(REQUEST_QUEUE, 5, -1).catch((err) => {
        console.log('trim queue error ' + err);
      });
    })
    .catch(err => {
      console.log(err);
    });
  }
}

// 计数器
function count_message(count) {
  if (count % 5 === 0) {
    const now = new Date();
    const msg = `${now.toLocaleString()}: count: ${count}; time: ${(now - startTime)/1000}s`;
    console.log(msg);
  }
}

red.lpush(REQUEST_QUEUE, 'achuan');
red.lpopAsync(REQUEST_QUEUE).then(res => {
  crawler.queue.push(() => start_people(res));
  crawler.queue.start();
})
.catch(err => {
  console.log(err);
});
