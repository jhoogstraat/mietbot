import * as puppeteer from 'puppeteer'

async function main() {
    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()
    await page.goto("https://google.com")
    await browser.close()
}

main()
