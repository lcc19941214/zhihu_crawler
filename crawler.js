const request = require('request');
const cheerio = require('cheerio');

const {
  red,
  red_crawl_user,
  check_usertoken,
  REQUEST_QUEUE,
  CRAWLED_SET
} = require('./config/redis.config.js');

const {
  db,
  save_user
} = require('./db.js');

// zhihu crawler
class Crawler {
  constructor(values) {
    this.queue = values.queue;
  }

  fetch(params, options) {
    const fetchPromise = new Promise((resolve, reject) => {
      request(options, (err, res, body) => {
        if (err) {
          reject(err)
        } else {
          resolve({ params, body });
        }
      });
    });
    return fetchPromise;
  }

  // parse user info
  parseContent({ params, body }) {
    const parsePromise = new Promise((resolve, reject) => {
      try {
        const $ = cheerio.load(body);

        // read state from store
        // zhihu render the page on server side
        const data = $('#data').data('state');
        const { entities } = data;
        const { users } = entities;
        const username = Object.keys(users).filter(token => token === params.usertoken)[0];
        const user = users[username];
        if (user) {
          let {
              name,
              headline,
              business = {},
              educations = [],
              employments = [],
              gender,         // number 0: female; 1: male
              locations,      // [],
              followingCount, // 关注的
              followerCount,  // 关注者
              questionCount,  // 提问
              thankedCount,   // 感谢
              answerCount,    // 回答
              voteupCount,    // 点赞
              markedAnswersCount // 知乎收录
          } = user;

          business = business ? (business.name || '')  : '';
          educations = educations ? educations.map(({ school = {}, major = {} }) => ({
            school: school.name || '',
            major: major.name || ''
          })) : [];
          employments = employments ? employments.map(({ company = {}, job = {} }) => ({
            company: company.name || '',
            job: job.name || ''
          })) : [];
          locations = locations.map(v => v.name);

          console.log(`${name} ${business}`);

          // write info to db
          save_user({
            name,
            headline,
            business,
            educations,
            employments,
            gender,
            locations,
            followingCount,
            followerCount,
            questionCount,
            thankedCount,
            answerCount,
            voteupCount,
            markedAnswersCount,
            usertoken: params.usertoken
          });
        }
      } catch (err) {
        console.log(err);
      }
    })
    return parsePromise;
  }

  parseActivityData({ params, body = '{}' }) {
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
  parseFolloweeData({ params, body }) {
    const parsePromise = new Promise((resolve, reject) => {
      try {
        const res = JSON.parse(body || '{}');
        const { paging, data } = res;
        const { totals } = paging;
        const { usertoken, offset, limit } = params;

        // store uncrawled usertoken into redis_queue_user_to_crawl
        data.forEach(user => {
          check_usertoken(user.url_token);
        });

        // console.log(`${usertoken} ${offset + data.length}/${totals}`);

        resolve(totals);
      } catch (err) {
        reject(err);
      }
    });
    return parsePromise;
  }
}

module.exports = Crawler;
