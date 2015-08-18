#!/usr/bin/env node
'use strict';

var commander = require('commander');
var src = require('./src/program');

commander
  .version(require('./package.json').version);

commander
  .command('live <max> <timeout> <queueUrl> <dbUrl> <graphiteUrl>')
  .description('Indefinitely report latest crawl metrics from db to graphite')
  .action(function(max, timeout, queueUrl, dbUrl, graphiteUrl) {
    src.live(max, timeout, queueUrl, dbUrl, graphiteUrl);
  });

commander
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  commander.outputHelp();
}
