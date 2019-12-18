const redis = require('redis');
const url = require('url');
const redisURL = url.parse(process.env.REDISCLOUD_URL);
const redisClient = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
const moment = require('moment');

const MAX_REQ = 1000;

redisClient.on('connect', () => {
    console.log("redis connected");   
});
redisClient.on('error', () => {
    console.log("redis NOT connected");   
});

module.exports = (req,res,next) => {
    redisClient.exists(req.headers.user || "Nana", (err, response) => {
        if(err){
            console.log("Redis is out........");
            system.exit(0);
        }
        if(response === 1){
            redisClient.get(req.headers.user, (err, response) => {
                let data = JSON.parse(response);
                let currentTime = moment().unix();
                let diff = (currentTime - data.startTime)/60;

                if(diff >= 1){
                    if(data.count > MAX_REQ){
                        return res.json({ "error": 1, "message": "API limit exceeded" });
                    }
                    data.count++;
                    redisClient.set(req.headers.user, JSON.stringify(data));
                    next();
                }
            });
        } else {
            let body = {
                "count" : 1,
                "startTime" : moment().unix()
            }
            redisClient.set(req.headers.user, JSON.stringify(body));
            next()
        }
    });
};