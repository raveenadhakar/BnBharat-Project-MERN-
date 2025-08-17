const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
const Listing = require("./listing.js");  

const userSchema = new Schema({
username: {
    type: String,
    trim: true,
    unique: false // or just remove unique property here
},

// Unique email for email + social logins
email: {
type: String,
lowercase: true,
trim: true,
unique: true,
sparse: true // allows multiple users without email (like phone-only users)
},

// For local (email/password) login
password: {
type: String
},

// Social login identifiers
googleId: {
type: String,
unique: true,
sparse: true
},

profilePic: String,

likedListings: [
{
type: Schema.Types.ObjectId,
ref: "Listing"
}
]
});

userSchema.plugin(passportLocalMongoose, {
  usernameField: 'email'
}); //automatically implement  hashcode and salting

module.exports = mongoose.model('User', userSchema);