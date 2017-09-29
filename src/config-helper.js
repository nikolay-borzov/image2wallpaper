'use strict';

// TODO: Fix passing config through --config param

// Better file system API 
const fs = require('fs-jetpack');
// Command line argumets parser
const yargs = require('yargs');
const path = require('path');

const CONFIG_FILENAME = '.image2wallpaperrc.json';

exports.getConfig = () => {
  let argv = yargs
    .demandCommand(1, 'Source path is required')
    .argv;

  const srcPath = argv._[0];
  const configPath = path.join(srcPath, CONFIG_FILENAME);

  let config = 'config';
  if (fs.exists(configPath) === 'file') {
    config = {
      extends: configPath
    };
  }

  argv = yargs
    .config(config)
    .option('destPath', {
      describe: 'Destination folder',
      type: 'string'
    })
    .option('exclude', {
      describe: 'Glob patterns of files/directories to exclude. \'!\' is prepended',
      type: 'array'
    })
    .option('width', {
      alias: 'w',
      demandOption: true,
      describe: 'Wallaper width',
      type: 'number'
    })
    .option('height', {
      alias: 'h',
      demandOption: true,
      describe: 'Wallaper height',
      type: 'number'
    })
    .option('deviation', {
      alias: 'd',
      default: 0,
      describe: 'Wallaper width deviation in %. For scrollable wallpapers',
      type: 'number'
    })
    .argv;

  argv.srcPath = srcPath;

  return argv;
};
