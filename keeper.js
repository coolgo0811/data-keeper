'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');
const uuidV1 = require('uuid/v1');

const constant = require('./const.js');

function _writeFile (dataObj) {
  let record = [];
  for (let i = 0; i < this._columns.length; i++) {
    let value = dataObj[this._columns[i]];
    value = (typeof value !== 'undefined') ? dataObj[this._columns[i]] : constant.defaultNullValue;
    if (value instanceof Date) {
      value = value.toISOString();
    }
    record.push(value);
  }

  if (this._currentFilePath === null) {
    let fileName = util.format(constant.fileNameFormat, uuidV1());
    this._currentFilePath = path.join(this._storagePath, fileName);
    this._fileList.push(this._currentFilePath);
  }

  // let fd = fs.openSync(this._currentFilePath, 'w+');
  fs.appendFileSync(this._currentFilePath, record.join(',') + '\n');
  // fs.closeSync(this._currentFilePath);
  this._currentRecordCount++;

  if (this._currentRecordCount === constant.writeRecordCount) {
    this._currentRecordCount = 0;
    this._currentFilePath = null;
  }
}

class Keeper {
  constructor (columns) {
    this._columns = columns;
    this._storagePath = null;

    // for write
    this._currentRecordCount = 0;
    this._currentFilePath = null;

    // for read
    this._fileList = [];
    this._records = [];

    this._isOnRead = false;
  }

  init (basePath) {
    try {
      this._storagePath = basePath || path.join(__dirname, 'recover');

      // if dir not exists, generate it.
      if (!fs.existsSync(this._storagePath)) {
        fs.mkdirSync(this._storagePath);
      }

      // load all files in storage
      let fileList = fs.readdirSync(this._storagePath);
      for (let i = 0; i < fileList.length; i++) {
        let filePath = path.join(this._storagePath, fileList[i]);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
          this._fileList.push(filePath);
        }
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  write (dataObj) {
    try {
      if (this._isOnRead) {
        throw new Error('Now in reading. Do not allow to write data !');
      }
      if (!dataObj || typeof dataObj !== 'object' || Object.keys(dataObj).length === 0) {
        throw new Error('Input data is null !');
      }

      _writeFile.call(this, dataObj);

      return true;
    } catch (err) {
      console.error(err.message);
      return false;
    }
  }

  dataAvailable () {
    return (this._fileList.length !== 0 || this._records.length !== 0);
  }

  read (count) {
    this._isOnRead = true;
    let readCount = count || constant.readRecordCount;
    let output = [];
    try {
      if (this._fileList.length === 0 && this._records.length === 0) {
        return output;
      }

      while (output.length < readCount) {
        if (this._records.length >= readCount) {
          output = this._records.slice(0, readCount);
        } else {
          if (this._fileList.length === 0) {
            if (this._records.length > 0) {
              output = output.concat(this._records.slice(0, this._records.length));
            }
            break;
          }
          let filePath = this._fileList[0];
          if (fs.existsSync(filePath)) {
            let contents = fs.readFileSync(filePath, { encoding: 'utf8' });
            let records = contents.trim().split('\n');
            for (let i = 0; i < records.length; i++) {
              let record = records[i].split(',');
              let data = {};
              for (let j = 0; j < this._columns.length; j++) {
                if (record[j] !== constant.defaultNullValue) {
                  data[this._columns[j]] = record[j];
                }
              }
              this._records.push(data);
            }

            fs.unlinkSync(filePath);
          }
          this._fileList.splice(0, 1);
        }
      }
    } catch (err) {
      console.error(err.message);
    }

    this._isOnRead = false;
    return output;
  }
}

module.exports = Keeper;
