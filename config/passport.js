const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");

passport.use(new LocalStrategy(User.authenticate()));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = new User({
            username: profile.displayName,
            googleId: profile.id,
            email: profile.emails[0].value,
          });
          await user.save();
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

// Session setup
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
