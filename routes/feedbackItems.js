const express = require('express');
const recordRoutes = express.Router();
const conn = require('../db/conn');
const ObjectId = require('mongodb').ObjectId;

recordRoutes.route('/feedbackItems').get(function (req, res) {
   conn
      .getDb()
      .collection('feedbackItems')
      .find({})
      .toArray((err, result) => {
         if (err) throw err;
         res.json(result);
      });
});

recordRoutes.route('/addFeedbackItem').post(function (req) {
   conn
      .getDb()
      .collection('feedbackItems')
      .insert(req.body, err => {
         if (err) throw err;
      });
});

recordRoutes.route('/deleteFeedbackItem').post(function (req) {
   conn
      .getDb()
      .collection('feedbackItems')
      .deleteOne({ _id: ObjectId(req.body.id) }, err => {
         if (err) throw err;
      });
});

recordRoutes.route('/updateFeedbackItem').post(function (req) {
   let newFeedbackInfo = { ...req.body, ...{ _id: ObjectId(req.body._id) } };

   conn
      .getDb()
      .collection('feedbackItems')
      .replaceOne({ _id: newFeedbackInfo._id }, newFeedbackInfo, err => {
         if (err) throw err;
      });
});

module.exports = recordRoutes;
