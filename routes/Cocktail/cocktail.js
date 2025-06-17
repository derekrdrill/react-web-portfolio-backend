const express = require('express');
const conn = require('../../db/conn');
const cocktailRoutes = express.Router();
const axios = require('axios');
const { calculateDifficulty } = require('./helpers/cocktailHelpers');

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

   console.log('Fetching cocktail data from database...');
   const cocktailData = await conn.getDb().collection('CocktailData').find({}).toArray();

   // Add difficulty to each cocktail
   const cocktailsWithDifficulty = cocktailData.map(cocktail => ({
      ...cocktail,
      difficulty: calculateDifficulty(cocktail),
   }));

   cocktailNames = await cocktailsWithDifficulty
      .map(drink => drink.strDrink)
      .filter(drink => !drink.includes('1-900'))
      .sort();

   glassTypes = [...new Set(await cocktailsWithDifficulty.map(drink => drink.strGlass.toUpperCase()).sort())];

   await cocktailsWithDifficulty.forEach(drink => {
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

   const response = {
      cocktailData: cocktailsWithDifficulty,
      cocktailNames: cocktailNames,
      glassTypes: glassTypes,
      ingredients: ingredients,
   };

   console.log(`Response contains ${cocktailsWithDifficulty.length} cocktails with difficulty ratings`);

   res.send(response);
});

cocktailRoutes.route('/get-cocktail-video/:cocktailId').get(async (req, res) => {
   try {
      const cocktailId = req.params.cocktailId;
      console.log(`Fetching video for cocktail ID: ${cocktailId}`);

      const db = conn.getDb();
      const cocktail = await db.collection('CocktailData').findOne({ idDrink: cocktailId });

      if (!cocktail) {
         console.log(`No cocktail found with ID: ${cocktailId}`);
         return res.status(404).send({ message: `Cocktail with ID of ${cocktailId} not found in database` });
      }

      const cocktailName = cocktail.strDrink;
      console.log(`Looking for video for ${cocktailName}`);

      // Check for cached video data first
      if (cocktail.videoData) {
         console.log(`Returning cached video data for ${cocktailName}`);
         return res.send(cocktail.videoData);
      }

      console.log(`Searching for video for ${cocktailName}`);

      // Construct a search query that emphasizes recipe/tutorial content
      const searchQuery = `how to make ${cocktailName} cocktail recipe tutorial`;

      const options = {
         method: 'GET',
         url: 'https://www.googleapis.com/youtube/v3/search',
         params: {
            part: 'snippet',
            maxResults: 5, // Get a few results to have options
            q: searchQuery,
            type: 'video',
            key: process.env.YOUTUBE_API_KEY,
            order: 'relevance',
            safeSearch: 'strict',
            videoDuration: 'medium',
            relevanceLanguage: 'en',
            videoCategoryId: '28', // "How-to & Style" category
         },
      };

      console.log('Making YouTube API request...');
      const response = await axios.request(options);

      if (response.data.items && response.data.items.length > 0) {
         // Take the first result that looks like a recipe video
         const recipeVideo =
            response.data.items.find(video => {
               const title = video.snippet.title.toLowerCase();
               const description = video.snippet.description.toLowerCase();

               // Look for recipe-related keywords in title or description
               const recipeKeywords = ['how to', 'recipe', 'tutorial', 'make', 'cocktail', 'drink'];
               return recipeKeywords.some(keyword => title.includes(keyword) || description.includes(keyword));
            }) || response.data.items[0]; // Fallback to first result if no recipe-like video found

         const videoData = {
            cocktailName: cocktailName,
            videoId: recipeVideo.id.videoId,
            videoUrl: `https://www.youtube.com/watch?v=${recipeVideo.id.videoId}`,
            title: recipeVideo.snippet.title,
            thumbnail: recipeVideo.snippet.thumbnails.medium.url,
            channelTitle: recipeVideo.snippet.channelTitle,
            publishedAt: recipeVideo.snippet.publishedAt,
            searchQuery: searchQuery,
            cachedAt: new Date().toISOString(),
         };

         // Cache the video data
         try {
            await db.collection('CocktailData').updateOne({ idDrink: cocktailId }, { $set: { videoData: videoData } });
            console.log(`Stored video data for ${cocktailName}`);
         } catch (dbError) {
            console.error('Error storing video data in database:', dbError.message);
         }

         res.send(videoData);
      } else {
         console.log(`No video found for ${cocktailName}`);
         res.status(404).send({
            message: `No video found for ${cocktailName}`,
            note: 'Could not find a suitable cocktail recipe video.',
         });
      }
   } catch (error) {
      console.error('Error in get-cocktail-video endpoint:', error.message);
      if (error.response?.status === 403 && error.response?.data?.error?.message?.includes('quota')) {
         res.status(429).send({
            message: 'YouTube API quota exceeded',
            note: 'The daily limit for YouTube API requests has been reached. Please try again tomorrow.',
         });
      } else {
         res.status(500).send({
            message: 'Error fetching video data',
            error: error.message,
         });
      }
   }
});

cocktailRoutes.route('/remove-all-video-data').get(async (req, res) => {
   try {
      const db = conn.getDb();
      const result = await db.collection('CocktailData').updateMany(
         { videoData: { $exists: true } }, // Only match documents that have videoData
         { $unset: { videoData: '' } }, // Remove the videoData field
      );

      console.log(`Removed videoData from ${result.modifiedCount} documents`);
      res.send({
         message: `Successfully removed videoData from ${result.modifiedCount} documents`,
         modifiedCount: result.modifiedCount,
      });
   } catch (error) {
      console.error('Error removing videoData:', error.message);
      res.status(500).send({
         message: 'Error removing videoData',
         error: error.message,
      });
   }
});

module.exports = cocktailRoutes;
