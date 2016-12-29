const request = require('request');
const cheerio = require('cheerio');
const {
  red,
  red_crawl_user,
  check_usertoken,
  REQUEST_QUEUE,
  CRAWLED_SET
} = require('./config/redis.config.js');

class Crawler {
  constructor(values) {
    this.queue = values.queue;
  }

  fetch(params, options, cb) {
    request(options, (err, res, body) => {
      if (err) throw err;
      cb({ params, body });
    });
  }

  // parse user info
  parseContent({ params, body }, cb) {
    const $ = cheerio.load(body);
    const user_name = $('.App-main .ProfileHeader-name').text();
    const user_text = $('.App-main .ProfileHeader-headline').text();
    const infoItems = $('.App-main .ProfileHeader-info .ProfileHeader-infoItem');
    const info = [];
    infoItems.each(function(i, elem) {
      let item = [];
      $(this).contents().each(function(i, elem) {
        if ($(this)[0].type === 'text') {
          item.push($(this).text());
        }
      });
      item.length && info.push(item);
    });

    // console.log(JSON.stringify({
    //   user_name, user_text, info,
    //   usertoken: params.usertoken
    // }));

    // 写入数据库
  }

  parseActivityData({ params, body = '{}' }, cb) {
    try {
      // limit 默认为20
      const res = JSON.parse(body);
      const { paging, data } = res;
      const { is_end } = paging;
      const { usertoken, after_id } = params;

      // 时间到期之后停止循环
      // 没有动态之后停止循环
      let stop = paging.is_end;

      let activities = data.filter(v => {
        // 校验类型和时间
        let flag = false;
        const typeValid = v.verb === 'QUESTION_FOLLOW';
        if (typeValid) {
          const compare = parseInt(new Date('2015-12-31 23:59:59').toString().slice(0, 10), 10);
          if (v.created_time > compare) {
            flag = true;
          } else {
            stop = true;
          }
        }
        return flag;
      });

      // console.log(activities);

      if (!stop) {
        activities = activities.map(active => ({
          title: active.target.title,
          url: active.target.url,
          answer_count: active.target.answer_count,
          comment_count: active.target.comment_count,
          follower_count: active.target.follower_count,
          created_time: new Date(parseInt(active.created_time.toString().slice(0, 10) + '000', 10))
        }));

        // console.log(JSON.stringify(activities));
        // console.log(JSON.stringify(activities.map(v => v.title)));

        const next_id = paging.next.match(/after_id=([0-9]{10})/)[1];
        if (next_id) {
          this.queue.push(cb.bind(null, usertoken, next_id ));
        }
      } else {
        // 只爬取一年以内的动态
      }
    } catch(e) {
      this.queue.push(cb.bind(null, usertoken, after_id));
    }
  }

  // parse followees data
  parseFolloweeData({ params, body }, cb) {
    const res = JSON.parse(body || '{}');
    const { paging, data } = res;
    const { totals } = paging;
    const { usertoken, offset, limit } = params;

    // store uncrawled usertoken into redis_queue_user_to_crawl
    data.forEach(user => {
      check_usertoken(user.url_token);
    });

    console.log(`${usertoken} ${offset + data.length}/${totals}`);

    cb(totals);
  }
}

module.exports = Crawler;
