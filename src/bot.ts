import * as puppeteer from 'puppeteer';
import * as dappeteer from '@chainsafe/dappeteer';
import {redisClient} from "./redis";

const fs = require('fs');

async function bringToFrontCallback() {
    let page = this
    await page.bringToFront()
    await page.waitForTimeout(2000);
}

async function waitUntilElementExist(page, xpath, retryCallback) {
    while ((await page.$x(xpath)) [0] == undefined) {
        await retryCallback()
    }

}

async function tryClick(ele, retryCallback = undefined, attempts = 3, waitTime = 3000, clickOptions = {}) {
    if (!ele) {
        throw Error(`Element invalid: It is ${ele}`)
    }
    let retry = 1

    while (true) {
        try {
            clickOptions ? await ele.click() : await ele.click(clickOptions);
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
    run: any

    //constructor
    constructor(itemUrl, profile, password, seed) {
        this.itemUrl = itemUrl
        this.profile = profile
        this.password = password
        this.seed = seed
    }

    async build() {
        this.isAddedNetwork = fs.existsSync(this.profile)
        this.browser = await dappeteer.launch(puppeteer, {
            metamaskVersion: 'v10.1.1',
            userDataDir: this.profile

        });
        return this
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
            await metamask.addNetwork({
                networkName: "Smart Chain",
                rpc: "https://bsc-dataseed.binance.org/",
                chainId: 56,
                symbol: "BNB",
                explorer: "https://bscscan.com"
            })
            await metamask.switchNetwork('Smart Chain');
            console.log('Add network success')
            page = await browser.newPage();
            await page.goto('https://market.radiocaca.com/#/market-place');
            // you can change the network if you want
            const connectWalletButton = (await page.$x('//*[contains(@class,"connect-btn")]'))[0];
            await tryClick(connectWalletButton, bringToFrontCallback.bind(page));
            const metamaskButton = (await page.$x('//button/img[contains(@alt,"MetaMask")]/..'))[0];
            await tryClick(metamaskButton);
            await metamask.approve()
            console.log('Connect approve sucess')


        }

        // go to a dapp and do something that prompts MetaMask to confirm a transaction
        await page.goto(ITEM_URL);

        const buyNowXpath = "//button/span[text()='Buy Now']"
        await waitUntilElementExist(page, buyNowXpath, bringToFrontCallback.bind(page))
        let buyNowButton = (await page.$x(buyNowXpath))[0];
        await tryClick(buyNowButton, page.bringToFront);


        const newBuyNowXpath = "//div[@class='ant-modal-body']/div/button" +
            "[not(contains(@class,'disabled-btn'))]/span[text()='Buy Now']"
        let newBuyNowButton = await page.$x(newBuyNowXpath)[0]
        //Check if we have BuyNowButton (Not disable), If not try to approve
        if (!newBuyNowButton) {
            const approveRacaButton = (await page.$x("//button/span[text()='Approve Raca']/.."))[0]
            await tryClick(approveRacaButton, bringToFrontCallback.bind(page))
            await metamask.confirmTransaction()
            console.log('Confirm successfully')

            //Check until approve Buy now Enable
            await waitUntilElementExist(page, newBuyNowXpath, bringToFrontCallback.bind(page))
            newBuyNowButton = (await page.$x(newBuyNowXpath))[0]

        }
        console.log('Try to click Buy Now')

        await tryClick(newBuyNowButton, bringToFrontCallback.bind(page))

        await sleep(4000);
        await browser.close()
        return true
    }


}


export {Bot};
