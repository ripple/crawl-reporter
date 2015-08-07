#!/usr/bin/env node
'use strict';

var commander = require('commander');
var src = require('./src/program');

commander
  .version(require('./package.json').version);

commander
  .command('live <timeout> <dbUrl> <graphiteUrl>')
  .description('Indefinitely report latest crawl metrics from db to graphite')
  .action(function(timeout, dbUrl, graphiteUrl) {
    timeout = parseInt(timeout, 10);
    src.live(timeout, dbUrl, graphiteUrl);
  });

commander
  .command('report <startId> <endId> <dbUrl> <graphiteUrl>')
  .description('Report crawl metrics from db to graphite')
  .action(function(startId, endId, dbUrl, graphiteUrl) {
    src.report(startId, endId, dbUrl, graphiteUrl);
  });

commander
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  commander.outputHelp();
}
