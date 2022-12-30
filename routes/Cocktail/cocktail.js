const express = require('express');
const conn = require('../../db/conn');
const cocktailRoutes = express.Router();
const axios = require('axios');

cocktailRoutes.route('/get-updated-cocktail-data').get(async (req, res) => {
   let cocktailData = [];

   await conn
      .getDb()
      .collection('CocktailData')
      .drop((err, deleted) => {
         if (err) throw err;
         if (deleted) console.log('Collection deleted');
      });

   await conn.getDb().createCollection('CocktailData', (err, res) => {
      if (err) throw err;
      console.log('Collection created');
   });

   const options = {
      method: 'GET',
      url: process.env.COCKTAIL_SEARCH_URL,
      params: { s: '' },
      headers: {
         'X-RapidAPI-Key': process.env.COCKTAIL_KEY,
         'X-RapidAPI-Host': process.env.COCKTAIL_HOST,
      },
   };

   await axios
      .request(options)
      .then(async response => {
         cocktailData = await response.data.drinks;
         await cocktailData.forEach(async cocktail => {
            await conn
               .getDb()
               .collection('CocktailData')
               .insertOne(cocktail, (err, res) => {
                  if (err) throw err;
                  console.log(cocktail.strDrink + ' inserted');
               });
         });
      })
      .catch(function (error) {
         console.error(error);
      });

   res.send('Data inserted');
});

cocktailRoutes.route('/get-cocktail-names-glasses-ingredients').get(async (req, res) => {
   let cocktailNames = [];
   let glassTypes = [];
   let ingredients = [];

   const cocktailData = await conn.getDb().collection('CocktailData').find({}).toArray();

   cocktailNames = await cocktailData
      .map(drink => drink.strDrink)
      .filter(drink => !drink.includes('1-900'))
      .sort();

   glassTypes = [...new Set(await cocktailData.map(drink => drink.strGlass).sort())];

   await cocktailData.forEach(drink => {
      for (let i = 1; i <= 15; i++) {
         if (drink[`strIngredient${i}`]) {
            ingredients = [...ingredients, ...[drink[`strIngredient${i}`]]];
         }
      }
   });

   let uniqueIngredients = [];

   ingredients.forEach(ingredient => {
      if (!uniqueIngredients.includes(ingredient.toUpperCase())) {
         uniqueIngredients = [...uniqueIngredients, ...[ingredient.toUpperCase()]];
      }
   });

   ingredients = uniqueIngredients.sort();

   res.send({
      cocktailData: cocktailData,
      cocktailNames: cocktailNames,
      glassTypes: glassTypes,
      ingredients: ingredients,
   });
});

module.exports = cocktailRoutes;
