const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const User = require("./user.js");  


const listingSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: String,

  // Multiple images
images: [
  {
    url: { type: String, required: true },
    type: { type: String } // e.g. 'jpg', 'png', 'webp'
  }
],

  price: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },

  propertyType: {
    type: String,
    enum: ["Apartment", "Villa", "Homestay", "Hostel Bed", "Haveli", "Cottage", "Cabin"]
  },

  guests: {
    type: Number,
    default: 2
  },
  bedrooms: Number,
  beds: Number,
  bathrooms: Number,

  amenities: [String],   // ["WiFi", "AC", "Pool"]

  location: String,      // e.g., "Vaishali Nagar"
  country: String,

  rules: [String],       // e.g., ["No smoking", "No pets"]

  isAvailable: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now()
  },

  reviews:[{
    type:Schema.Types.ObjectId,
    ref:"Review"
  }],

  owner:{
    type:Schema.Types.ObjectId,
    ref:"User"
  },
  // GeoJSON for location
  geometry:{
    type: {
      type: String, // 'Point'
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  }

}, { timestamps: true });

//To handle if listing got deleted , review also gets deleted
listingSchema.post("findOneAndDelete" , async(listing) => {
  if(listing){
    await Review.deleteMany({_id: {$in: listing.reviews}});
  }
}) 

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
