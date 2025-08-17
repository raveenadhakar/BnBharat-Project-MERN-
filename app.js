require("dotenv").config();
require("./config/passport.js");

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require('ejs-mate');
const ExpressError = require("./utils/ExpressError.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const authRoutes = require("./routes/auth.js");

const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require('passport-local');

const User = require("./models/user.js");

const dbUrl = process.env.ATLASDB_URL 
main()
.then((res) => {
    console.log("connection successful");
})
.catch(err => {
    console.log(err)
});

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine" , "ejs");
app.set("views" , path.join(__dirname , "views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));

app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname , "/public")));
app.use('/fontawesome', express.static(__dirname + '/node_modules/@fortawesome/fontawesome-free'));
app.use(express.json());


const store = MongoStore.create({
    mongoUrl: dbUrl,    
    crypto: {
    secret: process.env.SECRET 
  },
  touchAfter: 24 * 3600, // time period in seconds after which the session will be updated
});

store.on("error" , ()=>{
    console.log("Session error in MONGO STORE SESSION" , err)
})

const sessionOptions = {
    store,
    secret : process.env.SECRET ,
    resave : false,
    saveUninitialized : true,
    cookie : {
        expires : new Date( Date.now() + 30 * 24 * 60 * 60 * 1000) , //1 week
        maxAge :  30 * 24 * 60 * 60 * 1000 ,
        httpOnly : true,
    },
};

app.use(session(sessionOptions));
app.use(flash()); //use before routes

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));


//middleware for flash
app.use((req, res, next) => {
    res.locals.currentUser = req.user; //ejs me direct req.user nahi likh skte
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
})

app.use("/listings" , listingRouter);
app.use("/listings/:id/reviews" , reviewRouter);
app.use("/", authRoutes);


// 404 handler
app.use((req, res, next) => {
    next(new ExpressError(404, "Page not Found!"));
});

// Error handling middleware
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { statusCode, message });
});


//server start -> on port 9080
app.listen(9080 , () => {
    console.log("server is listening to port 9080");
});















































































// app.get("/testlisting" , async (req, res) => {
//     let samplelisting = new Listing({
//         title: "Test Listing",
//         description: "This is a test listing",
//         //image: "https://unsplash.com/photos/a-person-swimming-in-the-ocean-with-a-camera-NhWxAIs61MM",
//         price: 100,
//         location: "Test Location",
//         country: "Test Country"
//     });
    
//     await samplelisting.save();
    
//     console.log("Sample listing created:", samplelisting);
//     res.send("Sample listing created successfully");

// }); 


// Sample code to create a listing and test the timestamps

//app.get("/testlisting", async (req, res) => {
//   // Create new listing
//   let newListing = new Listing({
//     title: "Cozy Villa Near Lake Pichola",
//     description: "A beautiful villa with stunning lake views, perfect for a relaxing getaway.",
//     pricePerNight: 3500,
//     discount: 10,
//     propertyType: "Villa",
//     guests: 6,
//     bedrooms: 3,
//     beds: 4,
//     bathrooms: 2,
//     amenities: ["WiFi", "Air Conditioning", "Pool"],
//     location: "Udaipur Old City",
//     country: "India",
//     rules: ["No smoking", "No pets", "No non-vegetarian food"],
//     isAvailable: true
//   });

//  await newListing.save();

//   console.log("Created At:", newListing.createdAt);
//   console.log("Updated At:", newListing.updatedAt);

//   res.send("Sample listing created");
//   const listing = await Listing.findOne({ title: "Cozy Villa Near Lake Pichola" });
// listing.pricePerNight = 4000;
// await listing.save();

// console.log("After update - Updated At:", listing.updatedAt);

// });



// await newListing.save();
// console.log("Listing saved:", newListing);

// res.send("Listing created successfully");}); 