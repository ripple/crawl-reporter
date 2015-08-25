#!/usr/bin/env node
'use strict';

var commander = require('commander');
var src = require('./src/program');

commander
  .version(require('./package.json').version)
  .option('-q, --quiet',
          'Won\'t log');

commander
  .command('live <max>')
  .description('Indefinitely report latest crawl metrics from db to graphite')
  .action(function(max) {
    var queueUrl = process.env.SQS_URL;
    var dbUrl = process.env.DATABASE_URL;
    var graphiteUrl = process.env.GRAPHITE_URL;
    var log = !commander.quiet;
    if (queueUrl && dbUrl && graphiteUrl) {
      src.live(max, queueUrl, dbUrl, graphiteUrl, log);
    } else {
      console.error("Missing environment variable.")
      commander.outputHelp();
    }
  });

commander
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  commander.outputHelp();
}
