module.exports = {
  url: {
    userInfo: 'https://www.zhihu.com/people/{{usertoken}}/',
    followees: 'https://www.zhihu.com/api/v4/members/{{usertoken}}/followees?include=data%5B*%5D.answer_count%2Carticles_count%2Cfollower_count%2Cis_followed%2Cis_following%2Cbadge%5B%3F(type%3Dbest_answerer)%5D.topics&offset={{offset}}&limit={{limit}}',
    activities: 'https://www.zhihu.com/api/v4/members/{{usertoken}}/activities?limit=20&after_id={{after_id}}&desktop=True'
  },
  options: {
    method: 'GET',
    headers: require('./headers.config.js')
  }
};
