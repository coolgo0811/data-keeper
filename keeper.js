'use strict';

const fs = require('fs');
const zlib = require('zlib');
const util = require('util');
const path = require('path');
const uuidV1 = require('uuid/v1');

const constant = require('./const.js');

function _writeFile (dataObj) {
  let buff = Buffer.from(JSON.stringify(dataObj));
  var zipBuff = zlib.gzipSync(buff);

  if (this._currentFilePath === null) {
    let fileName = util.format(constant.fileNameFormat, uuidV1());
    this._currentFilePath = path.join(this._storagePath, fileName);
    this._fileList.push(this._currentFilePath);
  }

  zipBuff = Buffer.concat([zipBuff, Buffer.from('\n')]);
  // let fd = fs.openSync(this._currentFilePath, 'w+');
  fs.appendFileSync(this._currentFilePath, zipBuff, 0, zipBuff.length);
  // fs.closeSync(this._currentFilePath);
  this._currentRecordCount++;

  if (this._currentRecordCount === constant.writeRecordCount) {
    this._currentRecordCount = 0;
    this._currentFilePath = null;
  }
}

function _splitBuffer (buf, delimiter) {
  let arr = [];
  let pos = 0;

  for (var i = 0, l = buf.length; i < l; i++) {
    if (buf[i] !== delimiter) continue;
    if (i === 0) {
      pos = 1;
      continue; // skip if it's at the start of buffer
    }
    arr.push(buf.slice(pos, i));
    pos = i + 1;
  }

  // add final part
  if (pos < l) {
    arr.push(buf.slice(pos, l));
  }

  return arr;
}

class Keeper {
  constructor () {
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
          output = this._records.splice(0, readCount);
        } else {
          if (this._fileList.length === 0) {
            if (this._records.length > 0) {
              output = output.concat(this._records.splice(0, this._records.length));
            }
            break;
          }
          let filePath = this._fileList[0];
          if (fs.existsSync(filePath)) {
            let buff = fs.readFileSync(filePath);
            let records = _splitBuffer(buff, Buffer.from('\n')[0]);
            for (let i = 0; i < records.length; i++) {
              let record = zlib.unzipSync(records[i]);
              this._records.push(JSON.parse(record));
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
