const commonHeaders = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Cache-Control': 'max-age=0',
  'Connection': 'keep-alive',
  'Cookie': 'd_c0="ACACqaDo3AqPTnE3iHXXAiRH_KNPf3Wf6Wg=|1479403623"; _zap=4456d64e-715b-4c76-94b5-025786fa6a9f; q_c1=813ed8f7d064404b95b0d1e44577f0ca|1482337573000|1479403621000; l_cap_id="ODAyZjI1NDYyOGFlNDE4OGFiNDcxYzY4NjViNzhlZjE=|1482651485|dbd729b760a5e420becc5c94544a95210e6ef1eb"; cap_id="ZjEwYWMyOTVlNTUzNDJhNThlMDFmZmY0YjRkYmViZmE=|1482651485|05b03a6785b0d5736a9073fc812970e31ec62995"; r_cap_id="MDY2MmQ3NDFmMzdhNDMxMjk3ZmZjNzNlZGI3OGViYjE=|1482651486|617c026f7e7aaeee8ef549c1617928163fa955d1"; _xsrf=9158360c60a6c296b966d77e7f8a3345; __utma=155987696.117374451.1482857353.1482857353.1482857353.1; __utmz=155987696.1482857353.1.1.utmcsr=zhihu.com|utmccn=(referral)|utmcmd=referral|utmcct=/; z_c0=Mi4wQVBBQ25HUE53d2NBSUFLcG9PamNDaGNBQUFCaEFsVk4xd1NIV0FDTHdMYUFKY245MEVoaUJLQVBxUm5qeE5SZEV3|1482858449|d95f0b64b19b270b8b3f7207530551bc4ecbd6a1',
  'Host': 'www.zhihu.com',
  'Upgrade-Insecure-Requests': '1',
  'authorization': 'Bearer Mi4wQVBBQ25HUE53d2NBSUFLcG9PamNDaGNBQUFCaEFsVk4xd1NIV0FDTHdMYUFKY245MEVoaUJLQVBxUm5qeE5SZEV3|1482858449|d95f0b64b19b270b8b3f7207530551bc4ecbd6a1',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
};

module.exports = {
  url: {
    userInfo: 'https://www.zhihu.com/people/{{usertoken}}/',
    followees: 'https://www.zhihu.com/api/v4/members/{{usertoken}}/followees?include=data%5B*%5D.answer_count%2Carticles_count%2Cfollower_count%2Cis_followed%2Cis_following%2Cbadge%5B%3F(type%3Dbest_answerer)%5D.topics&offset={{offset}}&limit={{limit}}',
    activities: 'https://www.zhihu.com/api/v4/members/{{usertoken}}/activities?limit=20&after_id={{after_id}}&desktop=True'
  },
  options: {
    method: 'GET',
    headers: commonHeaders
  }
};
