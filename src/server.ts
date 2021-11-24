const express = require('express');
const app = express();
import {redisClient} from "./redis";
import {Bot} from "./bot";
import {withTimeout} from './utils'

const bodyParser = require('body-parser');

const DEFAULT_BOT_TIMEOUT_MS = 30000
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

app.delete('/redis', async (req, res, next) => {

    await redisClient.flushall()
    return await res.status(200).send({
        'success': 'Delete all redis key'
    });
})

app.delete('/raca/profilePathKey', async (req, res, next) => {
    const profilePath: string = req.body.profilePath;
    try {
        await redisClient.del(profilePath)
        console.log(`Delete key ${profilePath} successfully`)
        return await res.status(200).send({
            'success': true,
            'message': `Delete key ${profilePath} successfully`
        });
    } catch (e) {
        console.error(`Delete key ${profilePath} unsuccessfully`)
        console.error(e)
        return await res.status(422).send({
            'success': false,
            'message': `Delete key ${profilePath} unsuccessfully`,
            'error': e.message
        });
    }


})


app.post('/raca/buy/:itemId', async (req, res, next) => {
    const itemUrl = `https://market.radiocaca.com/#/market-place/${req.params.itemId}`;
    const profilePath: string = req.body.profilePath;
    const password = req.body.password;
    const byPassIsRunningCheck = req.body.byPassIsRunningCheck;
    const botTimeOut = req.body.botTimeOut || DEFAULT_BOT_TIMEOUT_MS;
    let bot: Bot
    const seed = req.body.seed;
    let isRunning = byPassIsRunningCheck || await redisClient.get(profilePath)
    if (isRunning == 'true') {
        return res.status(422).send({
            'success': false,
            'reason': 'bot with this profile is running'
        });
    }
    try {
        bot = new Bot(itemUrl, profilePath, password, seed)
        await bot.build()
        await redisClient.setex(profilePath, botTimeOut / 1000, "true")
        await withTimeout(botTimeOut, bot.executeBot());

    } catch (error) {
        if (bot.browser) {
            await bot.browser.close()
            console.log('Force close browser ')

        }
        console.error(`Error: ${error}`, error.stack)
        return await res.status(422).send({
            'success': false,
            'reason': error.message,
            'executed_steps': bot.executedSteps,
            'last_step': bot.executedSteps[bot.executedSteps.length - 1]
        });

    } finally {
        await redisClient.del(profilePath)
        console.log(`Delete key ${profilePath} successfully`)

    }
    return res.status(201).send({
        'success': true,
        'executed_steps': bot.executedSteps,
        'last_step': bot.executedSteps[bot.executedSteps.length - 1]
    });

});


app.listen(3000, () => console.log('Example app is listening on port 3000.'));
