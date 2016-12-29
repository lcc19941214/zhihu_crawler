const MODE = process.env.MODE;

const mongoDB = MODE === 'production' ? 'zhihu_crawl' : 'test';
console.log(`mongoDB: ${mongoDB}`);

const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test');
const db = mongoose.connection;

module.exports = {
  mongoose,
  db
};
