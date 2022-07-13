const express = require('express');
const housingMarketplaceRoutes = express.Router();
const conn = require('../../db/housingMarketplaceConn');
const path = require('path');
const multer = require('multer');
const ObjectId = require('mongodb').ObjectId;

const storage = multer.diskStorage({
   destination: './public/uploads/',
   filename: function (req, file, cb) {
      cb(null, 'IMAGE-' + Date.now() + path.extname(file.originalname));
   },
});

const upload = multer({
   storage: storage,
}).array('uploadImages', 5);

housingMarketplaceRoutes.route('/get-contact-info/:userID').get(async (req, res) => {
   const usersCollection = await conn.getDb().collection('userAuthentication');
   const user = await usersCollection.findOne({ _id: ObjectId(req.params.userID) });

   res.send({ userData: user ?? [] });
});

housingMarketplaceRoutes.route('/get-listing-info/:listingID').get(async (req, res) => {
   const listingID = req.params.listingID;
   const listingsCollection = await conn.getDb().collection('listings');
   const listingInfo = await listingsCollection.find({ _id: ObjectId(listingID) }).toArray();

   res.send({ listingInfo: listingInfo ?? [] });
});

housingMarketplaceRoutes.route('/get-listing-info-by-user/:username').get(async (req, res) => {
   const usersCollection = await conn.getDb().collection('userAuthentication');
   const user = await usersCollection.findOne({ userName: req.params.username });
   const userID = user._id.toString();

   const listingsCollection = await conn.getDb().collection('listings');
   const listings = await listingsCollection.find({ userID: userID }).toArray();

   res.send({ listings: listings });
});

housingMarketplaceRoutes.route('/get-listings/:listing').get(async (req, res) => {
   const listingType1 = req.params.listing === 'both' ? 'rent' : req.params.listing;
   const listingType2 = req.params.listing === 'both' ? 'sale' : req.params.listing;

   const listingsCollection = await conn.getDb().collection('listings');
   const listingsData = await listingsCollection.find({ type: { $in: [listingType1, listingType2] } }).toArray();

   res.send({ listings: listingsData ?? [] });
});

housingMarketplaceRoutes.route('/get-listings-with-offers').get(async (req, res) => {
   const listingsCollection = await conn.getDb().collection('listings');
   const listingsData = await listingsCollection.find({ offer: true }).toArray();

   res.send({ listings: listingsData ?? [] });
});

housingMarketplaceRoutes.route('/delete-listing/:listingID').post(async (req, res) => {
   let returnListingData = {};

   const deleteID = ObjectId(req.params.listingID);
   const listingsCollection = await conn.getDb().collection('listings');
   const deletedFeedbackData = await listingsCollection.findOne({ _id: deleteID });
   const listingsCollectionDeletion = await listingsCollection.deleteOne({ _id: deleteID });

   if (listingsCollectionDeletion.acknowledged) {
      returnListingData = deletedFeedbackData;
   }

   res.send(returnListingData);
});

housingMarketplaceRoutes.route('/create-listing').post(async (req, res) => {
   let returnListingData = [];

   const usersCollection = await conn.getDb().collection('userAuthentication');
   const user = await usersCollection.findOne({ userName: req.body.username });
   const { _id } = user;

   const listingsCollection = await conn.getDb().collection('listings');
   const listingData = { ...req.body.formData, imageUrls: req.body.images, userID: _id.toString() };
   delete listingData['images'];

   const createListing = await listingsCollection.insertOne(listingData);

   if (createListing.acknowledged) {
      returnListingData = await listingsCollection.findOne({ _id: createListing.insertedId });
   }

   res.send({ data: returnListingData });
});

housingMarketplaceRoutes.route('/upload-images').post(async (req, res) => {
   let filePaths = [];

   upload(req, res, function (err) {
      const files = req.files;
      console.log(files);
      files.forEach(file => (filePaths = [...filePaths, `http://localhost:3001/uploads/${file.filename}`]));
      if (!err) return res.send({ uploadSuccess: true, filePaths: filePaths }).end();
   });
});

module.exports = housingMarketplaceRoutes;
