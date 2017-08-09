'use strict';
const path = require('path');
const util = require('util');
const Keeper = require('./keeper.js');

let basePath = path.join(__dirname, '/resume');

let logs = [
  { t1: 1, t3: 3, ts: new Date() },
  { t2: 3, ts: new Date() },
  { t1: 3, t2: 4, ts: new Date() },
  { t1: 4, t2: 5, t3: 6, ts: new Date() }
];

let keeper = new Keeper();

keeper.init(basePath);

while (true) {
  if (keeper.dataAvailable()) {  // check any records exist or not
    let records = keeper.read(1);  // get 1 records back
    for (let i = 0; i < records.length; i++) {
      let record = records[i];
      for (var key in record) {
        console.log(util.format('[%s] = %s', key, record[key].toString()));
      }
    }
  } else {
    for (let i = 0; i < logs.length; i++) {
      keeper.write(logs[i]);  // write a data record
    }
  }
}
