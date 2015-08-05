#!/usr/bin/env node
'use strict';

var commander = require('commander');
var src = require('./src/program');

commander
  .version(require('./package.json').version);

commander
  .command('report <dbUrl> <graphiteUrl>')
  .description('Indefinitely report latest crawl metrics from db to graphite')
  .action(function(dbUrl, graphiteUrl) {
    src.report(dbUrl, graphiteUrl);
  });

commander
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  commander.outputHelp();
}
