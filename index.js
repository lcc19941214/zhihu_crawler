const MODE = process.env.MODE;
const CONTINUE = process.env.CONTINUE === 'true';
const config = JSON.parse(process.env.npm_config_argv || '{}');
const { remain = [] } = config;

const CONFIG_ARGV = {};
remain.forEach(arg => {
  const rst = arg.split('=');
  if (rst[0]) {
    CONFIG_ARGV[rst[0]] = rst[1] || !!rst[1];
  }
});

console.log(`MODE: ${MODE}`); // development production

const requestOptions = require('./config/request.config.js');
const Crawler = require('./crawler.js');
const Queue = require('queue');
const {
  red,
  red_crawl_user,
  check_usertoken,
  REQUEST_QUEUE,
  QUESTION_QUEUE,
  CRAWLED_SET
} = require('./config/redis.config.js');

let USER_COUNT = 0;
let QUESTION_COUNT = 0;

const CONCURRENCY = CONFIG_ARGV.current || 5;
const FOLLOWEES_LIMIT = CONFIG_ARGV.limit || 50000;
const TIMEOUT = CONFIG_ARGV.timeout || 5000;
let FOLLOWEES_REACHED_LIMIT = false;

const startTime = new Date();
console.log(`[${startTime.toLocaleString()}] start`);
console.log(`limit: ${FOLLOWEES_LIMIT}`);

const crawler = new Crawler({
  queue: {
    user: new Queue({
      timeout: TIMEOUT,
      concurrency: CONCURRENCY
    }),
    question: new Queue({
      timeout: TIMEOUT,
      concurrency: CONCURRENCY
    })
  }
});

Object.keys(crawler.queue).forEach(queueName => {
  crawler.queue[queueName].on('end', err => {
    if (err) {
      console.log(err);
    } else {
      // execute at 60s passed all task in this queue processed
      setTimeout(() => {
        const endTime = new Date();
        const timeSpent = ((endTime - startTime) / 1000).toFixed(2);
        const msg = `[${endTime.toLocaleString()}] ${queueName} task done; time: ${timeSpent}s`;
        console.log(msg);
      }, 1000 * 60);
    }
  });
})

// entry
// craw user info
function start_crawl(usertoken) {
  const { userInfo } = requestOptions.url;
  const options = Object.assign({}, requestOptions.options, {
    url: userInfo.replace('{{usertoken}}', usertoken)
  });
  crawler.fetch({ usertoken }, options)
    .then(res => {
      crawler.parseContent(res).catch(err => {
        console.log(err);
      });

      // followees limited flag
      if (!FOLLOWEES_REACHED_LIMIT) {
        red.scardAsync(CRAWLED_SET).then(len => {
          if (len > FOLLOWEES_LIMIT) {
            FOLLOWEES_REACHED_LIMIT = true;
            console.log('up to limit');
            new_slave();
          } else {
            crawler.queue.user.push(() => {
              start_followees(usertoken);
            });
          }
        });
      } else {
        new_slave();
      }
    })
    .catch(err => {
      console.log(err);
      new_slave();
    });
}

// craw user followees
function start_followees(usertoken, offset = 0, limit = 20) {
  const { followees } = requestOptions.url;
  const options = Object.assign({}, requestOptions.options, {
    url: followees.replace('{{usertoken}}', usertoken)
      .replace('{{offset}}', offset)
      .replace('{{limit}}', limit)
  });

  crawler.fetch({ usertoken, offset, limit }, options)
    .then(res => crawler.parseFolloweeData(res))
    .catch(err => {
      console.log(err);
      new_slave();
    })
    .then(totals => {
      // loop
      if (offset + limit < totals) {
        crawler.queue.user.push(() => {
          start_followees(usertoken, offset + limit);
        });
        while (crawler.queue.user.length < CONCURRENCY) {
          crawler.queue.user.push(() => {});
          new_slave();
        }
      } else {
        // after start_followees processed
        new_slave();
      }
    })
    .catch(err => {
      console.log(err);
      new_slave();
    });
}

// crawl user questions
function start_questions(usertoken, next = '') {
  const { questions } = requestOptions.url;
  const url = next || questions.replace('{{usertoken}}', usertoken);
  const options = Object.assign({}, requestOptions.options, { url });
  crawler.fetch({ usertoken }, options)
    .then(res => {
      crawler.parseQuestionData(res)
        .then(({ next: nextURL, is_end }) => {
          if (!is_end) {
            crawler.queue.question.push(() => start_questions(usertoken, nextURL));
            while (crawler.queue.question.length < CONCURRENCY) {
              crawler.queue.question.push(() => {});
              new_question();
            }
          } else {
            // after start_questions processed
            new_question();
          }
        })
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
      new_question();
    });
}

// start a new slave to crawl user info
function new_slave() {
  USER_COUNT++;
  count_message(USER_COUNT, { countLabel: 'user_count' });

  if (USER_COUNT > 1) {
    red.lpopAsync(REQUEST_QUEUE).then(res => {
      if (res) {
        crawler.queue.user.push(() => start_crawl(res));
      }
    })
    .catch(err => {
      console.log(err);
    });
  } else {
    // concurrency for crawling user info
    red.lrangeAsync(REQUEST_QUEUE, 0, CONCURRENCY - 1).then(res => {
      res.forEach(usertoken => {
        crawler.queue.user.push(() => start_crawl(usertoken));
      });
      red.ltrimAsync(REQUEST_QUEUE, CONCURRENCY, -1).catch((err) => {
        console.log(err);
      });
    })
    .catch(err => {
      console.log(err);
    });
  }
}

// start a new slave to crawl following questions
function new_question() {
  QUESTION_COUNT++;
  count_message(QUESTION_COUNT, { countLabel: 'user_question' });

  red.lpopAsync(QUESTION_QUEUE).then(res => {
    if (res) {
      crawler.queue.question.push(() => start_questions(res));
    }
  })
  .catch(err => {
    console.log(err);
  });
}

// counter
function count_message(count, params = {}) {
  const countLabel = params.countLabel || 'count';
  if (count % CONCURRENCY === 0) {
    const now = new Date();
    const timeSpent = ((now - startTime) / 1000).toFixed(2);
    const recordPerMinute = (count / timeSpent * 60).toFixed(2);
    const msg = `[${now.toLocaleString()}] ${countLabel}: ${count}; time: ${timeSpent}s; ${recordPerMinute}/min`;
    console.log(msg);
  }
}

function launch(usertoken = CONFIG_ARGV.usertoken || 'achuan') {
  const start = () => {
    red.lpopAsync(REQUEST_QUEUE).then(res => {
      if (res) {
        crawler.queue.user.push(() => start_crawl(res));
        crawler.queue.user.start();
      }
    })
    .catch(err => {
      console.log(err);
    });
  }

  if (!CONTINUE) {
    red.lpush(REQUEST_QUEUE, usertoken);
    start();
  } else {
    start();
  }
}

function launch_question() {
  red.lpopAsync(QUESTION_QUEUE).then(res => {
    if (res) {
      crawler.queue.question.push(() => start_questions(res));
      crawler.queue.question.start();
    }
  })
  .catch(err => {
    console.log(err);
  });
}

launch_question();
launch();
