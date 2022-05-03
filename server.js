const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();
const app = express();
const cors = require('cors');
// const port = process.env.PORT;
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(pino);
app.use(require('./routes/george'));
app.use(require('./routes/leadInfo'));
app.use(require('./routes/listCollections'));
app.use(require('./routes/listCollectionKeys'));
app.use(require('./routes/feedbackItems'));

const dbo = require('./db/conn');

app.listen(port, () => {
   dbo.connectToServer(err => {
      if (err) console.error(err);
   });
   console.log(`Server is running on port: ${port}`);
});