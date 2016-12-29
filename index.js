const requestOptions = require('./config/request.config.js');
const Crawler = require('./crawler.js');
const Queue = require('queue');
const {
  red,
  red_crawl_user,
  check_usertoken,
  REQUEST_QUEUE,
  CRAWLED_SET
} = require('./config/redis.config.js');

const CONCURRENCY = 5;
let COUNT = 0;
let FOLLOWEES_REACHED_LIMIT = false;
let FOLLOWEES_LIMIT = 150000;

const startTime = new Date();
console.log(`[${startTime.toLocaleString()}] start`);

const queue = new Queue({
  timeout: 5000,
  concurrency: CONCURRENCY
});
const crawler = new Crawler({ queue });

crawler.queue.on('end', err => {
  if (err) {
    console.log('queue end: ' + err);
  } else {
    // execute at 60s passed queue_end_time
    setTimeout(() => {
      const endTime = new Date();
      const msg = `[${endTime.toLocaleString()}] count: ${COUNT}; time: ${(endTime - startTime)/1000}s`;
      console.log(msg);
      console.log(('all task done'));
    }, 1000 * 60);
  }
});

// entry
// craw user info
function start_crawl (usertoken) {
  const { userInfo } = requestOptions.url;
  const options = Object.assign({}, requestOptions.options, {
    url: userInfo.replace('{{usertoken}}', usertoken)
  });
  crawler.fetch({ usertoken }, options, (res) => {
    crawler.parseContent(res);

    // followees limited flag
    if (!FOLLOWEES_REACHED_LIMIT) {
      crawler.queue.push(() => {
        start_followees(usertoken);
      });
    } else {
      new_slave();
    }

    // crawler.queue.push(() => {
    //   start_activities(usertoken);
    // });
  });
}

// craw user followees
function start_followees (usertoken, offset = 0, limit = 20) {
  const { followees } = requestOptions.url;
  const options = Object.assign({}, requestOptions.options, {
    url: followees.replace('{{usertoken}}', usertoken)
      .replace('{{offset}}', offset)
      .replace('{{limit}}', limit)
  });

  crawler.fetch({ usertoken, offset, limit }, options, (res) => {
    // loop
    crawler.parseFolloweeData(res, (totals) => {
      if (offset + limit < totals) {
        crawler.queue.push(() => {
          start_followees(usertoken, offset + limit);
        });
      } else {
        // after start_followees exacutes
        red.llenAsync(REQUEST_QUEUE).then(res => {
          new_slave();

          if (res > FOLLOWEES_LIMIT) {
            FOLLOWEES_REACHED_LIMIT = true;
          }
        });
      }
    });
  });
}

// crawl user activities
function start_activities (usertoken, after_id = new Date().getTime()) {
  const { activities } = requestOptions.url;
  const options = Object.assign({}, requestOptions.options, {
    url: activities.replace('{{usertoken}}', usertoken)
      .replace('{{after_id}}', after_id.toString().slice(0, 10))
  });
  crawler.fetch({ usertoken, after_id }, options, (res) => {
    // loop
    crawler.parseActivityData(res, start_activities);
  });
}

// start a new slave to crawl user info
function new_slave () {
  COUNT++;
  count_message(COUNT);

  if (COUNT > 1) {
    red.lpopAsync(REQUEST_QUEUE).then(res => {
      crawler.queue.push(() => {
        start_crawl(res);
      });
    })
    .catch(err => {
      console.log(err);
    });
  } else {
    // concurrency for crawling user info
    red.lrangeAsync(REQUEST_QUEUE, 0, 4).then(res => {
      res.forEach(usertoken => {
        crawler.queue.push(() => {
          start_crawl(usertoken);
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

// counter
function count_message(count) {
  if (count % 5 === 0) {
    const now = new Date();
    const msg = `[${now.toLocaleString()}] count: ${count}; time: ${(now - startTime)/1000}s`;
    console.log(msg);
  }
}

red.lpush(REQUEST_QUEUE, 'achuan');
red.lpopAsync(REQUEST_QUEUE).then(res => {
  crawler.queue.push(() => start_crawl(res));
  crawler.queue.start();
})
.catch(err => {
  console.log(err);
});
