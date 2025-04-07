import {createClient} from "redis";

const redis = await createClient({url: process.env.REDIS2_REDIS_URL!})
    .on('error', err => console.log('Redis Client Error', err))
    .connect();

export default redis;