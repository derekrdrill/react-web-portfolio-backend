const express = require('express');
const housingMarketplaceRoutes = express.Router();
const conn = require('../../db/housingMarketplaceConn');
const bcrypt = require('bcryptjs');
const ObjectId = require('mongodb').ObjectId;

housingMarketplaceRoutes.route('/sign-in/:username/:password').get(async (req, res) => {
   let passwordMatch = false;
   let userNameExists = false;
   const enteredPassword = req.params.password;
   const enteredUsername = req.params.username;
   const usersCollection = await conn.getDb().collection('userAuthentication');
   const user = await usersCollection.findOne({ userName: enteredUsername });

   if (!user) {
      console.log('No user');
   } else {
      userNameExists = true;
      const { password } = user;
      passwordMatch = await bcrypt.compare(enteredPassword, password).catch(e => console.warn(e));
   }

   res.send({ passwordMatch: passwordMatch, userNameExists: userNameExists });
});

housingMarketplaceRoutes.route('/addUser').post(async (req, res) => {
   let returnUserData = {};

   req.body.password = await bcrypt.hash(req.body.password, 8);
   const usersCollection = await conn.getDb().collection('userAuthentication');
   const usersCollectionInsertion = await usersCollection.insertOne(req.body);

   if (usersCollectionInsertion.acknowledged) {
      returnUserData = await usersCollection.findOne({ _id: usersCollectionInsertion.insertedId });
   }

   res.send(returnUserData);
});

housingMarketplaceRoutes.route('/checkForUser/:email/:username').get(async (req, res) => {
   let returnObject = {};
   console.log(req.params);

   const usersCollection = await conn.getDb().collection('userAuthentication');
   const usernameExists = await usersCollection.findOne({ userName: req.params.username });
   const userEmailExists = await usersCollection.findOne({ email: req.params.email });

   console.log(usernameExists);
   console.log(userEmailExists);

   if (userEmailExists) {
      returnObject = { msg: 'An account under this email exists already' };
   } else if (usernameExists) {
      returnObject = { msg: 'Username exists already' };
   }

   res.send(returnObject);
});

module.exports = housingMarketplaceRoutes;
