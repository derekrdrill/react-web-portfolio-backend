require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(pino);
app.use(require('./routes/george'));
app.use(require('./routes/leadInfo'));
app.use(require('./routes/listCollections'));
app.use(require('./routes/listCollectionKeys'));
app.use(require('./routes/feedbackItems'));
app.use(require('./routes/HousingMarketplace/housingMarketplaceAuth'));
app.use(require('./routes/HousingMarketplace/housingMarketplace'));
app.use(require('./routes/ConnectWithMe/connectWithMeEmail'));
app.use(require('./routes/Cocktail/cocktail'));
app.use(express.static('public'));

const dbo = require('./db/conn');
const housingMarketplaceDbo = require('./db/housingMarketplaceConn');

app.listen(port, () => {
   dbo.connectToServer(err => {
      if (err) console.error(err);
   });

   housingMarketplaceDbo.connectToServer(err => {
      if (err) console.error(err);
   });

   console.log(`Server is running on port: ${port}`);
});
