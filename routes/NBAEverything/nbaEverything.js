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

nbaEverythingRoutes.route('/get-game-detail-date-by-game-id/:gameID/').get(async (req, res) => {
   const getStatLeaders = (teamGameData, stat) => {
      return teamGameData.reduce((a, b) => {
         return a[stat] > b[stat] ? { player: a.player, [stat]: a[stat] } : { player: b.player, [stat]: b[stat] };
      });
   };

   const getBoxScoreData = teamData =>
      teamData.map(data => ({
         player: `${data.player.last_name}, ${data.player.first_name}`,
         min: Number(data.min),
         pts: data.pts,
         fgm: data.fgm,
         fga: data.fga,
         fg_pct: data.fga === 0 ? 'N/A' : (data.fg_pct * 100).toFixed(1),
         fg3m: data.fg3m,
         fg3a: data.fg3a,
         fg3_pct: data.fg3a === 0 ? 'N/A' : (data.fg3_pct * 100).toFixed(1),
         ftm: data.ftm,
         fta: data.fta,
         reb: data.reb,
         dreb: data.dreb,
         oreb: data.oreb,
         ast: data.ast,
         stl: data.stl,
         blk: data.blk,
         turnover: data.turnover,
         pf: data.pf,
      }));

   const getBoxScoreDataShort = teamData =>
      teamData.map(data => ({
         player: data.player,
         min: Number(data.min),
         pts: data.pts,
         reb: data.reb,
         ast: data.ast,
         stl: data.stl,
         blk: data.blk,
         turnover: data.turnover,
      }));

   const gameDetailDataOptions = {
      method: 'GET',
      params: { page: 1, per_page: '50' },
      url: `https://www.balldontlie.io/api/v1/stats?game_ids[]=${req.params.gameID}`,
   };

   const gameDetailDataRequest = await axios.request(gameDetailDataOptions).catch(e => console.error(e));

   const gameDetailData = gameDetailDataRequest.data.data;
   const homeTeamID = gameDetailData[0].game.home_team_id;
   const visitorTeamID = gameDetailData[0].game.visitor_team_id;

   const homeTeamData = gameDetailData.filter(data => data.team.id === homeTeamID);
   const visitorTeamData = gameDetailData.filter(data => data.team.id === visitorTeamID);

   const homeTeamDataBoxScore = getBoxScoreData(homeTeamData);
   const visitorTeamDataBoxScore = getBoxScoreData(visitorTeamData);
   const homeTeamDataBoxScoreShort = getBoxScoreDataShort(homeTeamDataBoxScore);
   const visitorTeamDataBoxScoreShort = getBoxScoreDataShort(visitorTeamDataBoxScore);

   const statLeaders = {
      ast: {
         home: getStatLeaders(homeTeamData, 'ast'),
         visitor: getStatLeaders(visitorTeamData, 'ast'),
      },
      blk: {
         home: getStatLeaders(homeTeamData, 'blk'),
         visitor: getStatLeaders(visitorTeamData, 'blk'),
      },
      pts: {
         home: getStatLeaders(homeTeamData, 'pts'),
         visitor: getStatLeaders(visitorTeamData, 'pts'),
      },
      reb: {
         home: getStatLeaders(homeTeamData, 'reb'),
         visitor: getStatLeaders(visitorTeamData, 'reb'),
      },
      stl: {
         home: getStatLeaders(homeTeamData, 'stl'),
         visitor: getStatLeaders(visitorTeamData, 'stl'),
      },
      turnover: {
         home: getStatLeaders(homeTeamData, 'turnover'),
         visitor: getStatLeaders(visitorTeamData, 'turnover'),
      },
   };

   const homeTeamStatLeaders = [
      {
         type: 'pts',
         player: statLeaders.pts.home.player,
         total: statLeaders.pts.home.pts,
      },
      {
         type: 'ast',
         player: statLeaders.ast.home.player,
         total: statLeaders.ast.home.ast,
      },
      {
         type: 'reb',
         player: statLeaders.reb.home.player,
         total: statLeaders.reb.home.reb,
      },
      {
         type: 'stl',
         player: statLeaders.stl.home.player,
         total: statLeaders.stl.home.stl,
      },
      {
         type: 'blk',
         player: statLeaders.blk.home.player,
         total: statLeaders.blk.home.blk,
      },
      {
         type: 'turnover',
         player: statLeaders.turnover.home.player,
         total: statLeaders.turnover.home.turnover,
      },
   ];

   const visitorTeamStatLeaders = [
      {
         type: 'pts',
         player: statLeaders.pts.visitor.player,
         total: statLeaders.pts.visitor.pts,
      },
      {
         type: 'ast',
         player: statLeaders.ast.visitor.player,
         total: statLeaders.ast.visitor.ast,
      },
      {
         type: 'reb',
         player: statLeaders.reb.visitor.player,
         total: statLeaders.reb.visitor.reb,
      },
      {
         type: 'stl',
         player: statLeaders.stl.visitor.player,
         total: statLeaders.stl.visitor.stl,
      },
      {
         type: 'blk',
         player: statLeaders.blk.visitor.player,
         total: statLeaders.blk.visitor.blk,
      },
      {
         type: 'turnover',
         player: statLeaders.turnover.visitor.player,
         total: statLeaders.turnover.visitor.turnover,
      },
   ];

   res.send([
      {
         abbrName: homeTeamData[0].team.abbreviation,
         boxScoreData: homeTeamDataBoxScore,
         boxScoreDataShort: homeTeamDataBoxScoreShort,
         fullGameData: homeTeamData,
         fullName: homeTeamData[0].team.full_name,
         locale: 'home',
         score: homeTeamData[0].game.home_team_score,
         statLeaders: homeTeamStatLeaders,
      },
      {
         abbrName: visitorTeamData[0].team.abbreviation,
         boxScoreData: visitorTeamDataBoxScore,
         boxScoreDataShort: visitorTeamDataBoxScoreShort,
         fullGameData: visitorTeamData,
         fullName: visitorTeamData[0].team.full_name,
         locale: 'vistor',
         score: visitorTeamData[0].game.visitor_team_score,
         statLeaders: visitorTeamStatLeaders,
      },
   ]);
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
   const sortedGameData = await gameDataWithWins.sort((a, b) => {
      let dateA = a.date;
      let dateB = b.date;

      return dateA < dateB ? -1 : 1;
   });

   res.send({ teamGameData: sortedGameData, wins: wins, losses: losses, gamesPlayed: wins + losses, ppg, ppg });
});

nbaEverythingRoutes.route('/get-player-and-team-totals-by-team-and-season/:teamID/:season').get(async (req, res) => {
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

   const gameDataOptions = {
      method: 'GET',
      params: { page: 1, per_page: '82' },
      url: `https://www.balldontlie.io/api/v1/games?seasons[]=${req.params.season}&team_ids[]=${req.params.teamID}`,
   };

   const gameDataRequest = await axios.request(gameDataOptions).catch(e => console.error(e));

   const gamesPlayed = await gameDataRequest.data.data.filter(
      game => game.home_team_score > 0 && game.visitor_team_score > 0,
   ).length;

   const reboundsArray = await playerData.map(player => player.reb * player.games_played);
   const assistsArray = await playerData.map(player => player.ast * player.games_played);
   const stlsArray = await playerData.map(player => player.stl * player.games_played);
   const blksArray = await playerData.map(player => player.blk * player.games_played);

   const rpg = (reboundsArray.reduce((partialSum, a) => partialSum + a, 0) / gamesPlayed).toFixed(2);
   const apg = (assistsArray.reduce((partialSum, a) => partialSum + a, 0) / gamesPlayed).toFixed(2);
   const spg = (stlsArray.reduce((partialSum, a) => partialSum + a, 0) / gamesPlayed).toFixed(2);
   const bpg = (blksArray.reduce((partialSum, a) => partialSum + a, 0) / gamesPlayed).toFixed(2);

   res.send({
      playerData: playerData,
      rpg: rpg,
      apg: apg,
      spg: spg,
      bpg: bpg,
   });
});

nbaEverythingRoutes.route('/get-all-teams').get(async (req, res) => {
   await conn
      .getDb()
      .collection('teams')
      .find({})
      .toArray((err, result) => {
         if (err) throw err;
         res.json(result.sort((a, b) => (a.full_name > b.full_name ? 1 : a.full_name < b.full_name ? -1 : 0)));
      });
});

nbaEverythingRoutes.route('/update-nba-data-game-stats/:season/:startPage/:endPage').post(async (req, res) => {
   let allCollections = await conn.getDb().listCollections({}, { nameOnly: true }).toArray();
   allCollections = await allCollections.map(collection => collection.name);

   const insertStatsData = async page => {
      const options = {
         method: 'GET',
         url: `https://www.balldontlie.io/api/v1/stats?seasons[]=${req.params.season}`,
         params: { page: page, per_page: '100' },
      };

      await axios
         .request(options)
         .then(async response => {
            const statData = response.data.data;
            await statData.forEach(async stat => {
               const statID = { id: stat.id };
               const setStat = { $set: stat };

               await conn
                  .getDb()
                  .collection('stats')
                  .updateOne(statID, setStat, { upsert: true }, (err, res) => {
                     if (err) throw err;
                  });
            });
         })
         .catch(function (error) {
            console.error(error);
         });
   };

   if (!allCollections.includes('stats')) {
      await conn.getDb().createCollection('stats', (err, res) => {
         if (err) throw err;
         console.log('Stats collection created!');
      });
   }

   for (let page = Number(req.params.startPage); page <= Number(req.params.endPage); page++) {
      await insertStatsData(page);
   }

   console.log(req.params.startPage);
   console.log(req.params.endPage);

   res.send('Data inserted');
});

nbaEverythingRoutes.route('/delete-stats-by-season/:season').delete(async (req, res) => {
   console.log(req.params);

   await conn
      .getDb()
      .collection('stats')
      .deleteMany({ 'game.season': Number(req.params.season) }, (err, res) => {
         if (err) throw err;
      });

   res.send(`${req.params.season} stats deleted`);
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
            const playerData = response.data.data;

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

   if (allCollections.includes('players')) {
      await conn
         .getDb()
         .collection('players')
         .drop((err, deleted) => {
            if (err) throw err;
            if (deleted) console.log('Players collection deleted');
         });
   }

   for (let i = 0; i <= 40; i++) {
      await insertPlayerData(i);
   }

   res.send('Data inserted');
});

module.exports = nbaEverythingRoutes;
