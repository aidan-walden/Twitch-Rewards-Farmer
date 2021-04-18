import axios from 'axios'
import twitch from './TwitchHelper'
import { Config } from './ConfigHelper'

const config = new Config()

async function searchForGame (query: string) {
  const oauth = await twitch.getOauthToken(config)
  const headers = {
    'Client-ID': config.data.twitch.clientid,
    Authorization: 'Bearer ' + oauth
  }
  const { data } = await axios.get(`https://api.twitch.tv/helix/games?name=${query}`, {
    headers: headers
  })
  return data.data[0].id
}

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

readline.question('Please input your game name, exactly how it appears on the Twitch website\n>', (name: string) => {
  searchForGame(name).then(console.log)
  readline.close()
})
