const { MongoClient } = require('mongodb');
const Db =
   'mongodb+srv://derekdrill:veljTbo8NoPSY1fR@cluster0.q1sd3.mongodb.net/webPortfolioDB?retryWrites=true&w=majority';
const client = new MongoClient(Db);

var _db;

module.exports = {
   connectToServer: function (callback) {
      client.connect(function (err, db) {
         if (db) {
            _db = db.db();
            console.log('Successfully connected to MongoDB.');
         }

         return callback(err);
      });
   },

   getDb: function () {
      return _db;
   },
};
