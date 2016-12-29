const MODE = process.env.MODE;

const mongoDB = MODE === 'production' ? 'zhihu_crawl' : 'test';
console.log(`mongoDB: ${mongoDB}`);

const mongoose = require('mongoose');
const bluebird = require('bluebird');

// promised mongoose
mongoose.Promise = bluebird;

mongoose.connect(`mongodb://localhost/${mongoDB}`);
const db = mongoose.connection;

module.exports = {
  mongoose,
  db
};
