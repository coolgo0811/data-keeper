# data-keeper

data-keeper is a utility node-module for keep temporary data (json object) in files. The data will be compressed for disk space saving.

## Installation

`npm install data-keeper`

## Example

```js
const DataKeeper = require('data-keeper');
let dataKeeper = new DataKeeper();

```

## API

* <a href="#init"><code>init(string)</b></code></a>
* <a href="#write"><code>write(object)</b></code></a>
* <a href="#read"><code>read([int])</b></code></a>
* <a href="#dataAvailable"><code>dataAvailable()</b></code></a>
-------------------------------------------------------

<a name="init"></a>
### #init(string)

Set the file path of the storage. 

```js
let basePath = path.join(__dirname, '/resume');
dataKeeper.init(basePath);
```
-------------------------------------------------------

<a name="write"></a>
### #write()

Write a data record to file.

```js
let data = { t1: 1, t3: 3, ts: new Date() };
dataKeeper.write(data);
```
-------------------------------------------------------

<a name="read"></a>
### #read([int])

Get a few of data records from files. The input is the count of data that you want. If no input, the default count is 100.

```js
let records = keeper.read(100);
```
-------------------------------------------------------

<a name="dataAvailable"></a>
### #dataAvailable()

Check if any data records exist or not.

For example:

```js
while (keeper.dataAvailable()) {  // check any records exist or not
  let records = keeper.read(100);  // get 100 records back
}
```
-------------------------------------------------------