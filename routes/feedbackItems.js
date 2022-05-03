const express = require('express');
const recordRoutes = express.Router();
const conn = require('../db/conn');
const ObjectId = require('mongodb').ObjectId;

recordRoutes.route('/feedbackItems').get(async (req, res) => {
   const feedbackCollection = await conn.getDb().collection('feedbackItems');

   await feedbackCollection.find({}).toArray((err, result) => {
      if (err) throw err;
      res.json(result);
   });
});

recordRoutes.route('/addFeedbackItem').post(async (req, res) => {
   let returnFeedbackData = {};

   const feedbackCollection = await conn.getDb().collection('feedbackItems');
   const feedbackCollectionInsertion = await feedbackCollection.insertOne(req.body);

   if (feedbackCollectionInsertion.acknowledged) {
      returnFeedbackData = await feedbackCollection.findOne({ _id: feedbackCollectionInsertion.insertedId });
   }

   res.send(returnFeedbackData);
});

recordRoutes.route('/deleteFeedbackItem').post(async req => {
   const feedbackCollection = await conn.getDb().collection('feedbackItems');
   await feedbackCollection.deleteOne({ _id: ObjectId(req.body.id) }, err => {
      if (err) throw err;
   });
});

recordRoutes.route('/updateFeedbackItem').post(async req => {
   let newFeedbackInfo = { ...req.body, ...{ _id: ObjectId(req.body._id) } };
   const feedbackCollection = await conn.getDb().collection('feedbackItems');

   await feedbackCollection.replaceOne({ _id: newFeedbackInfo._id }, newFeedbackInfo, err => {
      if (err) throw err;
   });
});

module.exports = recordRoutes;
