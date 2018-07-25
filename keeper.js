'use strict';

const fs = require('fs');
const zlib = require('zlib');
const util = require('util');
const path = require('path');
const uuidV4 = require('uuid/v4');
const bsplit = require('buffer-split');

const constant = require('./const.js');

function _writeFile (dataObj) {
  let buff = Buffer.from(JSON.stringify(dataObj));
  var zipBuff = zlib.gzipSync(buff, {level: 1});

  if (this._currentFilePath === null) {
    let fileName = util.format(constant.fileNameFormat, uuidV4());
    this._currentFilePath = path.join(this._storagePath, fileName);
    this._fileList.push(this._currentFilePath);
  }

  zipBuff = Buffer.concat([zipBuff, Buffer.from('EOF')]);
  // let fd = fs.openSync(this._currentFilePath, 'w+');
  fs.appendFileSync(this._currentFilePath, zipBuff, 0, zipBuff.length);
  // fs.closeSync(this._currentFilePath);
  this._currentRecordCount++;

  if (this._currentRecordCount === this.writeRecordCount) {
    this._currentRecordCount = 0;
    this._currentFilePath = null;
  }
}

function _splitBuffer (buf, delimiter) {
  let arr = [];
  let pos = 0;

  for (var i = 0, l = buf.length; i < l; i++) {
    for (var j = 0; i < delimiter.length; j++) {
    }
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
  constructor (options) {
    this._storagePath = null;
    this.writeRecordCount = (options && options.fileRecordCount) ? options.fileRecordCount : constant.writeRecordCount;

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
          // let filePath = this._fileList[0];
          if (this._currentFilePath === null) {
            this._currentFilePath = this._fileList[0];
          }
          if (fs.existsSync(this._currentFilePath)) {
            let buff = fs.readFileSync(this._currentFilePath);
            let records = bsplit(buff, Buffer.from('EOF'));
            for (let i = 0; i < records.length; i++) {
              if (records[i].length === 0) continue;
              let record = zlib.unzipSync(records[i]);
              this._records.push(JSON.parse(record));
            }

            fs.unlinkSync(this._currentFilePath);
          }
          let idx = this._fileList.indexOf(this._currentFilePath);
          if (idx >= 0) {
            this._fileList.splice(idx, 1);
          }
          this._currentFilePath = null;
          this._currentRecordCount = 0;
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
