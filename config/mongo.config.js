const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create schema
const userSchema = new Schema({
  // usertoken: {
  //   type: String,
  //   index: true,
  //   unique: true
  // },
  username: {
    type: String,
    index: true,
    unique: true
  },
  headline: String,
  gender: Number,
  educations: [{ shcool: String, major: String }]
});
const followeesSchema = new Schema({
  name: String,
  age: Number
});

// create model
const User = mongoose.model('User', userSchema);
const Followees = mongoose.model('Followees', followeesSchema);

mongoose.connect('mongodb://localhost/test');
const db = mongoose.connection;

var userList = [
  {
    username: 'chengchuan',
    headline: 'i m i1',
    gender: 1,
    educations: [
      {
        shcool: 'WHU',
        major: 'communication'
      }
    ]
  },
  {
    username: 'mali',
    headline: 'i m i12',
    gender: 0,
    educations: [
      {
        shcool: 'PKU'
      }
    ]
  },
  {
    username: 'wanghongwei',
    headline: 'i m i13',
    gender: 1
  },
  {
    username: 'mali',
    headline: 'answer',
    gender: 1,
    educations: [
      {
        shcool: 'YALE',
        major: 'economy'
      }
    ]
  }
]

db.on('error', console.error);
db.once('open', () => {
  userList.forEach(user => {
    let userEntity = new User(user);
    userEntity.save().catch(err => {
      console.log(err);
    });
  });

  new Followees({
    username: 'huangjian',
    age: 25
  }).save();
});


// module.exports = {
//
// };
