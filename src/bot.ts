import * as puppeteer from 'puppeteer';
import * as dappeteer from '@chainsafe/dappeteer';

const fs = require('fs');

async function getTextFromElementXpath(page, xpath) {
    const element = (await page.$x(xpath))[0];
    return await page.evaluate(el => el.textContent, element);
}

async function bringToFrontCallback() {
    let page = this
    await page.bringToFront()
    await page.waitForTimeout(2000);
}

async function waitUntilElementExist(page: puppeteer.Page, xpath: string, retryCallback) {
    while ((await page.$x(xpath)) [0] == undefined) {
        await retryCallback()
    }

}


async function tryClick(page: puppeteer.Page, ele: puppeteer.ElementHandle, retryCallback = undefined, attempts = 3, waitTime = 3000, clickOptions = {}) {
    if (!ele) {
        throw Error(`Element invalid: It is ${ele}`)
    }
    let retry = 1

    while (true) {
        try {
            await ele.click()
            if (retry > 1) {
                console.log('Retry success!!!')
            }
            return true
        } catch (error) {
            if (attempts == 0) {
                throw error
            }
            console.log(`Cannot click ${ele} Retry ${retry}...`)
            if (retryCallback != undefined) {
                await retryCallback()
            }

            attempts--;
            retry++;
        }
    }


}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


class Bot {
    browser: puppeteer.Browser;
    itemUrl: string;
    password: string;
    seed: string;
    profile: string
    isAddedNetwork: boolean
    executedSteps = []
    metamask;

    //constructor
    constructor(itemUrl, profile, password, seed) {
        this.itemUrl = itemUrl
        this.profile = profile
        this.password = password
        this.seed = seed
    }

    async getErrorAfterConfirmBuying(page) {
        let message;
        let messageDesc;
        try {
            const noticeMessageXpath = "//div[@class='ant-notification-notice-message']"
            const messageDescXpath = "//div[@class='ant-notification-notice-description']"
            await page.waitForXPath(noticeMessageXpath)
            message = await getTextFromElementXpath(page, noticeMessageXpath)
            messageDesc = await getTextFromElementXpath(page, messageDescXpath)
            this.setLastStep(`Get error notice message ${message}:${messageDesc}`)
        } catch {
            this.setLastStep('No error message after clicking confirm')
        }
        if (message) {
            throw Error(`Failed as ${message}:${messageDesc}`)
        }

    }


    async metaMaskConfirm() {

        await this.metamask.confirmTransaction()
        //Bug in the library, temporary fix buy click confirm again
        const metamaskPage = this.metamask.page
        await metamaskPage.waitForXPath("//footer/button[text()='Confirm'][not(@disabled)]")

        const approveTransactionXpath = "//footer/button[text()='Confirm'][not(@disabled)]"
        const approveTransactionButton = (await metamaskPage.$x(approveTransactionXpath))[0];
        // await sleep(1000);
        this.setLastStep('Try to click confirm again as a bug in library')
        await tryClick(metamaskPage, approveTransactionButton)
    }

    async build() {
        this.isAddedNetwork = fs.existsSync(this.profile)
        this.browser = await dappeteer.launch(puppeteer, {
            metamaskVersion: 'v10.1.1',
            userDataDir: this.profile,
            args: [
                '--start-maximized' // you can also use '--start-fullscreen'
            ]
        });
        return this
    }

    setLastStep(message) {
        this.executedSteps.push(message)
        console.log(message)
    }

    async executeBot() {
        const META_PASSWORD = this.password
        const META_SEED = this.seed
        const ITEM_URL = this.itemUrl

        const browser = this.browser
        let metamask;
        let page;

        if (this.isAddedNetwork) {
            //Wait for meta mask windows display
            await sleep(4000);
            metamask = await dappeteer.getMetamaskWindow(browser);
            this.metamask = metamask
            let pages = await browser.pages()
            await pages[1].evaluate((s) => {
                window['signedIn'] = s;
            }, false)
            await metamask.unlock(META_PASSWORD)
            page = await browser.newPage();
            await page.goto('https://market.radiocaca.com/#/market-place');
        } else {
            metamask = await dappeteer.setupMetamask(browser, {
                seed: META_SEED,
                password: META_PASSWORD
            });
            this.metamask = metamask
            await metamask.addNetwork({
                networkName: "Smart Chain",
                rpc: "https://bsc-dataseed.binance.org/",
                chainId: 56,
                symbol: "BNB",
                explorer: "https://bscscan.com"
            })
            await metamask.switchNetwork('Smart Chain');
            this.setLastStep('Add network success')
            page = await browser.newPage();
            await page.goto('https://market.radiocaca.com/#/market-place');
            // you can change the network if you want
            const connectWalletButton = (await page.$x('//*[contains(@class,"connect-btn")]'))[0];
            await tryClick(page, connectWalletButton, bringToFrontCallback.bind(page));
            const metamaskButton = (await page.$x('//button/img[contains(@alt,"MetaMask")]/..'))[0];
            await tryClick(page, metamaskButton);
            await metamask.approve()


            this.setLastStep('Connect approve success')

        }

        // go to a dapp and do something that prompts MetaMask to confirm a transaction
        await page.goto(ITEM_URL);

        const buyNowXpath = "//button/span[text()='Buy Now']"
        await waitUntilElementExist(page, buyNowXpath, bringToFrontCallback.bind(page))
        let buyNowButton = (await page.$x(buyNowXpath))[0];
        await tryClick(page, buyNowButton, bringToFrontCallback.bind(page));


        const newBuyNowXpath = "//div[@class='ant-modal-body']/div/button[not(contains(@class,'disabled-btn'))]/span[text()='Buy Now']/.."
        let newBuyNowButton = (await page.$x(newBuyNowXpath))[0]
        //Check if we have BuyNowButton (Not disable), If not try to approve
        if (!newBuyNowButton) {
            const approveRacaButton = (await page.$x("//button[not(contains(@class,'disabled-btn'))]/span[text()='Approve Raca']/.."))[0]
            await tryClick(page, approveRacaButton, bringToFrontCallback.bind(page))
            this.setLastStep('Clicked approve raca button')
            await this.metaMaskConfirm()

            this.setLastStep('Confirm successfully')
            //Check until approve Buy now Enable
            await waitUntilElementExist(page, newBuyNowXpath, bringToFrontCallback.bind(page))
            newBuyNowButton = (await page.$x(newBuyNowXpath))[0]

        }

        this.setLastStep('Try to click Buy Now')
        await sleep(1000)
        await tryClick(newBuyNowButton, bringToFrontCallback.bind(page))
        this.setLastStep('clicked Buy Now')

        const confirmButtonXpath = "//div[@class='ant-modal-body']/div/button[not(contains(@class,'disabled-btn'))]/span[text()='Confirm']/.."

        this.setLastStep('Try to click confirm Button')
        await waitUntilElementExist(page, confirmButtonXpath, bringToFrontCallback.bind(page))
        const confirmButton = (await page.$x(confirmButtonXpath))[0]
        await tryClick(confirmButton, bringToFrontCallback.bind(page))
        this.setLastStep('Clicked confirm')


        await Promise.all([this.metaMaskConfirm(),
            this.getErrorAfterConfirmBuying(page)]);

        await sleep(4000);
        await browser.close()
        return true
    }


}


export {Bot};
