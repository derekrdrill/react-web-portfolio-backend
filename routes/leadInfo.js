const express = require('express');
const recordRoutes = express.Router();
const conn = require('../db/conn');
const ObjectId = require('mongodb').ObjectId;

recordRoutes.route('/leadInput').get(function (req, res) {
   conn
      .getDb()
      .collection('leadInput')
      .find({})
      .toArray((err, result) => {
         if (err) throw err;
         res.json(result);
      });
});

recordRoutes.route('/test').get(function (req, res) {
   res.send('TEST!!!');
});

recordRoutes.route('/addLeadInput').post(function (req) {
   conn
      .getDb()
      .collection('leadInput')
      .insert(req.body, err => {
         if (err) throw err;
      });
});

recordRoutes.route('/deleteLeadInput/:leadID').post(function (req) {
   conn
      .getDb()
      .collection('leadInput')
      .deleteOne({ _id: ObjectId(req.params.leadID) }, err => {
         if (err) throw err;
      });
});

recordRoutes.route('/replaceLeadInput').post(function (req) {
   let newLeadInfo = { ...req.body, ...{ _id: ObjectId(req.body._id) } };

   conn
      .getDb()
      .collection('leadInput')
      .replaceOne({ _id: newLeadInfo._id }, newLeadInfo, err => {
         if (err) throw err;
      });
});

module.exports = recordRoutes;
