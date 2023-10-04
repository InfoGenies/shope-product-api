
const mongoose =  require("mongoose")
const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
  email: { type: String, required: true,  unique: true,
    match: [ /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Invalid email address!']},
  password: { type: String, required: true },
  picture: { type: String, required: false },
  username: { type: String, required: true },
  phone: { type: String, required: false },
  language: { type: String, required: false },
  aboutMe: { type: String, required: false },
  userType: { type: String, required: true },
  dateJoined: { type: Date,default: Date.now}
});

module.exports = mongoose.model('User',userSchema)