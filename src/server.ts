const express = require('express');
const app = express();
import {redisClient} from "./redis";
import {Bot} from "./bot";
import {withTimeout} from './utils'

const bodyParser = require('body-parser');

const DEFAULT_BOT_TIMEOUT_MS = 30000
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

app.post('/raca/buy/:itemId', async (req, res, next) => {
    const itemUrl = `https://market.radiocaca.com/#/market-place/${req.params.itemId}`;
    const profilePath = req.body.profilePath;
    const password = req.body.password;
    const botTimeOut = req.body.botTimeOut || DEFAULT_BOT_TIMEOUT_MS;
    let bot: Bot
    const seed = req.body.seed;
    let isRunning = await redisClient.get(profilePath)
    if (isRunning) {
        return res.status(422).send({
            'success': false,
            'reason': 'bot with this profile is running'
        });
    }
    try {
        await redisClient.setex(profilePath, 240, true)
        bot = new Bot(itemUrl, profilePath, password, seed)
        await bot.build()

        await withTimeout(botTimeOut, bot.executeBot());

    } catch (error) {
        if (bot.browser) {
            await bot.browser.close()
            console.log('Force close browser ')

        }
        console.log(`Error: ${error}`)
        return await res.status(422).send({
            'success': false,
            'reason': error.message,
            'last_step': bot.executeLastStep
        });

    } finally {
        await redisClient.set('profilePath', false)

    }
    return res.send({
        'success': true,
        'last_step': bot.executeLastStep
    });

});


app.listen(3000, () => console.log('Example app is listening on port 3000.'));
