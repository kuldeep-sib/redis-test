const { MongoClient } = require("mongodb");
const fs = require("fs");

const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

const ws = fs.createWriteStream("domains.txt");

function extractDomain(findResult) {
  for (const doc of findResult) {
    if (doc.smtp_name) {
      const d = doc.smtp_name;
      ws.write(d + "\n");
    }
  }
}
async function main() {
  // Use connect method to connect to the server
  await client.connect();
  console.log("Connected successfully to server");
  const db = client.db("queue");
  const collection = db.collection("domain_details_rabbit");

  // the following code examples can be pasted here...
  const findResult = await collection.find({}).toArray();

  console.log('total:', findResult.length)
  extractDomain(findResult);

  return "done.";
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => {
    setTimeout(() => {
      client.close();
    }, 60000);
  });
