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
      shcool: String,
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

// create model
const User = mongoose.model('User', userSchema);

const save_user = fileds => {
  const user = new User(fileds);
  user.save().catch(res => {
    console.log(`save ${res.name}`);
  });
}

db.on('error', console.error);
db.once('open', () => {
  console.log('mongoDB open');
});

module.exports = {
  db,
  save_user
};
