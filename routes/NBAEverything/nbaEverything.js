const express = require('express');
const conn = require('../../db/nbaEverything');
const nbaEverythingRoutes = express.Router();
const axios = require('axios');

nbaEverythingRoutes.route('/get-all-players').get(async (req, res) => {
   await conn
      .getDb()
      .collection('players')
      .find({})
      .toArray((err, result) => {
         if (err) throw err;
         res.json(result);
      });
});

nbaEverythingRoutes.route('/get-all-players-by-team/:teamID').get(async (req, res) => {
   await conn
      .getDb()
      .collection('players')
      .find({ 'team.id': Number(req.params.teamID) })
      .toArray((err, result) => {
         if (err) throw err;
         res.json(result);
      });
});

nbaEverythingRoutes.route('/get-team-game-data-by-team-and-season/:teamID/:season').get(async (req, res) => {
   const gameDataOptions = {
      method: 'GET',
      params: { page: 1, per_page: '82' },
      url: `https://www.balldontlie.io/api/v1/games?seasons[]=${req.params.season}&team_ids[]=${req.params.teamID}`,
   };

   const gameDataRequest = await axios.request(gameDataOptions).catch(e => console.error(e));

   const gameData = await gameDataRequest.data.data.filter(
      game => game.home_team_score > 0 && game.visitor_team_score > 0,
   );

   const gameDataWithWins = await gameData
      .map(game => {
         let teamID = Number(req.params.teamID);

         const { home_team, home_team_score, visitor_team, visitor_team_score } = game;

         if (home_team.id === teamID) {
            if (home_team_score > visitor_team_score) {
               return { ...game, ...{ win: true } };
            } else {
               return game;
            }
         } else if (visitor_team.id === teamID) {
            if (home_team_score < visitor_team_score) {
               return { ...game, ...{ win: true } };
            } else {
               return game;
            }
         }
      })
      .filter(data => data);

   const pointsData = await gameData.map(game => {
      let teamID = Number(req.params.teamID);

      const { home_team, home_team_score, visitor_team, visitor_team_score } = game;

      if (home_team.id === teamID) {
         return home_team_score;
      } else if (visitor_team.id === teamID) {
         return visitor_team_score;
      }
   });

   const ppg = (await pointsData.reduce((a, b) => a + b)) / pointsData.length;
   const wins = await gameDataWithWins.filter(game => game.win).length;
   const losses = (await gameData.length) - wins;

   res.send({ teamGameData: gameData, wins: wins, losses: losses, ppg, ppg });
});

nbaEverythingRoutes.route('/get-player-data-by-team-and-season/:teamID/:season').get(async (req, res) => {
   const players = await conn
      .getDb()
      .collection('players')
      .find({ 'team.id': Number(req.params.teamID) })
      .toArray();

   const playerIDs = [...new Set(await players.map(player => player.id).sort((a, b) => a - b))];

   const playerIDsString = async playerIDs => {
      let returnString = '';

      await playerIDs.forEach(async playerID => {
         returnString += `&player_ids[]=${playerID}`;
      });

      return returnString;
   };

   const seasonAvgsOptions = {
      method: 'GET',
      url: `https://www.balldontlie.io/api/v1/season_averages?season=${req.params.season}${await playerIDsString(
         playerIDs,
      )}`,
   };

   const seasonAveragesRequest = await axios.request(seasonAvgsOptions).catch(e => console.error(e));
   const seasonAverages = seasonAveragesRequest.data.data;

   const playerData = await seasonAverages.map(
      seasonAverage =>
         players
            .map(player => player.id === seasonAverage.player_id && { ...seasonAverage, ...player })
            .filter(data => data)[0],
   );

   res.send(playerData);
});

nbaEverythingRoutes.route('/get-all-teams').get(async (req, res) => {
   await conn
      .getDb()
      .collection('teams')
      .find({})
      .toArray((err, result) => {
         if (err) throw err;
         res.json(result);
      });
});

nbaEverythingRoutes.route('/update-nba-data').get(async (req, res) => {
   let allCollections = await conn.getDb().listCollections({}, { nameOnly: true }).toArray();
   allCollections = await allCollections.map(collection => collection.name);

   const insertPlayerData = async page => {
      const options = {
         method: 'GET',
         url: 'https://www.balldontlie.io/api/v1/players',
         params: { page: page, per_page: '100' },
      };

      await axios
         .request(options)
         .then(async response => {
            playerData = response.data.data;

            await playerData.forEach(async player => {
               await conn
                  .getDb()
                  .collection('players')
                  .insertOne(player, (err, res) => {
                     if (err) throw err;
                  });
            });
         })
         .catch(function (error) {
            console.error(error);
         });
   };

   const insertTeamData = async () => {
      await axios
         .request({ method: 'GET', url: 'https://www.balldontlie.io/api/v1/teams', params: { page: '0' } })
         .then(async response => {
            teamData = response.data.data;

            await teamData.forEach(async team => {
               await conn
                  .getDb()
                  .collection('teams')
                  .insertOne(team, (err, res) => {
                     if (err) throw err;
                  });
            });
         })
         .catch(function (error) {
            console.error(error);
         });
   };

   if (allCollections.includes('players')) {
      await conn
         .getDb()
         .collection('players')
         .drop((err, deleted) => {
            if (err) throw err;
            if (deleted) console.log('Players collection deleted');
         });
   }

   if (allCollections.includes('teams')) {
      await conn
         .getDb()
         .collection('teams')
         .drop((err, deleted) => {
            if (err) throw err;
            if (deleted) console.log('Teams collection deleted');
         });
   }

   for (let i = 0; i <= 40; i++) {
      await insertPlayerData(i);
   }

   await insertTeamData();

   res.send('Data inserted');
});

module.exports = nbaEverythingRoutes;
