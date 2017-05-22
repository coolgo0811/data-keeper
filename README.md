# data-keeper

data-keeper is a utility node-module for storing data in csv format.

## Installation

`npm install data-keeper`

## Example

```js
const DataKeeper = require('data-keeper');

let columns = ['t1', 't2', 't3', 'ts'];   // define columns
let dataKeeper = new DataKeeper(columns);

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

Write a data record to csv file.

```js
let data = { t1: 1, t3: 3, ts: new Date() };
dataKeeper.write(data);
```
-------------------------------------------------------

<a name="read"></a>
### #read([int])

Get a few of data records from stoage. The input is the count of data that you want. If no input, the default count is 100.

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