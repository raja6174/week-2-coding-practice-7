const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
app.use(express.json());

let db = null;
let filePath = path.join(__dirname, "cricketMatchDetails.db");
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const snakeToCamelCase = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    playerMatchId: dbObject.player_match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const getPlayerDetails = `
    SELECT * 
    FROM
    player_details
    ORDER BY player_id;
    `;

  const detailsArray = await db.all(getPlayerDetails);
  response.send(detailsArray.map((eachItem) => snakeToCamelCase(eachItem)));
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
    SELECT * 
    FROM 
    player_details
    WHERE 
        player_id = ${playerId}
    `;

  const player = await db.get(getPlayer);
  response.send(snakeToCamelCase(player));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePLayer = `
    UPDATE player_details
    SET 
    player_name = '${playerName}'
    WHERE player_id = ${playerId}
    `;
  await db.run(updatePLayer);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatch = `
    SELECT  *
    FROM
match_details
WHERE match_id = ${matchId};
`;
  const match = await db.get(getMatch);
  response.send(snakeToCamelCase(match));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatches = `
     SELECT 
        match_details.match_id,
        match,
        year
    FROM
        match_details
        INNER JOIN player_match_score ON match_details.match_id = player_match_score.match_id
    WHERE 
        player_match_score.player_id = ${playerId};
    GROUP BY 
        player_id
    ORDER BY 
        match_details.match_id ;
    `;
  const playerMatchesArray = await db.all(getPlayerMatches);
  response.send(
    playerMatchesArray.map((eachItem) => snakeToCamelCase(eachItem))
  );
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayers = `
        SELECT 
         player_details.player_id,
         player_name
         FROM 
         player_details
         INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
         WHERE 
            match_id = ${matchId};
    `;

  const playersArray = await db.all(getPlayers);
  response.send(playersArray.map((eachItem) => snakeToCamelCase(eachItem)));
});

//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStats = `
        SELECT 
        player_details.player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) As totalSixes
        FROM 
        player_details 
        INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
        WHERE 
           player_details.player_id = ${playerId}
        GROUP BY 
        player_details.player_id
    `;
  const player = await db.get(getPlayerStats);
  response.send(player);
});

module.exports = app;
