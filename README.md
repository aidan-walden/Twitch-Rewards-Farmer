# Twitch Rewards Farmer

Twitch Rewards Farmer is a Node.js project that allows you to collect rewards for various campaigns on the Twitch website. By viewing top streamers in the appropriate game category, Twitch Rewards Farmer collects drops without taking up as much compute power as a real Chrome instance, and does it all automatically.

## Installation

Requires a working installation of Node.js

1. Click the "Code" button in the top right and then click "Download ZIP".
2. Extract the contents of the zip file to a place of your choosing.
3. Open config.js in any text editor (preferably something like Visual Studio Code or Notepad++, but stock Windows notepad works fine)
4. Change this line:
```javascript
config.twitch.game = '488552';
```
Edit the number in order to reflect the game you wish to farm rewards for. 488522 is Overwatch and 516575 is Valorant. A better way for users to find game IDs for games is coming soon. KEEP THE NUMBER IN SINGLE OR DOUBLE QUOTES.

5. Make a Twitch developer app by visiting [this](https://dev.twitch.tv/console/apps) link and then clicking on the button that reads, "Register Your Application". Name and category do not matter, for OAuth redirect URLs put "http://localhost" (without quotes).

6. Once done, manage your application and create a new client secret by clicking on the "New Secret" button.

7. Back in the config.js file, change the following two lines:
```javascript
config.twitch.clientid = 'YOUR TWITCH APP CLIENT ID HERE';
config.twitch.clientsecret = 'YOUR TWITCH APP CLIENT SECRET HERE';
```
to reflect your apps information. Again, KEEP YOUR VALUES IN SINGLE OR DOUBLE QUOTES.

8. Save and close the file.

9. Open your Chrome installation directory (usually C:\Program Files (x86)\Google\Chrome) and copy the Application folder. Then, paste it in the Twitch Rewards Farmer directory.

10. Open the Twitch Rewards Farmer directory in command prompt or PowerShell, and execute
```bash
npm install
```
in order to install dependencies. 

## Usage
Execute
```bash
node .
```
in the Twitch Rewards Farmer directory in order to run the bot. If everything is working correctly, you should see a new Chrome window appear. Log into your Twitch account and check, "Remember this computer for 30 days".

# Searching for game IDs
Execute
```bash
node game-search.js
```
and follow the on-screen instructions in order to find a game ID.