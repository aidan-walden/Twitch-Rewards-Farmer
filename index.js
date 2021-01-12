const puppet = require('puppeteer-core');
const config = require('./config');
const twitch = require('./twitch-helpers');

let currentStreamer;

(async () => {
    let oauthToken = await twitch.getOauthToken();
    let browser = await puppet.launch({
        executablePath: './Application/chrome.exe',
        headless: false
    });
    let page = await browser.newPage();
    await page.setViewport({
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
    });
    let loginResult = await twitch.loginToTwitch(browser, page);
    browser = loginResult[0];
    page = loginResult[1];
    let streamer = await twitch.getTopStreamer(oauthToken);
    if(streamer === undefined)
    {
        console.log("Could not find any streamers that matched the settings in your config.");
        process.exit(1);
    }
    currentStreamer = streamer;
    console.log('====================');
    console.log('streamer');
    console.log(streamer);
    console.log('====================');
    console.log('currentStreamer');
    console.log(currentStreamer);
    console.log('====================');
    await twitch.watchStreamer(browser, page, streamer);
    setInterval(async() => {
        streamer = await twitch.getTopStreamer(oauthToken);
        console.log('====================');
        console.log('streamer');
        console.log(streamer);
        console.log('====================');
        console.log('currentStreamer');
        console.log(currentStreamer);
        console.log('====================');
        if(streamer['user_name'] !== currentStreamer['user_name']) {
            console.log("The streamer is either no longer live, has changed games, or has disabled drops. Finding new streamer...");
            currentStreamer = streamer;
            await twitch.watchStreamer(browser, page, streamer);
        }
    }, config.app.refreshRate * 60000);
})();