const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn , validateListing, isOwner} = require("../middleware.js");
const multer  = require('multer')
const {storage } = require("../config/cloudConfig.js");
const upload = multer({ storage })

const listingController = require("../controllers/listings.js");


// ======================
//INDEX ROUTE
// ======================
router.get("/" , wrapAsync(listingController.index));


// ======================
// View user's liked listings
// ======================
router.get("/liked", isLoggedIn, wrapAsync(listingController.viewLikedListings));


// ======================
//NEW ROUTE
// ======================
router.get("/new" , isLoggedIn, wrapAsync(listingController.renderNewListing));


// ======================
// SHOW ROUTE
// ======================
router.get("/:id", wrapAsync(listingController.showListing));


// ======================
//CREATE ROUTE
// ======================
router.post("/", 
    isLoggedIn, 
    validateListing, 
    upload.array('listing[images][]', 12),
    wrapAsync(listingController.createListing
));


// ======================
//EDIT ROUTE
// ======================
router.get("/:id/edit" , 
    isLoggedIn, 
    isOwner,
    validateListing ,
    wrapAsync(listingController.renderEditForm)); 


// ======================
//UPDATE ROUTE
// ======================
router.put("/:id" , 
    isLoggedIn, 
    isOwner,
    upload.array('listing[images][]', 12),
    wrapAsync(listingController.updateListing
));


// Toggle like/unlike listing
router.post("/:id/like", isLoggedIn, wrapAsync(listingController.toggleLike));


// ======================
//DELETE ROUTE
// ======================
router.delete("/:id" , isLoggedIn,isOwner, wrapAsync(  listingController.destroyListing));

module.exports = router;