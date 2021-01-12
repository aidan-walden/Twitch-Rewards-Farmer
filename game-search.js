const axios = require('axios');
const config = require('./config');
const twitchhelpers = require('./twitch-helpers'); 

const searchForGame = async(query) => {
    const oauth = await twitchhelpers.getOauthToken();
    let headers = {
        'Client-ID': config.twitch.clientid,
        'Authorization': 'Bearer ' + oauth
    };
    const { data } = await axios.get(`https://api.twitch.tv/helix/games?name=${query}`, {
        headers: headers
    });
    return data["data"][0]["id"];
}

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})


readline.question(`Please input your game name, exactly how it appears on the Twitch website\n>`, name => {
    searchForGame(name).then(console.log)
    readline.close()
})