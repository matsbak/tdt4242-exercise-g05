const db = require('better-sqlite3')('guidebook.db', options);

const express = require('express')
const app = express()
const port = 3000

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
