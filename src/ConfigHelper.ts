/*
The purpose of this file is so that we can create class objects for every config file.
This is so that we can pass them through as parameters into functions from other files.
*/

import fs from 'fs'
import { join } from 'path'

export class Config {
    data: any;
    constructor () {
      if (!fs.existsSync(join(__dirname, 'config'))) {
        fs.mkdirSync(join(__dirname, 'config'))
      }
      try {
        const configFile = fs.readFileSync(join(__dirname, 'config/config.json'), 'utf8')
        this.data = JSON.parse(configFile)
      } catch (e) {
        if (e.code === 'ENOENT') {
          console.log('No config.json file present! Creating an example one now...')
          const exampleConfig = {
            app: {
              debug: false,
              useMultipleAccounts: false,
              collectChannelPoints: true,
              refreshRate: 15,
              dropsOnly: true,
              fallback: false,
              waitForStream: false
            },
            twitch: {
              clientid: 'abcdef123456',
              clientsecret: 'ghijkl789012',
              game: 488552
            }
          }
          try {
            fs.writeFileSync(join(__dirname, 'config/config.json'), JSON.stringify(exampleConfig, null, 4), 'utf8')
          } catch (e) {
            console.error('Error writing example config.json: ' + e)
          }
          process.exit(1)
        } else {
          throw e
        }
      }
    }
}

export class Fallback {
    data!: Array<string>;
    constructor () {
      if (!fs.existsSync(join(__dirname, 'config'))) {
        fs.mkdirSync(join(__dirname, 'config'))
      }
      try {
        const fallbackFile = fs.readFileSync(join(__dirname, 'config/fallback.json'), 'utf8')
        this.data = JSON.parse(fallbackFile)
      } catch (e) {
        if (e.code === 'ENOENT') {
          console.log('Fallback is enabled, but fallback.json does not exist. Creating an example one now...')
          const exampleFallback = [
            'Jerma985',
            'summit1g',
            'xqcow',
            'Amouranth',
            'STPeach'
          ]
          try {
            fs.writeFileSync(join(__dirname, 'config/fallback.json'), JSON.stringify(exampleFallback, null, 4), 'utf8')
          } catch (e) {
            console.error('Error writing example fallback.json: ' + e)
          }
          process.exit(1)
        } else {
          throw e
        }
      }
    }
}
