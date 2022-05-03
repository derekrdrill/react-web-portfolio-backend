const express = require('express');
const recordRoutes = express.Router();
const conn = require('../db/conn');
const ObjectId = require('mongodb').ObjectId;

recordRoutes.route('/george').get(function (req, res) {
   let dbo = conn.getDb();

   dbo.collection('George')
      .find({})
      .toArray((err, result) => {
         if (err) throw err;
         res.json(result);
      });
});

module.exports = recordRoutes;
