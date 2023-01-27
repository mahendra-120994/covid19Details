const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

function changeSnakeToPascal(object) {
  const keysList = Object.keys(object);

  const newObj = {};
  keysList.map((eachKey) => {
    const key = eachKey.replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) =>
      chr.toUpperCase()
    );
    newObj[key] = object[eachKey];
  });
  return newObj;
}

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Sever Running at http://localhost:3000/");
    });
  } catch (err) {
    console.log(`DB Error: ${err.massage}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// GET States API 1
app.get("/states/", async (req, res) => {
  const getStatesQuery = `
    SELECT
    *
    FROM
    state
    `;
  const statesArray = await db.all(getStatesQuery);

  const states = statesArray.map((eachState) => {
    return changeSnakeToPascal(eachState);
  });
  res.send(states);
});

// GET State by ID API 2
app.get("/states/:stateId/", async (req, res) => {
  const { stateId } = req.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const stateData = await db.get(getStateQuery);

  const state = changeSnakeToPascal(stateData);

  res.send(state);
});

// ADD District API 3
app.post("/districts/", async (req, res) => {
  const districtDetails = req.body;
  const { districtName, stateId, cases, active, deaths } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO
      district (district_name,state_id,cases,active,deaths)
    VALUES
      ('${districtName}',${stateId},${cases},${active},${deaths});`;
  await db.run(addDistrictQuery);
  res.send('District Successfully Added');
});

// GET District by ID API 4
app.get("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const districtData = await db.get(getDistrictQuery);

  const district = changeSnakeToPascal(districtData);

  res.send(district);
});

// Delete District API 5
app.delete("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const deleteDistrictQuery = `
    DELETE FROM
        district
    WHERE
        district_Id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  res.send("District Removed");
});

// Update District API 6
app.put("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const districtsDetails = req.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtsDetails;
  const updateDistrictQuery = `
  UPDATE 
   district
  SET
   district_name='${districtName}',
   state_id=${stateId},
   cases=${cases},
   cured=${cured},
   active=${active},
   deaths=${deaths}
  WHERE
   district_Id = ${districtId}`;
  await db.run(updateDistrictQuery);
  res.send("District Details Updated");
});

// GET Stats of a State API 7
app.get("/states/:stateId/stats/", async (req, res) => {
  const Id = req.params;
  const getStatsQuery = `
    SELECT
    sum(cases) as totalCases,
    sum(cured) as totalCured,
    sum(active) as totalActive,
    sum(deaths) as totalDeaths
    FROM state 
    Join district ON state.state_id = district.state_id
    WHERE
    state.state_id = ${Id.stateId}
    `;
  const stats = await db.all(getStatsQuery);
  res.send(stats);
});

// GET State by District ID API 8
app.get("/districts/:districtId/details/", async (req, res) => {
  const Id = req.params;
  const getStatesQuery = `
    SELECT
    state.state_name
    FROM state 
    Join district ON state.state_id = district.state_id
    WHERE
    district.district_id = ${Id.districtId}
    `;
  const statesArray = await db.all(getStatesQuery);

  const states = statesArray.map((eachState) => {
    return changeSnakeToPascal(eachState);
  });
  res.send(states);
});

module.exports = app;
