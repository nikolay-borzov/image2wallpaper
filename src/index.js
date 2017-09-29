/* eslint-disable no-console */
'use strict';

// TODO: Add option to keep folder structure
// TODO: Exclude converted images? (take them from results.json)
// TOOD: Add app icon?

const configHelper = require('./config-helper');
const config = configHelper.getConfig();

const readline = require('readline');

// Better file system API 
const fs = require('fs-jetpack');

const path = require('path');

const ProgressBar = require('progress');
ProgressBar.prototype.reset = function(total) {
  this.total = total;
  this.curr = 0;
  this.complete = false;
};

// Logger
const pino = require('pino');
// Promisification  library
const Promise = require('bluebird');
// GraphicsMagick wrapper
const gm = require('gm');
Promise.promisifyAll(gm.prototype);

const EOL = require('os').EOL;
const PROMISE_CREATE_CONCURENCY = 30;

const helpers = {
  getAspectRatio: (width, height) => width / height,

  /**
   * Calculates aspect ratio deviation in percent
   */
  getDeviation: (width, height, baseAspectRatio) => {
    let aspectRatio = helpers.getAspectRatio(width, height);

    return Math.abs(Math.floor((aspectRatio * 100 / baseAspectRatio) - 100));
  },

  /**
   * Writes GraphicsMagick commands to a file
   */
  writeBatchConvertFile: (filePath, imagePaths) => {
    const scriptFileStream = fs.createWriteStream(filePath);
    scriptFileStream.on('error', (err) => log.error(err, 'Error writing batch script file'));

    imagePaths.forEach((imagePath) => {
      const commandText = gm()
        .command('convert')
        .resize(null, config.height)
        .out(`"${path.resolve(imagePath)}"`)
        .out(`"${path.join(destPath, path.basename(imagePath))}"`)
        .args()
        .slice(0, -1)
        .join(' ')
        .concat(EOL);

      scriptFileStream.write(commandText);
    });

    scriptFileStream.end();
  },

  /**
   * Converts images to wallpapers using GraphicsMagick batch command
   */
  executeBatchFile: (filePath) => {
    return new Promise((resolve) => {
      let command = gm()
        .command('batch')
        .in('-echo', 'on')
        .in(filePath);

      command._exec(command.args().slice(0, -1), resolve);
    });
  },

  exitApp: () => {
    const rl = readline.createInterface({
      input: process.stdin
    });

    rl.on('line', () => process.exit(0));

    console.log(EOL, 'Press Enter to exit');
    rl.prompt();
  }
};

const results = {
  errorIdentify: [],
  small: [],
  aspectRatio: [],
  deviation: [],
  converted: [],
  total: 0
};

const baseAspectRatio = helpers.getAspectRatio(config.width, config.height);

const destPath = config.destPath || path.join(config.srcPath, 'converted');

// Create log file
const dateString = (new Date()).toISOString().slice(0, 10);
const logFileName = `log.${dateString}.txt`;
const logFilePath = path.join(destPath, logFileName);
// TODO: lazy create log file
const log = pino({
  prettyPrint: true
}, fs.createWriteStream(logFilePath));

const resultsFileName = path.join(destPath, 'results.json');

console.log('Collecting images...');

const matching = ['+(*.gif|*.jpg|*.png|*.jpeg)'];
const relativeDestPath = path.relative(config.srcPath, destPath);

// Exclude directory with convert results if it's a subfolder of the source directory
if (!relativeDestPath.startsWith('..')) {
  matching.push(`!**${relativeDestPath}/*.*`);
}

// Add exclude patterns from config
if (config.exclude.length) {
  config.exclude.forEach((pattern) => matching.push(`!${pattern}`));
}

let imagePaths = fs.find(config.srcPath, {
  matching: matching
});

if (imagePaths.length) {
  fs.dir(destPath);
} else {
  console.log('No image(s) found');
  helpers.exitApp();
}

console.log(`${imagePaths.length} image(s) found`);

const bar = new ProgressBar('[:bar] :percent :current/:total :etas', {
  total: imagePaths.length,
  width: 50
});

const onConvertingDone = () => {
  // console.timeEnd('Converting');

  console.log(`
  Converted:           ${results.converted.length}
  
  Small:               ${results.small.length}
  Lesser aspect ratio: ${results.aspectRatio.length}
  Bigger deviation:    ${results.deviation.length}
  Error identify:      ${results.errorIdentify.length}`);

  fs.write(resultsFileName, results, { atomic: true });

  helpers.exitApp();
};

// console.time('Converting');

console.log(EOL, 'Filtering...');
Promise.map(imagePaths, imagePath => {
  return gm(imagePath)
    .sizeAsync()
    .then(size => {
      let img = {
        path: imagePath,
        width: size.width,
        height: size.height
      };

      // Small
      if (img.height < config.height) {
        results.small.push(img.path);
        return;
      }

      let aspectRatio = helpers.getAspectRatio(img.width, img.height);

      // Lesser aspect ratio
      if (aspectRatio < baseAspectRatio) {
        results.aspectRatio.push(img.path);
        return;
      }

      // Bigger deviation
      if (config.deviation === 0 && aspectRatio !== baseAspectRatio) {
        results.deviation.push(img.path);
        return;
      }

      let deviation = helpers.getDeviation(img.width, img.height, baseAspectRatio);

      // Bigger deviation
      if (deviation > config.deviation) {
        results.deviation.push(img.path);
        return;
      }

      return img.path;
    })
    .catch(err => {
      log.error(err, imagePath);
      results.errorIdentify.push(imagePath);
    })
    .finally(() => bar.tick());
}, { concurrency: PROMISE_CREATE_CONCURENCY }).then(filterResults => {
  const imagePaths = filterResults.filter(path => path);

  console.log(`${imagePaths.length} image(s) to convert`);

  // bar.reset(imagePaths.length);

  console.log(EOL, 'Converting...');
  results.converted = results.converted.concat(imagePaths);

  const batchFilePath = path.join(destPath, 'batch.gm');
  helpers.writeBatchConvertFile(batchFilePath, imagePaths);
  helpers.executeBatchFile(batchFilePath)
    .then(onConvertingDone);

  /*
  Promise.map(imagePaths, imagePath => {
    return gm(imagePath)
      .resize(null, config.height)
      .writeAsync(path.join(destPath, path.basename(imagePath)))
      .then(() => results.converted.push(imagePath))
      .catch((err) => {
        log.error(err, imagePath);
        results.errorConvert.push(imagePath);
      })
      .finally(() => bar.tick());
  }, { concurrency: PROMISE_CREATE_CONCURENCY }).then(onConvertingDone);*/
});
