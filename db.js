const { mongoose, db } = require('./config/mongo.config.js');
const Schema = mongoose.Schema;

// create db schema
const userSchema = new Schema({
  name: String,
  usertoken: String,
  headline: String,
  business: String,
  educations: [
    {
      school: String,
      major: String
    }
  ],
  employments: [
    {
      company: String,
      job: String
    }
  ],
  gender: Number,
  locations: [String],
  followingCount: Number,
  followerCount: Number,
  questionCount: Number,
  thankedCount: Number,
  answerCount: Number,
  voteupCount: Number,
  markedAnswersCount: Number
});
const followingQuestionSchema = new Schema({
  title: String,
  usertoken: String,
  question_id: Number,
  answer_count: Number,
  follower_count: Number,
  created_time: Date,
  author: {
    name: String,
    usertoken: String
  }
});

// create model
const User = mongoose.model('User', userSchema);
const FollowingQuestion = mongoose.model('FollowingQuestion', followingQuestionSchema);

// store data
const save_user = fileds => {
  const user = new User(fileds);
  user.save().catch(res => {
    // compatible with old model without usertoken
    console.error(`save data failed: ${res.usertoken || res.name}`);
  });
}
const save_question = fileds => {
  const question = new FollowingQuestion(fileds);
  question.save().catch(res => {
    console.error(`save data failed: ${res.usertoken}`);
  });
}

db.on('error', console.error);
db.once('open', () => {
  console.log('mongoDB open');
});

module.exports = {
  db,
  save_user,
  save_question
};
