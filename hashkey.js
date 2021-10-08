const ioredis = require("ioredis");
const fs = require("fs");
const { ISPs } = require("./isp");
const redis_body_cluster = [{ host: "localhost", port: 7000 }];
const connection = new ioredis.Cluster(redis_body_cluster, {});

const ws = fs.createWriteStream('./distribution.txt')
ws.write('[' + '\n')
const BATCH_SIZE = 10000;
const allDomains = fs
  .readFileSync("domains.txt")
  .toString()
  .split("\n")
  .map((i) => i.trim());

// console.log(allDomains);

function createListNames() {
  const keys = [];
  for (const d of allDomains) {
    for (const isp of ISPs) {
      const tkey = `{${isp}:${d}}:transact`;
      keys.push(tkey);
    }
  }
  return keys;
}

// @returns number
async function getHashSlot(key) {
  try {
    const r = await connection.cluster("keyslot", key);
    return r;
  } catch (error) {
    console.error(error);
    return null;
  }
}

const HMap = {};
initHMap()
function initHMap() {
    for(let i = 0 ; i< 16384 ; i++) {
        HMap[i] = 0
    }
}

let c = 0;

function mapToHash(results) {
  for (const r of results) {
    if (r) {
      // @ts-ignore
      HMap[r] ? (HMap[r] += 1) : (HMap[r] = 1);
    }
  }
}
async function run() {
  const allKeys = createListNames();


  const tasks = [];
  for (let i = 0; i < allKeys.length; i++) {
    //   console.log('key is: ', allKeys[i])
    tasks.push(getHashSlot(allKeys[i]));

    if (tasks.length >= BATCH_SIZE || i == allKeys.length - 1) {
      const results = await Promise.all(tasks);
      mapToHash(results);
      c += results.length;
      console.log("count", c);

      tasks.length = 0
    }
  }



  Object.keys(HMap).forEach(key => {
    ws.write(HMap[key]+ ',' + '\n')
  })
  

  ws.write(']' + '\n')
}
run();
