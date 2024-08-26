const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

let db = null

let db_path = path.join(__dirname, 'covid19India.db')

const initializeDb = async () => {
  try {
    db = await open({
      filename: db_path,
      driver: sqlite3.Database,
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
    process.exit(1)
  }
}
initializeDb()

app.get('/states/', async (request, response) => {
  const query = `
        SELECT * 
        FROM state;
    `
  const stateTemp = await db.all(query)
  const responseState = stateTemp.map(a => {
    return {
      stateId: a.state_id,
      stateName: a.state_name,
      population: a.population,
    }
  })
  response.send(responseState)
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const query = `
        SELECT * 
        FROM state
        WHERE state_id = ${stateId}
    `
  const tempState = await db.get(query)
  const responseState = {
    stateId: tempState.state_id,
    stateName: tempState.state_name,
    population: tempState.population,
  }
  response.send(responseState)
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const query = `
        INSERT INTO district(
        district_name,
        state_id,
        cases,
        cured,
        active,
        deaths)
        VALUES("${districtName}",${stateId},${cases},${cured},${active},${deaths});
    `
  await db.run(query)
  response.send('District Successfully Added')
})

app.get(`/districts/:districtId/`, async (request, response) => {
  const {districtId} = request.params
  const query = `
    SELECT * 
    FROM district
    WHERE district_id = ${districtId};
  `
  const tempObj = await db.get(query)
  const resultObj = {
    districtId: tempObj.district_id,
    districtName: tempObj.district_name,
    stateId: tempObj.state_id,
    cases: tempObj.cases,
    cured: tempObj.cured,
    active: tempObj.active,
    deaths: tempObj.deaths,
  }
  response.send(resultObj)
})

app.delete(`/districts/:districtId/`, async (request, response) => {
  const {districtId} = request.params
  const query = `
    DELETE FROM district
    WHERE district_id = ${districtId};
  `
  await db.get(query)

  response.send('District Removed')
})

app.put(`/districts/:districtId/`, async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const query = `
        UPDATE district
        SET district_name = "${districtName}",
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE district_id = ${districtId};
    `
  await db.run(query)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const query = `
        SELECT sum(cases) as totalCases, sum(cured) as totalCured, sum(active) as totalActive, sum(deaths) as totalDeaths
        FROM district
        GROUP BY state_id
        HAVING state_id = ${stateId}
    `
  const responseState = await db.get(query)
  response.send(responseState)
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const query = ` 
        SELECT state_name as stateName
        FROM state NATURAL JOIN district
        WHERE district_id = ${districtId}
    `
  const responseState = await db.get(query)
  response.send(responseState)
})

module.exports = app
