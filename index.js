#!/usr/bin/env node
'use strict';

var commander = require('commander');
var src = require('./src/program');

commander
  .version(require('./package.json').version);

commander
  .command('live <workersCount> <batchSize> <dbUrl> <graphiteUrl>')
  .description('Indefinitely report latest crawl metrics from db to graphite')
  .action(function(workersCount, batchSize, dbUrl, graphiteUrl) {
    src
    .live(workersCount, batchSize, dbUrl, graphiteUrl)
    .catch(function(err) {
      console.log(err);
      process.exit(1);
    });
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
