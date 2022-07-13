const express = require('express');
const connectWithMeEmailRoutes = express.Router();
const nodemailer = require('nodemailer');

connectWithMeEmailRoutes.route('/send-email/:email/:firstName/:lastName/:message/:phone').get(async (req, res) => {
   const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
         user: process.env.GOOGLE_EMAIL_ACCOUNT,
         pass: process.env.GOOGLE_APP_PASSWORD,
      },
   });

   const mailOptions = [
      {
         from: process.env.GOOGLE_EMAIL_ACCOUNT,
         to: req.params.email,
         subject: 'Message Receipt',
         html: `<html>
                  <head></head>
                  <body>
                     <p>Hi ${req.params.firstName},</p>
                     <p>This is just an acknowledgement that I receivied your message from my portfilo!</p>
                     <p>I will follow-up with you shortly</p>
                     <p>-Sincerely,<br/>Derek</p>
                  </body>
               </html>`,
      },
      {
         from: process.env.GOOGLE_EMAIL_ACCOUNT,
         to: process.env.GOOGLE_EMAIL_ACCOUNT,
         cc: req.params.email,
         subject: `Message from ${req.params.firstName} ${req.params.lastName}`,
         html: `<html>
                  <head></head>
                  <body>
                     <p>${req.params.message}</p>
                     <br />
                     <p>${req.params.firstName} ${req.params.lastName}</p>
                     <p>${req.params.email}</p>
                     <p>${req.params.phone}</p>
                  </body>
               </html>`,
      },
   ];

   mailOptions.forEach(mailOption => {
      transporter.sendMail(mailOption, (error, info) => {
         if (error) {
            let message = 'Error. Please try again later';

            console.log(error);
            console.log(message);

            res.send({ message: message });
         } else {
            let message = 'Emails successfully sent!';

            console.log(`${message} :` + info.response);

            res.send({ message: message });
         }
      });
   });
});

module.exports = connectWithMeEmailRoutes;
