# Twitch Rewards Farmer

Twitch Rewards Farmer is a TypeScript project that allows you to collect rewards for various campaigns on the Twitch website. By viewing top streamers in the appropriate game category, Twitch Rewards Farmer collects drops without being as obtrusive as a real Chrome instance, and does it all automatically.

## Installation

Requires a working installation of Node.js

1. Go to the releases section and download the latest release (or, compile the TypeScript code yourself. This guide will not cover that in detail).
2. Extract the contents of the zip file to a place of your choosing.
3. Open the Twitch Rewards Farmer directory in command prompt or PowerShell, and execute:
```bash
npm install --only=prod
```
in order to install dependencies. Run the following command instead if you are planning on changing the code and/or compiling it yourself:
```bash
npm install
``` 
4. Run the program once by executing:
```bash
node index.js
```
This will generate a config file for you.

5. Navigate to the ```config.json``` file with your preferred text editor and change this line (line 16 by default):
```json
        "game": 488552
```
Change the number to match the game ID for your game. Do not put the number in quotes. For reference, 488522 is Overwatch and 516575 is Valorant. See instructions on how to find the ID for another game further down below.

6. Make a Twitch developer app by visiting [this](https://dev.twitch.tv/console/apps) link and then clicking on the button that reads, "Register Your Application". Name and category do not matter, for OAuth redirect URLs put "http://localhost" (without quotes).

7. Once done, manage your application and create a new client secret by clicking on the "New Secret" button.

8. Back in the ```config.json``` file, change the following two lines:
```json
        "clientid": "abcdef123456",
        "clientsecret": "ghijkl789012",
```
to reflect your apps information. Keep the information in single or double quotes, or else the application will fail to start. Again, the game ID is not supposed to have quotes, but these two tokens should have them.

9. Save and close the file.

10. Open your Chrome installation directory (usually C:\Program Files (x86)\Google\Chrome on Windows) and copy the Application folder. Then, paste it in the Twitch Rewards Farmer directory along with index.js and the other JavaScript files.

## Usage
Execute
```bash
node index.js
```
in the Twitch Rewards Farmer directory in order to run the bot. If everything is working correctly, you should see a new Chrome window appear. Log into your Twitch account and check, "Remember this computer for 30 days".

### Searching for game IDs
Execute
```bash
node game-search.js
```
and follow the on-screen instructions in order to find a game ID.

## Configuration (beyond required values)
Please see the [configuration wiki page](https://github.com/aidan-walden/Twitch-Rewards-Farmer/wiki/Configuration) in order to find further information on configuring Twitch Rewards Farmer.