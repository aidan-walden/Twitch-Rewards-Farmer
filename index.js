const puppet = require('puppeteer-core');
const config = require('./config');
const twitch = require('./twitch-helpers');

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
    await twitch.watchStreamer(browser, page, streamer);
    setInterval(async() => {
        let streamer = await twitch.getTopStreamer(oauthToken);
        await twitch.watchStreamer(browser, page, streamer);
    }, config.app.refreshRate * 60000);
})();