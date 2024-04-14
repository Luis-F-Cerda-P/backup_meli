// TODO: Interrupt the program if the current auth_key has expired! (since refresh tokens are one use and overwrite previous refresh and auth tokens, this program shouldnt get its own tokens unless it can update it for every other program that uses that token)
// For the previous point, the file or variable that is storing the token has to store the information, or calculate it, in order to know whether or not to call
const fs = require('fs')
const credentials = JSON.parse(fs.readFileSync(`./token.json`, 'utf-8'))
const token = credentials.authorization_token
const user = credentials.user_id

module.exports = {
  token,
  user
}