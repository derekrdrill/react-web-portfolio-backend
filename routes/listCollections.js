const express = require('express');
const recordRoutes = express.Router();
const conn = require('../db/conn');
const ObjectId = require('mongodb').ObjectId;

recordRoutes.route('/listCollections').get(function (req, res) {
   conn
      .getDb()
      .listCollections()
      .toArray((err, result) => {
         if (err) throw err;
         res.json(result);
      });
});

module.exports = recordRoutes;
