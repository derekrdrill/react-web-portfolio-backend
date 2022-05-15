const express = require('express');
const housingMarketplaceRoutes = express.Router();
const conn = require('../../db/housingMarketplaceConn');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const ObjectId = require('mongodb').ObjectId;

housingMarketplaceRoutes.route('/get-listings/:listing').get(async (req, res) => {
   const listing = req.params.listing;
   const listingsCollection = await conn.getDb().collection('listings');
   const listingsData = await listingsCollection.find({ type: listing }).toArray();

   res.send({ listings: listingsData ?? [] });
});

housingMarketplaceRoutes.route('/get-listings-with-offers').get(async (req, res) => {
   const listingsCollection = await conn.getDb().collection('listings');
   const listingsData = await listingsCollection.find({ offer: true }).toArray();

   res.send({ listings: listingsData ?? [] });
});

module.exports = housingMarketplaceRoutes;
