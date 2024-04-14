const fs = require('fs')
const credentials = JSON.parse(fs.readFileSync(`./token.json`, 'utf-8'))
const token = credentials.authorization_token
const user = credentials.user_id

module.exports = {
  token,
  user
}