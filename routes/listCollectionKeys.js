const express = require('express');
const recordRoutes = express.Router();
const conn = require('../db/conn');

recordRoutes.route('/listCollectionKeys/:dataSet').get(function (req, res) {
   conn
      .getDb()
      .collection(req.params.dataSet)
      .findOne((err, result) => {
         if (err) throw err;

         let count = 0;
         const keyArray = [];

         for (key in result) {
            key !== '_id' && keyArray.push({ id: count, columnName: key });
            count++;
         }

         res.json(keyArray);
      });
});

module.exports = recordRoutes;
