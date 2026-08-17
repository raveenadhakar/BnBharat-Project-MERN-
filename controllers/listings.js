const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const ExpressError = require("../utils/ExpressError.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
    // Build filter query
    let filterQuery = {};
    
    // Price filter
    if (req.query.minPrice || req.query.maxPrice) {
        filterQuery.price = {};
        if (req.query.minPrice) filterQuery.price.$gte = parseInt(req.query.minPrice);
        if (req.query.maxPrice) filterQuery.price.$lte = parseInt(req.query.maxPrice);
    }
    
    // Property type filter
    if (req.query.propertyType && req.query.propertyType !== '') {
        filterQuery.propertyType = req.query.propertyType;
    }
    
    // Guests filter
    if (req.query.guests && req.query.guests !== '') {
        filterQuery.guests = { $gte: parseInt(req.query.guests) };
    }
    
    // Location filter (case-insensitive search)
    if (req.query.location && req.query.location.trim() !== '') {
        filterQuery.$or = [
            { location: { $regex: req.query.location, $options: 'i' } },
            { country: { $regex: req.query.location, $options: 'i' } }
        ];
    }
    
    // Search filter
    if (req.query.search && req.query.search.trim() !== '') {
        filterQuery.$or = [
            { title: { $regex: req.query.search, $options: 'i' } },
            { description: { $regex: req.query.search, $options: 'i' } },
            { location: { $regex: req.query.search, $options: 'i' } }
        ];
    }
    
    // Amenities filter
    if (req.query.amenities) {
        const amenitiesArray = Array.isArray(req.query.amenities) 
            ? req.query.amenities 
            : [req.query.amenities];
        filterQuery.amenities = { $in: amenitiesArray };
    }
    
    // Discount filter
    if (req.query.hasDiscount === 'on') {
        filterQuery.discount = { $gt: 0 };
    }
    
    // Build sort query
    let sortQuery = {};
    if (req.query.sortBy) {
        switch(req.query.sortBy) {
            case 'price_low': sortQuery = { price: 1 }; break;
            case 'price_high': sortQuery = { price: -1 }; break;
            case 'newest': sortQuery = { createdAt: -1 }; break;
            case 'oldest': sortQuery = { createdAt: 1 }; break;
            case 'title': sortQuery = { title: 1 }; break;
            default: sortQuery = { createdAt: -1 };
        }
    } else {
        sortQuery = { createdAt: -1 }; // Default sort by newest
    }
    
    // Apply filters and sorting
    const allListings = await Listing.find(filterQuery).sort(sortQuery);
    
    // Get user's liked listings
    let userLiked = [];
    if (req.user) {
        const user = await User.findById(req.user._id);
        userLiked = user.likedListings.map(id => id.toString());
    }
    
    res.render("./listings/index.ejs", {
        allListings,
        userLiked,
        filters: req.query, // Pass filters back to maintain form state
        totalResults: allListings.length
    });
}

module.exports.viewLikedListings = async (req, res) => {
    const user = await User.findById(req.user._id).populate("likedListings");
    res.render("listings/liked", { likedListings: user.likedListings });
}

module.exports.renderNewListing = async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "you must be logged in to create listing");
        return res.redirect("/login");
    }
    res.render("./listings/new.ejs");
}

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        })
        .populate("owner");
    if (!listing) {
        req.flash("error", "This listing is no longer available");
        return res.redirect("/listings");
    }
    //console.log("Listing Owner:", listing.owner);

    const totalReviews = listing.reviews.length;

    // average rating
    const avgRating = totalReviews > 0
        ? (listing.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(2)
        : 0;

    // star distribution (1-5 stars)
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    listing.reviews.forEach(r => {
        ratingCounts[r.rating]++;
    });
    const ratingPercentages = {};
    Object.keys(ratingCounts).forEach(star => {
        ratingPercentages[star] = totalReviews > 0
            ? ((ratingCounts[star] / totalReviews) * 100).toFixed(0)
            : 0;
    });

    // subratings (if you have them; else you can skip or use dummy)
    const subFields = ['cleanliness', 'accuracy', 'checkIn', 'communication', 'location', 'value'];
    const subAverages = {};
    subFields.forEach(f => {
        const total = listing.reviews.reduce((sum, r) => sum + (r[f] || 0), 0);
        subAverages[f] = totalReviews > 0 ? (total / totalReviews).toFixed(1) : 0;
    });


    res.render("./listings/show.ejs", {
        listing,
        avgRating,
        totalReviews,
        ratingPercentages,
        subAverages
    });
}

module.exports.createListing = async (req, res) => {
    let response = await geocodingClient.forwardGeocode({
    query: req.body.listing.location,
    limit: 1
    })
  .send();
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    // Map all uploaded files into { url, filename } format
    newListing.images = req.files.map(f => ({
        url: f.path,
        filename: f.filename
    }));

    newListing.geometry = response.body.features[0].geometry;

    let savedlist = await newListing.save();
    //console.log("New Listing Created:", savedlist); 
    req.flash("success", "New Listing created");
    res.redirect(`/listings/${newListing._id}`);
};


module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "This listing is no longer available");
        return res.redirect("/listings");
    }
    res.render("./listings/edit.ejs", { listing });
}

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, req.body.listing);

    // Add new uploaded images
    const newImgs = (req.files || []).map(f => ({
        url: f.path,
        filename: f.filename
    }));
    listing.images.push(...newImgs);

    await listing.save();
    req.flash("success", "Listing updated successfully");
    res.redirect(`/listings/${id}`);
};


module.exports.toggleLike = async (req, res) => {
    const listingId = req.params.id;
    const user = await User.findById(req.user._id);

    const index = user.likedListings.findIndex(id => id.toString() === listingId);

    if (index === -1) {
        user.likedListings.push(listingId);
    } else {
        user.likedListings.splice(index, 1);
    }
    await user.save();
    res.json({ success: true, liked: index === -1 });
}

module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted");
    res.redirect("/listings");
}