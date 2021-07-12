const ioredis = require("ioredis");
const uuid = require("uuid");
const { config } = require("./config")

const COUNT = process.env.COUNT ? parseInt(process.env.COUNT) : 100000;
const initialCount = 1000;
const list = `1:test.com:transact`;
const processingList = `1:test.com:processing`;


// password
const REDIS_PASSWORD = process.env.REDIS_PASSWORD

if (REDIS_PASSWORD) {
    config.redisQueuesConf.password = REDIS_PASSWORD;
}
const redis = new ioredis(config.redisQueuesConf);


const rpoplpushlatency = [];
const lpushLatency = [];
const lremLatency = []
// start
Do().then(() => {
  process.exit(0);
});
async function Do() {
  try {
    await init();
    const res = await Promise.all([pushToQueue(), moveMessage()]);
    console.log(`RPOPLPUSH avg in ms:`, getAvg(rpoplpushlatency));
    console.log(`LPUSH avg in ms:`, getAvg(lpushLatency));
    console.log("Lrem latency in ms:", getAvg(lremLatency))
  } catch (error) {
    console.error(error);
  }
}

function getAvg(elmt) {
  let sum = 0;
  for (let i = 0; i < elmt.length; i++) {
    sum += parseInt(elmt[i], 10);
  }
  return sum / elmt.length;
}

async function init() {
  for (let i = 0; i < initialCount; i++) {
    await redis.lpush(list, uuid.v4());
  }
}
async function pushToQueue() {
  for (let i = 0; i < COUNT - initialCount; i++) {
    const start_time = process.hrtime();
    await redis.lpush(list, uuid.v4());
    const endTime = process.hrtime(start_time);
    const rl = (endTime[0] * 1000000000 + endTime[1]) / 1000000;
    lpushLatency.push(rl);
  }
}

async function moveMessage() {
  while (1) {
    const start_time = process.hrtime();
    const msg = await redis.rpoplpush(list, processingList);
    const endTime = process.hrtime(start_time);
    const rl = (endTime[0] * 1000000000 + endTime[1]) / 1000000;
    rpoplpushlatency.push(rl);
    if (!msg) {
      break;
    }
    processMessage(msg);
  }
}

function processMessage(msg) {
  setTimeout(async () => {
    const start_time = process.hrtime();
    await redis.lrem(processingList, 1, msg);
    const endTime = process.hrtime(start_time);
    const rl = (endTime[0] * 1000000000 + endTime[1]) / 1000000;
    lremLatency.push(rl);
  }, 200);
}
