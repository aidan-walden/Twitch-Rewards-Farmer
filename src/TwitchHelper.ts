import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());
import fs from 'fs';
import axios from 'axios';
import auth from './AuthHelper';
import { join } from 'path';
import { Config } from './ConfigHelper';

module Twitch {
  export interface Stream {
    id: string;
    user_id: string;
    user_login: string;
    user_name: string;
    game_id: string;
    game_name: string;
    type: string;
    title: string;
    viewer_count: number;
    started_at: string;
    language: string;
    thumbnail_url: string;
    tag_ids: Array<string>;
    is_mature: boolean;
  }

  interface Tag {
    tag_id: string;
    is_auto: boolean;
    localization_names: Object;
    localization_descriptions: Object;
  }

  interface TwitchResponse {
    data: Array<Object>;
    pagination?: Object;
  }

  export async function getOauthToken(config: Config) {
    const { data } = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${config.data.twitch.clientid}&client_secret=${config.data.twitch.clientsecret}&grant_type=client_credentials`
    );
    return data.access_token;
  }

  export async function loginToTwitch(
    browser: Browser,
    page: Page,
    config: Config
  ) {
    await auth.setCookies(page, 'twitch');
    await page.goto('https://www.twitch.tv/login', {
      waitUntil: 'networkidle2'
    });
    const cookiesStored = fs.existsSync(
      join(__dirname, 'cookies/cookies-twitch.json')
    );
    const loggedIn = (await page.$('input[autocomplete="username"]')) === null;
    if (!loggedIn) {
      console.log("Not logged in")
      if (cookiesStored) {
        fs.unlinkSync(join(__dirname, 'cookies/cookies-twitch.json'));
      }
      browser.close();
      browser = await puppeteer.launch({
        executablePath: join(__dirname, 'Application/chrome.exe'),
        // @ts-ignore
        headless: false
      });
      page = await browser.newPage();
      await page.goto('https://www.twitch.tv/login', {
        waitUntil: 'networkidle2'
      });
      await page.waitForSelector(
        '#root > div > div.Layout-sc-nxg1ff-0.gnrDvI > nav > div > div.Layout-sc-nxg1ff-0.hykItv > a:nth-child(1) > div > figure > svg',
        {
          timeout: 0
        }
      );
      const cookiesObj = await page.cookies();
      let filePath: string;
      if (config.data.app.useMultipleAccounts)
      {
        filePath = join(
          __dirname,
          'cookies/cookies-' + cookiesObj[4].value + '-twitch.json'
        );
      }
      else 
      {
        filePath = join(__dirname, 'cookies/cookies-twitch.json');
      }
      console.log("Saving cookies to " + filePath);
      fs.writeFileSync(filePath, JSON.stringify(cookiesObj, null, 2));
    }
    await browser.close();
    browser = await puppeteer.launch({
      executablePath: join(__dirname, 'Application/chrome.exe')
    });
    page = await browser.newPage();
    await page.goto('https://www.twitch.tv', { waitUntil: 'networkidle2' });
    await auth.setCookies(page, 'twitch');
    return [browser, page];
  }

  export async function getStreamer(
    streamer: string,
    oauth: string,
    config: Config
  ): Promise<Stream | null> {
    const headers = {
      'Client-ID': config.data.twitch.clientid,
      Authorization: 'Bearer ' + oauth
    };
    const { data }: { data: TwitchResponse } = await axios.get(
      `https://api.twitch.tv/helix/streams?user_login=${streamer}`,
      {
        headers: headers
      }
    );
    if (data.data.length > 0) {
      return data.data[0] as Stream;
    }
    return null;
  }

  export async function getStreamTags(
    streamerId: string,
    oauth: string,
    config: Config
  ): Promise<Array<Tag>> {
    const headers = {
      'Client-ID': config.data.twitch.clientid,
      Authorization: 'Bearer ' + oauth
    };
    const { data }: { data: TwitchResponse } = await axios.get(
      `https://api.twitch.tv/helix/streams/tags?broadcaster_id=${streamerId}`,
      {
        headers: headers
      }
    );
    return data.data as Array<Tag>;
  }

  export async function getTopStreamer(
    oauth: string,
    config: Config
  ): Promise<Stream | null> {
    const headers = {
      'Client-ID': config.data.twitch.clientid,
      Authorization: 'Bearer ' + oauth
    };
    const { data }: { data: TwitchResponse } = await axios.get(
      `https://api.twitch.tv/helix/streams?game_id=${config.data.twitch.game}`,
      {
        headers: headers
      }
    );
    const streams = data.data as Array<Stream>;
    const sortedStreams = streams.sort(function (a: Stream, b: Stream) {
      return b.viewer_count - a.viewer_count;
    });
    for (const stream of sortedStreams) {
      if (
        stream !== null &&
        stream.type === 'live' &&
        stream.language === 'en'
      ) {
        if (config.data.app.dropsOnly) {
          const streamTags = await getStreamTags(stream.user_id, oauth, config);
          for (const tag of streamTags) {
            if (tag.tag_id === 'c2542d6d-cd10-4532-919b-3d19f30a768b') {
              return stream;
            }
          }
        } else {
          return stream;
        }
      }
    }
    return null;
  }

  export async function getFirstStreamerInArray(
    list: Array<string>,
    oauth: string,
    config: Config
  ): Promise<Stream | null> {
    for (const streamer of list) {
      const stream = await getStreamer(streamer, oauth, config);
      if (stream !== null && stream.type === 'live') {
        return stream;
      }
    }
    return null;
  }

  export async function watchStreamer(
    browser: Browser,
    page: Page,
    streamer: Stream
  ): Promise<void> {
    await page.setDefaultTimeout(0);
    await page.goto(`https://twitch.tv/${streamer.user_name}`);
    await page.waitForSelector('body');
    console.log(`Now watching ${streamer.user_name}`);
    // setTerminalTitle(`Twitch Rewards Farmer - ${username} watching ${streamer.user_name}`);
    await page.waitForTimeout(3000);
    const matureButton = await page.$(
      'button[class="player-content-button js-player-mature-accept js-mature-accept-label"]'
    );
    if (matureButton) {
      await matureButton.click();
      await page.waitForTimeout(500);
    }
  }
}

export default Twitch;
