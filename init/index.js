const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

main()
.then((res) => {
    console.log("connection successful");
})
.catch(err => {
    console.log(err)
});

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/BnBharat');
}

const initDB = async () => {
  await Listing.deleteMany({});

  initData.data = initData.data.map(obj => ({
    ...obj,
    owner: '688a266837c74105b015702a',
    images: obj.images.map(url => ({
      url,
      filename: url.split('/').pop().split('?')[0] // last part of URL without query params
    }))
  }));

  await Listing.insertMany(initData.data);
  console.log("data initialized");
};


initDB();