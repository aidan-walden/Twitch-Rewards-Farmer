import fs from 'fs'
import { Page } from 'puppeteer-core'
import { join } from 'path'

module AuthHelpers {
    export async function setCookies (page: Page, service: string) {
      if (fs.existsSync(join(__dirname, 'cookies/cookies-' + service + '.json'))) {
        const cookiesFile = fs.readFileSync(join(__dirname, 'cookies/cookies-' + service + '.json'), 'utf8')
        const cookies = JSON.parse(cookiesFile)
        await page.setCookie(...cookies)
      }
    }
}
export default AuthHelpers
