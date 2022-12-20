const express = require('express');
const recordRoutes = express.Router();
const conn = require('../db/conn');
const ObjectId = require('mongodb').ObjectId;

recordRoutes.route('/leadInput').get(async (req, res) => {
   // await conn
   //    .getDb()
   //    .collection('leadInput')
   //    .find({})
   //    .toArray((err, result) => {
   //       if (err) throw err;
   //       res.json(result);
   //    });

   const leadInputData = await conn.getDb().collection('leadInput');

   await leadInputData.find({}).toArray((err, result) => {
      if (err) throw err;
      res.json(result);
   });
});

recordRoutes.route('/addLeadInput').post(async req => {
   await conn
      .getDb()
      .collection('leadInput')
      .insert(req.body, err => {
         if (err) throw err;
      });
});

recordRoutes.route('/deleteLeadInput/:leadID').post(async req => {
   await conn
      .getDb()
      .collection('leadInput')
      .deleteOne({ _id: ObjectId(req.params.leadID) }, err => {
         if (err) throw err;
      });
});

recordRoutes.route('/replaceLeadInput').post(async req => {
   let newLeadInfo = await { ...req.body, ...{ _id: ObjectId(req.body._id) } };

   await conn
      .getDb()
      .collection('leadInput')
      .replaceOne({ _id: newLeadInfo._id }, newLeadInfo, err => {
         if (err) throw err;
      });
});

module.exports = recordRoutes;
