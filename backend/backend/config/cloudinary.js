const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "defwxebhk",
  api_key: process.env.CLOUDINARY_API_KEY || "614415194411725",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "DHd8tTNfa0oJjdFHTV5u4JHsA8s",
});

module.exports = cloudinary;
