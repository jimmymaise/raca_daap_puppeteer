const asyncRedis = require("async-redis");
const client = asyncRedis.createClient({
    host: 'redis-17619.c296.ap-southeast-2-1.ec2.cloud.redislabs.com',
    port: 17619,
    password: '4ZS2iKS22o3GIpLuJya2DnmKHEatNanB'
});

client.on("error", function (err) {
    console.log("Error " + err);
});



export { client as redisClient };
