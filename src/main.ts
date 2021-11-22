import * as puppeteer from 'puppeteer';
import * as dappeteer from '@chainsafe/dappeteer';

async function bringToFrontCallback() {
    let parentObject = this
    await parentObject.bringToFront()
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

async function main() {
    const browser = await dappeteer.launch(puppeteer, {
        metamaskVersion: 'v10.1.1',

    });
    const metamask = await dappeteer.setupMetamask(browser, {
        seed: "car assault orange moral hobby audit repair reduce tuition fuel duck defy"
    });

    await metamask.addNetwork({
        networkName: "Smart Chain",
        rpc: "https://bsc-dataseed.binance.org/",
        chainId: 56,
        symbol: "BNB",
        explorer: "https://bscscan.com"
    })
    // you can change the network if you want
    await metamask.switchNetwork('Smart Chain');

    // go to a dapp and do something that prompts MetaMask to confirm a transaction
    const page = await browser.newPage();
    await page.goto('https://market.radiocaca.com/#/market-place');
    const connectWalletButton = (await page.$x('//*[contains(@class,"connect-btn")]'))[0];
    await tryClick(connectWalletButton, bringToFrontCallback.bind(page));
    const metamaskButton = (await page.$x('//button/img[contains(@alt,"MetaMask")]/..'))[0];
    await tryClick(metamaskButton);
    await metamask.approve()
    await page.goto('https://market.radiocaca.com/#/market-place/5490');

    const buyNowXpath = "//button/span[text()='Buy Now']"
    while ((await page.$x(buyNowXpath)) [0] == undefined) {
        await page.waitForTimeout(1000);
        console.log('Change to page')
        await page.bringToFront()
    }
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

        await page.bringToFront()
        //Check until approve Raca loading button disappear
        await page.waitForXPath("//button[contains(@class,'ant-btn-loading')]/span[text()='Approve Raca']",
            {hidden: true});
        newBuyNowButton = await page.$x(newBuyNowXpath)[0]

    }
    console.log('Try to click Buy Now')

    await tryClick(newBuyNowButton, bringToFrontCallback.bind(page))


}

main();
