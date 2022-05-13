const express = require('express');
const housingMarketplaceRoutes = express.Router();
const conn = require('../../db/housingMarketplaceConn');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const ObjectId = require('mongodb').ObjectId;

housingMarketplaceRoutes.route('/forgot-password/:email').get(async (req, res) => {
   let userFound = false;
   const usersCollection = await conn.getDb().collection('userAuthentication');
   const user = await usersCollection.findOne({ email: req.params.email });

   if (user) {
      userFound = true;
      const { firstName, _id } = user;
      const token = await bcrypt.hash('new_token', 8);
      const resetLink = `http://localhost:3000/housing-marketplace/reset-password/${token}/${_id.toString()}`;

      const transporter = nodemailer.createTransport({
         service: 'gmail',
         auth: {
            user: 'derekrdrill@gmail.com',
            pass: 'DrD151421!',
         },
      });

      const mailOptions = {
         from: 'derekrdrill@gmail.com',
         to: req.params.email,
         subject: 'Pasword reset',
         html: `<html>
                  <head></head>
                  <body>
                     <p>Hi ${firstName},</p>
                     <p>You requested to reset your password.</p>
                     <p>Please follow the link below to do so: </p>
                     <a href='${resetLink}' target='_blank'>${resetLink}</a>
=                  </body>
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

   res.send({ userFound: userFound });
});

housingMarketplaceRoutes.route('/sign-in/:username/:password').get(async (req, res) => {
   let passwordMatch = false;
   let userNameExists = false;
   let token = null;
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
      token = passwordMatch ? await bcrypt.hash('new_token', 8) : null;
   }

   res.send({ passwordMatch: passwordMatch, userNameExists: userNameExists, token: token });
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
