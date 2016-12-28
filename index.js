const requestOptions = require('./request.config.js');
const { Crawler } = require('./crawler.js');
const { Queue } = require('./queue.js');

const queue = new Queue();
const usertokens = [
  // 'jin-wei-37',
  'achuan',
  // 'mali'
];

console.log('初始化爬虫函数');
const crawler = new Crawler({
  queue
});

const startTime = new Date();
console.log(startTime.toLocaleString());

// 入口
// 用户基本信息
function start_people (usertoken) {
  const { userInfo } = requestOptions.url;
  const options = Object.assign({}, requestOptions.options, {
    url: userInfo.replace('{{usertoken}}', usertoken)
  });
  crawler.fetch({ usertoken }, options, (res) => {
    crawler.parseContent(res);
    // start_followees(usertoken);
    start_activities(usertoken);
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

usertokens.forEach(usertoken => {
  queue.task(start_people.bind(null, usertoken));
});

queue.start();

