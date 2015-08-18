#!/usr/bin/env node
'use strict';

var commander = require('commander');
var src = require('./src/program');

commander
  .version(require('./package.json').version);

commander
  .command('live <max> <timeout>')
  .description('Indefinitely report latest crawl metrics from db to graphite')
  .action(function(max, timeout) {
    var queueUrl = process.env.SQS_URL;
    var dbUrl = process.env.DATABASE_URL;
    var graphiteUrl = process.env.GRAPHITE_URL;
    if (queueUrl && dbUrl && graphiteUrl) {
      src.live(max, timeout, queueUrl, dbUrl, graphiteUrl);
    } else {
      console.error("Missing enviornment variable.")
      commander.outputHelp();
    }
  });

commander
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  commander.outputHelp();
}
