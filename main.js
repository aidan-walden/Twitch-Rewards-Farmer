const puppet = require('puppeteer');
const readline = require('readline');
const https = require('https');
const fs = require('fs');
const ini = require('ini');

const config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
let loggedIn;

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

function RewardsStream(username, startTime, endTime) {
    this.username = username;
    this.startTime = startTime;
    this.endTime = endTime;
}

function setTerminalTitle(title)
{
  process.stdout.write(
    String.fromCharCode(27) + "]0;" + title + String.fromCharCode(7)
  );
}

function getPointsInt(pointsStr) {
    let numString = pointsStr.replace(/,/g, '');
	numString = numString.split(' ')[0];
	return parseInt(numString);
}

async function loginToTwitch(browser, page, cookiesPath = null, callback) {
    await (async () => {
        let username;
        let cookiesStored = fs.existsSync('./cookies.json');
        if (cookiesStored) {
            console.log("Loading cookies...")
            if (config.AppBehavior.UseMultipleAccounts == 'yes') {
                let cookies = JSON.parse(fs.readFileSync('./cookies.json', 'utf8'));
                username = cookies[4]['value'];
                fs.renameSync('./cookies.json', './cookies-' + username + '.json');
            }

            let cookiesArr;
            if (config.AppBehavior.UseMultipleAccounts == 'yes') cookiesArr = require('./cookies-' + username + '.json');
            else cookiesArr = require('./cookies.json');
            if (cookiesArr.length != 0) {
                for (let cookie of cookiesArr) {
                    await page.setCookie(cookie);
                }
            }
            console.log("Cookies loaded, logging in with cookies...")
        } else if (config.AppBehavior.UseMultipleAccounts == 'yes') {
            let loginUsername
            if (!cookiesPath) {
                loginUsername = await askQuestion("What username would you like to login with? (This is only used to get cookies from an existing login, if you haven't logged in before you can leave this blank)\n>");
                cookiesPath = './cookies-' + loginUsername + '.json';
            }
            console.log("COOKIES PATH: " + cookiesPath);
            if (fs.existsSync(cookiesPath)) {
                cookiesStored = true;
                const cookiesArr = require(cookiesPath);
                username = loginUsername;
                if (cookiesArr.length != 0) {
                    for (let cookie of cookiesArr) {
                        await page.setCookie(cookie);
                    }
                }
            }
        }
        await page.goto('https://twitch.tv/login');
        //page.waitForNavigation({ waitUntil: 'networkidle0' }) //Wait for page to be loaded
        loggedIn = await page.$('input[autocomplete="username"]') == null;
        if (!loggedIn) {
            console.log("We have to login");
            if (cookiesStored) {
                let filePath;
                if (config.AppBehavior.UseMultipleAccounts == 'yes') filePath = './cookies-' + username + '.json';
                else filePath = './cookies.json';
                fs.unlink((filePath), (err) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
                await browser.close();
                console.log("Please restart the application in order to manually log into Twitch.");
                return;
            } else {
                await page.waitForSelector('polygon.tw-animated-glitch-logo__body')
                //.waitForNavigation()
                console.log("We should be logged in now.");
                loggedIn = true;
                //page.removeAllListeners('pageerror');
                let filePath;
                const cookiesObj = await page.cookies();
                if (config.AppBehavior.UseMultipleAccounts == 'yes') filePath = './cookies-' + cookiesObj[4]['value'] + '.json';
                else filePath = './cookies.json';
                fs.writeFileSync(filePath, JSON.stringify(cookiesObj));
                await loginToTwitch(browser, page, filePath, callback);

            }
        } else {
            await browser.close();
            console.log("No manual login necessary.");
            if (config.AppBehavior.UseMultipleAccounts == 'yes') callback(cookiesPath.split('-')[1].split('.')[0]);
            else callback(cookiesPath.split('.')[0]);
        }

    })();
}


function getStreamer(streamer) {
    let headers = {
        'Client-ID': config.RequestData.clientid
    };
    https.get('https://api.twitch.tv/helix/streams?user_login=' + streamer, {headers: headers}, (res) => {
        let body = "";
        res.on("data", (chunk) => {
            body += chunk;
        });

        res.on("end", () => {
            try {
                console.log("Pushing streamer...");
                let data = JSON.parse(body);
                data = data.data[0];
                return data;
            }
            catch (error) {
                console.log("Line 140");
                console.error(error.message);
            }
        }).on("error", (error) => {
            console.error(error.message);
        });
    });
}

async function getStreamers(streamers) {
    let streams = [];
    const iterateStreamers = new Promise((resolve, reject) => {
        for(let i = 0; i < streamers.length; i++) {
            //We want to get ALL streams first, push to array, THEN iterate through
            console.log("Searching for streamer");
            streams.push(getStreamer(streamers[i]));
            if (i == streamers.length - 1) resolve();
        }
    });
    iterateStreamers.then(() => {

    })
}

async function viewTopStreamer(streamers = null) {
    //Overwatch title id is 488552
    //Valorant title id is 516575
    let headers = {
        'Client-ID': config.RequestData.clientid
    };
    let topStream;
    //Request top streamers
    if(!streamers){
        https.get('https://api.twitch.tv/helix/streams?game_id=' + config.RequestData.game, {headers: headers}, (res) => {
            let body = "";
            res.on("data", (chunk) => {
                body += chunk;
            });
            
            res.on("end", () => {
                try {
                    let data = JSON.parse(body);
                    const sortedStreams = data.data.sort(function(a, b) {
                        return b.viewer_count - a.viewer_count;
                    });
                    for (let i = 0; i < sortedStreams.length; i++) {
                        if (sortedStreams[i].type == 'live' && sortedStreams[i].language == 'en') {
                            topStream = sortedStreams[i];
                            break;
                        }
                    }
                    afterEval(topStream, streamers);
                } catch (error) {
                    console.log("Line 185");
                    console.error(error.message);
                }
            }).on("error", (error) => {
                console.error(error.messasge);
            });
            
            /*async.forEach(data.data, evaluateStream, afterEval);
            
            function evaluateStream(stream, callback) {
                if (stream.type == 'live' && stream.language == 'en') {
                    topStream = stream;
                    callback();
                }
                else
                {
                    console.log(stream.type);
                    console.log(stream.language);
                }
            }*/
        });
    }
    else
    {
        let streams = await getStreamers(streamers);
        console.log("You should only see this after push streamer");
        for(let i = 0; i < streams.length; i++) {
            console.log("Evaluating streamer");
            if(streams[i] != null && streams[i].type == 'live' && streams[i].game_id == config.RequestData.game) {
                if(config.AppBehavior.DropsEnabledOnly == 'yes') {
                    if(streams[i].tag_ids.includes("c2542d6d-cd10-4532-919b-3d19f30a768b")) {
                        console.log("Found streamer");
                        afterEval(streams[i], streamers);
                        break;
                    }
                    else
                    {
                        console.log("Bad stream found");
                    }
                }
                else {
                    console.log("Found streamer");
                    afterEval(streams[i], streamers);
                    break;
                }
            }
            else
            {
                console.log("Bad stream found");
            }
        }
        
        
    }

    async function afterEval(topStream, streamers) {
        //View that livestream
        if(!topStream) {
            console.log("No valid streamers found in preferredstreamers.txt");
            return;
        }
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
        await page.setDefaultTimeout(0);
        if (!loggedIn) {
            await loginToTwitch(browser, page, null, async function(username, streamers) {
                browser = await puppet.launch({
                    executablePath: './Application/chrome.exe'
                });
                page = await browser.newPage();
                await page.setViewport({
                    width: 1280,
                    height: 720,
                    deviceScaleFactor: 1,
                });
                let cookiesArr;
                if(config.AppBehavior.UseMultipleAccounts == 'yes') cookiesArr = require('./cookies-' + username + '.json');
                else cookiesArr = require('./cookies.json');
                if(cookiesArr.length != 0)
                {
                    for (let cookie of cookiesArr)
                    {
                        await page.setCookie(cookie);
                    }
                }
                await page.setDefaultTimeout(0);
                await page.goto(`https://twitch.tv/${topStream.user_name}`);
                await page.waitFor('body')
                console.log(`Now watching ${topStream.user_name}`);
                setTerminalTitle(`Twitch Rewards Farmer - ${username} watching ${topStream.user_name}`);
                await page.waitFor(3000);
                matureButton = await page.$('button[class="player-content-button js-player-mature-accept js-mature-accept-label"]');
                if (matureButton)
                {
                    await matureButton.click();
                    await page.waitFor(500);
                }
                //This whole quality thing will not do anything if the streamer does not have enough viewers to qualify for transcoding
                await page.mouse.move(1070, 740); //Settings
                await page.mouse.click(1070, 740);
                await page.mouse.move(786, 535); //Quality
                await page.mouse.click(786, 535);
                await page.mouse.move(792, 684); //Lowest possible
                await page.mouse.click(792, 684);
            });
        }
        
        let channelPointsInterval;
        const checkStreamInterval = setInterval(function() { //Check if streamer is still live and streaming game of choice every 15 mins
            https.get(`https://api.twitch.tv/helix/streams?user_id=${topStream.user_id}`, {headers: headers}, (res) => {
                let body = "";
                res.on("data", (chunk) => {
                    body += chunk;
                });
                
                res.on("end", () => {
                    try {
                        let data = JSON.parse(body);
                    if (data.data[0] == null || data.data[0].game_id != config.RequestData.game) {
                        //Request top streamers again
                        clearInterval(checkStreamInterval);
                        clearInterval(channelPointsInterval);
                        console.log(`${topStream.user_name} is not live anymore or has switched games. Switching streams...`);
                        viewTopStreamer(streamers);
                    }
                    } catch (error) {
                        console.error(error.message);
                    }
                }).on("error", (error) => {
                    console.error(error.messasge);
                });
            });
        }, 900000);

        if(config.AppBehavior.CollectChannelPoints == 'yes') {
            channelPointsInterval = setInterval(async function() {
                pointsButton = await page.$('button[class="tw-button tw-button--success tw-interactive"]');
                if(pointsButton) {
                    let oldPoints = await page.evaluate(() => {
                        return document.getElementsByClassName('community-points-summary')[0].children[0].children[1].children[1].textContent;
                    });
                    oldPoints = getPointsInt(oldPoints);
                    await pointsButton.click();
                    setTimeout(async function(oldPoints) {
                        let newPoints = await page.evaluate(() => {
                            return document.getElementsByClassName('community-points-summary')[0].children[0].children[1].children[1].textContent;
                        });
                        let newPointsInt = getPointsInt(newPoints);
                        console.log("Claimed " + (newPointsInt - oldPoints) + " for a new total of " + newPoints);
                    }, 5000, oldPoints);
                }
            }, 150000);
        }
    }


}

setTerminalTitle('Twitch Rewards Farmer');
if(fs.existsSync('./Application'))
{
    if(config.RequestData.clientid == "") {
        console.log("Please set your client ID in the config.ini file.");
        return;
    }
    if(fs.existsSync('./streams.txt'))
    {
        let lines = fs.readFileSync('./streams.txt', 'utf8').toString();
        lines = lines.split('\n');

        let streams = [];
        lines.forEach(function(element) {
            let now = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
            now = new Date(now);
            let username = element.split('twitch.tv/')[1].replace('\r', '');
            let startTime = new Date(element.split(' 	')[1].split(' –')[0].replace('(', now.getFullYear() + ' ')).toLocaleString("en-US", {timeZone: "America/New_York"});
            let endTime = new Date((element.split(' 	')[1].split(' (')[0] + ' ' + now.getFullYear() + ' ' + element.split('– ')[1]).split(')')[0]).toLocaleString("en-US", {timeZone: "America/New_York"});
            endTime = new Date(endTime);
            startTime = new Date(startTime);
            if(startTime.getTime() > endTime.getTime())
            {
                endTime.setDate(endTime.getDate() + 1);
            }
            streams.push(new RewardsStream(username, startTime, endTime));
        });
        console.log(streams);
        
        (async () => {
            const shouldContinue = await askQuestion('Does this look right to you? All times automatically converted to EST. (Y/N):\n>');
            if(shouldContinue.toLowerCase() == 'n')
            {
                return;
            }
            const browser = await puppet.launch({
                executablePath: './Application/chrome.exe'
            });
            loginToTwitch(browser)
            for(let i = 0; i < streams.length; i ++)
            {
                let now = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
                now = new Date(now);
                if(streams[i].endTime.getTime() - now.getTime() < 0)
                {
                    console.log(`${streams[i].username}'s stream has already ended. Skipping.`);
                }
                else
                {
                    await page.goto(`https://twitch.tv/${streams[i].username}`);
                    console.log(`Now watching ${streams[i].username}`);
                    setTerminalTitle(`Twitch Rewards Farmer - ${streams[i].username}`);
                    await page.waitFor(3000);
                    matureButton = await page.$('button[class="player-content-button js-player-mature-accept js-mature-accept-label"]');
                    if (matureButton != null)
                    {
                        await matureButton.click();
                        await page.waitFor(500);
                    }
                    await page.mouse.move(825, 469); //Settings
                    await page.mouse.click(825, 469);
                    await page.mouse.move(849, 330); //Quality
                    await page.mouse.click(849, 330);
                    await page.mouse.move(849, 435); //Lowest possible
                    await page.mouse.click(849, 435);
                    if(i == streams.length - 1)
                    {
                        await page.waitFor(streams[i].endTime.getTime() - now.getTime());
                    }
                    else
                    {
                        await page.waitFor(streams[i + 1].startTime.getTime() - now.getTime());
                    }
                }
            }
            await browser.close();
        })();
    }
    else
    {
        if(fs.existsSync('./preferredstreamers.txt')) {
            let prefStreamers = fs.readFileSync("./preferredstreamers.txt").toString();
            console.log("Looking for streamers in preferredstreamers.txt");
            viewTopStreamer(prefStreamers.split("\n"));
        } else {
            console.log('No streams.txt file found. Viewing top streamer in game category... (if you would like to prefer specific streamers, please create a file called preferredstreamers.txt and type the usernames of each streamer, most preferred at the top.)');
            viewTopStreamer();
        }
    }
}
else
{
    console.log('Please copy the Application directory from C:\\Program Files (x86)\\Google\\Chrome and paste it in this folder. Then try again.');
}
