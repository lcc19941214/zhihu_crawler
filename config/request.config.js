module.exports = {
  url: {
    userInfo: 'https://www.zhihu.com/people/{{usertoken}}/activities',
    followees: 'https://www.zhihu.com/api/v4/members/{{usertoken}}/followees?include=data%5B*%5D.answer_count%2Carticles_count%2Cfollower_count%2Cis_followed%2Cis_following%2Cbadge%5B%3F(type%3Dbest_answerer)%5D.topics&offset={{offset}}&limit={{limit}}',
    questions: 'https://www.zhihu.com/api/v4/members/{{usertoken}}/following-questions?include=data%5B%2A%5D.created%2Canswer_count%2Cfollower_count%2Cauthor&limit=10&offset=0'
  },
  options: {
    method: 'GET',
    headers: require('./headers.config.js')
  }
};
