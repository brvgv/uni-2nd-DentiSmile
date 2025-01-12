import redis from 'redis'

const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || 'redis_appointment',
        port: process.env.REDIS_PORT || '6379'
    }
});

redisClient.on('connect', () => {
    console.log('Connected to redis');
})

redisClient.on('error', (err) => {
    console.log('Error when connecting to redis', err);
})

export default redisClient;


