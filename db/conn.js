const { MongoClient } = require('mongodb');
const Db = process.env.MAIN_DATABASE;
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
