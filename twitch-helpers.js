const puppet = require('puppeteer-core');
const fs = require('fs');
const axios = require('axios');
const config = require('./config');

const getOauthToken = async() => {
    const { data } = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${config.twitch.clientid}&client_secret=${config.twitch.clientsecret}&grant_type=client_credentials`);
    return data['access_token'];
}


const setCookies = async(page) => {
    if(fs.existsSync('cookies.json')) {
        let cookiesArr;
        if(config.app.useMultipleAccounts) cookiesArr = require('./cookies-' + 'username' + '.json');
        else cookiesArr = require('./cookies.json');
        if(cookiesArr.length != 0)
        {
            for (let cookie of cookiesArr)
            {
                await page.setCookie(cookie);
            }
        }
    }
}


const loginToTwitch = async(browser, page) => {
    await setCookies(page);
    await page.goto('https://www.twitch.tv/login', {waitUntil: 'networkidle2'});
    let cookiesStored = fs.existsSync('./cookies.json');
    let loggedIn = await page.$('input[autocomplete="username"]') == null;
    if(!loggedIn) {
        if(cookiesStored) {
            fs.unlinkSync('./cookies.json');
        }
        browser.close();
        browser = await puppet.launch({
            executablePath: './Application/chrome.exe',
            headless: false
        });
        page = await browser.newPage();
        await page.goto('https://www.twitch.tv/login', {waitUntil: 'networkidle2'});
        await page.waitForSelector('#root > div > div.tw-flex.tw-flex-column.tw-flex-nowrap.tw-full-height > nav > div > div.tw-align-items-center.tw-flex.tw-flex-grow-1.tw-flex-shrink-1.tw-full-width.tw-justify-content-end > div:nth-child(3) > div > div.tw-relative > div > div:nth-child(1) > div > button > span > div > div > div > svg', {
            timeout: 0
        });
        const cookiesObj = await page.cookies();
        if (config.app.useMultipleAccounts) filePath = './cookies-' + cookiesObj[4]['value'] + '.json';
        else filePath = './cookies.json';
        fs.writeFileSync(filePath, JSON.stringify(cookiesObj));
    }
    await browser.close();
    browser = await puppet.launch({
        executablePath: './Application/chrome.exe',
    });
    page = await browser.newPage();
    await page.goto('https://www.twitch.tv', {waitUntil: 'networkidle2'});
    await setCookies(page);
    return [browser, page];
}

const getStreamer = async(streamer, oauth) => {
    let headers = {
        'Client-ID': config.twitch.clientid,
        'Authorization': 'Bearer ' + oauth
    };
    const { data } = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${streamer}`, {
        headers: headers
    });
    return data['data'][0];
}

const getStreamTags = async(streamerId, oauth) => {
    let headers = {
        'Client-ID': config.twitch.clientid,
        'Authorization': 'Bearer ' + oauth
    };
    const { data } = await axios.get(`https://api.twitch.tv/helix/streams/tags?broadcaster_id=${streamerId}`, {
        headers: headers
    });
    return data["data"];
}

const getTopStreamer = async(oauth) => {
    let headers = {
        'Client-ID': config.twitch.clientid,
        'Authorization': 'Bearer ' + oauth
    };
    const { data } = await axios.get(`https://api.twitch.tv/helix/streams?game_id=${config.twitch.game}`, {
        headers: headers
    });
    const sortedStreams = data['data'].sort(function(a, b) {
        return b.viewer_count - a.viewer_count;
    });
    for (let stream of sortedStreams) {
        if (stream != null && stream['type'] === 'live' && stream['language'] === 'en') {
            if(config.app.dropsOnly) {
                let streamTags = await getStreamTags(stream['user_id'], oauth);
                for (const tag of streamTags) {
                    if(tag["tag_id"] === "c2542d6d-cd10-4532-919b-3d19f30a768b")
                    {
                        return stream;
                    }
                }
            }
            else
            {
                return stream;
            }
        }
    }
}

const watchStreamer = async(browser, page, streamer) => {
    await page.setDefaultTimeout(0);
    await page.goto(`https://twitch.tv/${streamer['user_name']}`);
    await page.waitForSelector('body')
    console.log(`Now watching ${streamer['user_name']}`);
    //setTerminalTitle(`Twitch Rewards Farmer - ${username} watching ${streamer.user_name}`);
    await page.waitForTimeout(3000);
    matureButton = await page.$('button[class="player-content-button js-player-mature-accept js-mature-accept-label"]');
    if (matureButton)
    {
        await matureButton.click();
        await page.waitForTimeout(500);
    }
}

exports.getOauthToken = getOauthToken;
exports.loginToTwitch = loginToTwitch;
exports.getStreamer = getStreamer;
exports.getTopStreamer = getTopStreamer;
exports.watchStreamer = watchStreamer;