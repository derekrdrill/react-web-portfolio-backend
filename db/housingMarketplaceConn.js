const { MongoClient } = require('mongodb');
const Db = process.env.HOUSING_DATABASE;

var _db;

module.exports = {
   connectToServer: callback => {
      MongoClient.connect(Db)
         .then(client => {
            const dbConnection = client.db();

            if (dbConnection) {
               _db = dbConnection;
               console.log('Housing DB Connected');
            }
         })
         .catch(err => {
            console.log(err);
         });
   },

   getDb: function () {
      return _db;
   },
};
