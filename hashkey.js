 // @ts-check
const ioredis = require("ioredis");

const redis_body_cluster =  [{ "host": "localhost", "port": 7000 }]
const connection = new ioredis.Cluster(redis_body_cluster, {} )

async function run() {
    try {
        const r = await connection.cluster('keyslot', 'abc')
        console.log('r', r)
    } catch (error) {
        console.error(error)
    }

}

run()