const ioredis = require("ioredis");
const uuid = require("uuid");
const { config } = require("./config");

const COUNT = process.env.COUNT ? parseInt(process.env.COUNT) : 100000;

const LIST_COUNT = process.env.LIST_COUNT
  ? parseInt(process.env.LIST_COUNT)
  : 1;
const initialCount = 1000;

const Lists = [];
// password
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

if (REDIS_PASSWORD) {
  config.redisQueuesConf.password = REDIS_PASSWORD;
}
const redis = new ioredis();

const rpoplpushlatency = [];
const lpushLatency = [];
const lremLatency = [];
// start
Do().then(() => {
  process.exit(0);
});

function generateListNames() {
  for (let i = 0; i < LIST_COUNT; i++) {
    const isp = Math.floor(Math.random() * (100 - 1) + 1);
    const domain = uuid.v4().substring(0, 8);
    const listName = `${isp}:${domain}:transact`;
    Lists.push(listName);
  }
}
async function Do() {
  try {
    generateListNames();
    await init();
    const res = await Promise.all([pushData(), popData()]);
    console.log(`RPOPLPUSH avg in ms:`, getAvg(rpoplpushlatency));
    console.log(`LPUSH avg in ms:`, getAvg(lpushLatency));
    console.log("Lrem latency in ms:", getAvg(lremLatency));
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
  for (const list of Lists) {
    for (let i = 0; i < initialCount; i++) {
      await redis.lpush(list, uuid.v4());
    }
  }
}

async function pushData() {
  await Promise.all(Lists.map((list) => pushToQueue(list)));
}
async function pushToQueue(list) {
  for (let i = 0; i < COUNT - initialCount; i++) {
    const start_time = process.hrtime();
    await redis.lpush(list, uuid.v4());
    const endTime = process.hrtime(start_time);
    const rl = (endTime[0] * 1000000000 + endTime[1]) / 1000000;
    lpushLatency.push(rl);
  }
}
async function popData() {
  await Promise.all(Lists.map((list) => moveMessage(list)));
}
async function moveMessage(list) {
  const processingList = list.replace("transact", "processing");
  while (1) {
    const start_time = process.hrtime();
    const msg = await redis.rpoplpush(list, processingList);
    const endTime = process.hrtime(start_time);
    const rl = (endTime[0] * 1000000000 + endTime[1]) / 1000000;
    rpoplpushlatency.push(rl);
    if (!msg) {
      break;
    }
    processMessage(msg, processingList);
  }
}

async function processMessage(msg, processingList) {
    const start_time = process.hrtime();
    await redis.lrem(processingList, 1, msg);
    const endTime = process.hrtime(start_time);
    const rl = (endTime[0] * 1000000000 + endTime[1]) / 1000000;
    lremLatency.push(rl);
}
