const express = require('express');
const feedbackItemRoutes = express.Router();
const conn = require('../db/conn');
const ObjectId = require('mongodb').ObjectId;

feedbackItemRoutes.route('/feedbackItems').get(async (req, res) => {
   const feedbackCollection = await conn.getDb().collection('feedbackItems');

   await feedbackCollection.find({}).toArray((err, result) => {
      if (err) throw err;
      res.json(result);
   });
});

feedbackItemRoutes.route('/addFeedbackItem').post(async (req, res) => {
   let returnFeedbackData = {};

   const feedbackCollection = await conn.getDb().collection('feedbackItems');
   const feedbackCollectionInsertion = await feedbackCollection.insertOne(req.body);

   if (feedbackCollectionInsertion.acknowledged) {
      returnFeedbackData = await feedbackCollection.findOne({ _id: feedbackCollectionInsertion.insertedId });
   }

   res.send(returnFeedbackData);
});

feedbackItemRoutes.route('/deleteFeedbackItem').post(async (req, res) => {
   let returnFeedbackData = {};

   const deleteID = ObjectId(req.body.id);
   const feedbackCollection = await conn.getDb().collection('feedbackItems');
   const deletedFeedbackData = await feedbackCollection.findOne({ _id: deleteID });
   const feedbackCollectionDeletion = await feedbackCollection.deleteOne({ _id: deleteID });

   if (feedbackCollectionDeletion.acknowledged) {
      returnFeedbackData = deletedFeedbackData;
   }

   res.send(returnFeedbackData);
});

feedbackItemRoutes.route('/updateFeedbackItem').post(async (req, res) => {
   let returnFeedbackData = {};

   const updateID = ObjectId(req.body._id);
   const newFeedbackInfo = { ...req.body, ...{ _id: updateID } };
   const feedbackCollection = await conn.getDb().collection('feedbackItems');
   const feedbackCollectionUpdate = await feedbackCollection.replaceOne({ _id: updateID }, newFeedbackInfo);

   if (feedbackCollectionUpdate.acknowledged) {
      returnFeedbackData = await feedbackCollection.findOne({ _id: updateID });
   }

   res.send(returnFeedbackData);
});

module.exports = feedbackItemRoutes;
