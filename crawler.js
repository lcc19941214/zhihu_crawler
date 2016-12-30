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
  save_user,
  save_question
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
          reject(err);
        } else {
          resolve({ params, body, res });
        }
      });
    });
    return fetchPromise;
  }

  // parse user info
  parseContent({ params, body, res }) {
    const parsePromise = new Promise((resolve, reject) => {
      if (body) {
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
            const {
                business = {},
                educations = [],
                employments = [],
                locations = []
            } = user;

            // console.log(`${name} ${business}`);

            // write info to db
            save_user({
              name: user.name,
              headline: user.headline,
              business: business ? (business.name || '') : '',
              educations: educations ? educations.map(({ school = {}, major = {} }) => ({
                school: school.name || '',
                major: major.name || ''
              })) : [],
              employments: employments ? employments.map(({ company = {}, job = {} }) => ({
                company: company.name || '',
                job: job.name || ''
              })) : [],
              gender: user.gender,
              locations: locations.map(v => v.name),
              followingCount: user.followingCount,
              followerCount: user.followerCount,
              questionCount: user.questionCount,
              thankedCount: user.thankedCount,
              answerCount: user.answerCount,
              voteupCount: user.voteupCount,
              markedAnswersCount: user.markedAnswersCount,
              usertoken: params.usertoken
            });
          }
        } catch (err) {
          reject(err);
        }
      } else {
        const err = `status: ${res.statusCode}; msg: ${res.statusMessage};\n usertoken: ${params.usertoken}`;
        reject(new Error(err));
      }
    });
    return parsePromise;
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

  // parse following question
  parseActivityData({ params, body = '{}' }) {
    const parsePromise = new Promise((resolve, reject) => {
      try {
        const res = JSON.parse(body);
        const { paging, data } = res;
        const { is_end, next } = paging;
        const { usertoken } = params;

        data.forEach(question => {
          save_question({
            usertoken,
            title: question.title,
            question_id: question.id,
            answer_count: question.answer_count,
            follower_count: question.follower_count,
            created_time: new Date(parseInt(question.created.toString().slice(0, 10) + '000', 10)),
            author: {
              name: question.author.name,
              usertoken: question.author.url_token
            }
          });
        });

        resolve({ next, is_end });
      } catch(err) {
        reject(err);
      }
    });
    return parsePromise;
  }
}

module.exports = Crawler;
