import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

import twitch from './TwitchHelper';
import fs from 'fs';
import { join } from 'path';
import { Config, Fallback } from './ConfigHelper';
import { Browser, Page } from 'puppeteer';

const config = new Config();
let fallback: Fallback;

async function refreshStream(browser: any, page: any, oauth: string) {
  console.log('Refreshing stream...');
  let streamer = await twitch.getTopStreamer(oauth, config);
  if (streamer === null) {
    process.stdout.write(
      'Could not find any streamers that matched the settings in your config.'
    );
    if (config.data.app.fallback === false) {
      if (config.data.app.waitForStream === false) {
        process.exit(1);
      }
      console.log(' Will check again on next refresh.');
    } else {
      console.log(' Using fallback streamers instead...');
      const fallbackStreamer = await twitch.getFirstStreamerInArray(
        fallback.data,
        oauth,
        config
      );
      if (fallbackStreamer === null) {
        process.stdout.write(
          'None of the fallback streamers are currently live.'
        );
        if (config.data.app.waitForStream === false) {
          process.exit(1);
        }
        console.log(' Will check again on next refresh.');
      }
      streamer = fallbackStreamer;
    }
  }
  if (config.data.app.debug === true) {
    console.log('====================');
    console.log('streamer');
    console.log(streamer);
    console.log('====================');
    console.log('currentStreamer');
    console.log(currentStreamer);
    console.log('====================');
  }
  if (streamer !== null) {
    if (currentStreamer === undefined) {
      currentStreamer = streamer;
      await twitch.watchStreamer(browser, page, streamer);
    } else if (streamer.user_name !== currentStreamer.user_name) {
      console.log(
        'The streamer is either no longer live, has changed games, or has disabled drops. Finding new streamer...'
      );
      currentStreamer = streamer;
      await twitch.watchStreamer(browser, page, streamer);
    }
  }
}

if (config.data.app.fallback === true) {
  fallback = new Fallback();
}

if (!fs.existsSync(join(__dirname, 'cookies'))) {
  fs.mkdirSync(join(__dirname, 'cookies'));
}

let currentStreamer: twitch.Stream;

puppeteer
  .launch({
    executablePath: join(__dirname, 'Application/chrome.exe'),
    // @ts-ignore
    headless: true
  })
  .then(async (browser) => {
    let page = await browser.newPage();
    await page.setViewport({
      width: 1280,
      height: 720,
      deviceScaleFactor: 1
    });

    const oauthToken = await twitch.getOauthToken(config);
    const loginResult = await twitch.loginToTwitch(browser, page, config);
    browser = loginResult[0] as Browser;
    page = loginResult[1] as Page;

    await refreshStream(browser, page, oauthToken);
    setInterval(async () => {
      await refreshStream(browser, page, oauthToken);
    }, config.data.app.refreshRate * 60000);
  });
