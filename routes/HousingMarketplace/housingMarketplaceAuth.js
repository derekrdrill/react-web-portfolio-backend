const express = require('express');
const housingMarketplaceRoutes = express.Router();
const conn = require('../../db/housingMarketplaceConn');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const ObjectId = require('mongodb').ObjectId;

housingMarketplaceRoutes.route('/find-user-with-token/:token').get(async (req, res) => {
   let returnID = null;
   const usersCollection = await conn.getDb().collection('userAuthentication');
   const user = await usersCollection.findOne({ token: req.params.token });
   const userFound = user ? true : false;

   if (user) {
      const { _id } = user;
      returnID = _id;
      await usersCollection.updateOne({ _id: _id }, { $set: { token: null } });
   }

   res.send({ userFound: userFound, id: returnID });
});

housingMarketplaceRoutes.route('/forgot-password/:email').get(async (req, res) => {
   let userFound = false;
   const usersCollection = await conn.getDb().collection('userAuthentication');
   const user = await usersCollection.findOne({ email: req.params.email });

   if (user) {
      userFound = true;
      const { firstName, _id } = user;
      const token = (await bcrypt.hash('new_token', 8)).replace(/\//g, '~');
      const resetLink = `${process.env.FRONT_END_URL}/housing-marketplace/reset-password/token=${token}`;

      const insertTokenIntoUserRecord = await usersCollection.updateOne({ _id: _id }, { $set: { token: token } });

      if (insertTokenIntoUserRecord.acknowledged) {
         const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
               user: process.env.GOOGLE_EMAIL_ACCOUNT,
               pass: process.env.GOOGLE_APP_PASSWORD,
            },
         });

         const mailOptions = {
            from: process.env.GOOGLE_EMAIL_ACCOUNT,
            to: req.params.email,
            subject: 'Pasword reset',
            html: `<html>
                     <head></head>
                     <body>
                        <p>Hi ${firstName},</p>
                        <p>You requested to reset your password.</p>
                        <p>Please follow the link below to do so: </p>
                        <a href='${resetLink}' target='_blank'>${resetLink}</a>
                     </body>
                  </html>`,
         };

         transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
               console.log(error);
            } else {
               console.log('Email sent: ' + info.response);
            }
         });
      }
   }

   res.send({ userFound: userFound });
});

housingMarketplaceRoutes.route('/sign-in/:username/:password').get(async (req, res) => {
   let passwordMatch = false;
   let userNameExists = false;
   let token = null;
   let userReturnData = { firstName: null, lastName: null, email: null, username: null };
   const enteredPassword = req.params.password;
   const enteredUsername = req.params.username;
   const usersCollection = await conn.getDb().collection('userAuthentication');
   const user = await usersCollection.findOne({ userName: enteredUsername });

   if (!user) {
   } else {
      const { password, firstName, lastName, email, userName } = user;

      userNameExists = true;
      userReturnData = { firstName: firstName, lastName: lastName, email: email, username: userName };

      passwordMatch = await bcrypt.compare(enteredPassword, password).catch(e => console.warn(e));
      token = passwordMatch ? await bcrypt.hash('new_token', 8) : null;
   }

   res.send({
      passwordMatch: passwordMatch,
      userNameExists: userNameExists,
      token: token,
      userReturnData: userReturnData,
   });
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

housingMarketplaceRoutes.route('/updatePassword').post(async (req, res) => {
   let returnMsg = 'Password not reset';

   req.body.password = await bcrypt.hash(req.body.password, 8);

   const usersCollection = await conn.getDb().collection('userAuthentication');
   const usersCollectionPasswordUpdate = await usersCollection.updateOne(
      { _id: ObjectId(req.body.id) },
      { $set: { password: req.body.password } },
   );

   if (usersCollectionPasswordUpdate.acknowledged) {
      returnMsg = 'Password reset successfully';
   }

   res.send({ msg: returnMsg });
});

housingMarketplaceRoutes.route('/checkForUser/:email/:username').get(async (req, res) => {
   let returnObject = {};

   const usersCollection = await conn.getDb().collection('userAuthentication');
   const usernameExists = await usersCollection.findOne({ userName: req.params.username });
   const userEmailExists = await usersCollection.findOne({ email: req.params.email });

   if (userEmailExists) {
      returnObject = { msg: 'An account under this email exists already' };
   } else if (usernameExists) {
      returnObject = { msg: 'Username exists already' };
   }

   res.send(returnObject);
});

module.exports = housingMarketplaceRoutes;
