const { MongoClient } = require('mongodb');
const Db = process.env.MAIN_DATABASE;

let _db;

module.exports = {
   connectToServer: callback => {
      MongoClient.connect(Db)
         .then(client => {
            const dbConnection = client.db();

            if (dbConnection) {
               _db = dbConnection;
               console.log('Main DB Connected');
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
