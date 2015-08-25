'use strict';
var rc_util = require('rippled-network-crawler/src/lib/utility.js');
var reportGraphite = require('./lib/report_graphite');
var processCrawl = require('./lib/process_crawl');
var sqs_u = require('./lib/sqs_util');
var moment = require('moment');
var Promise = require('bluebird');
var graphite = require('graphite');

module.exports = function(max, queueUrl, dbUrl, graphiteUrl, log) {
  var graphiteClient = graphite.createClient(graphiteUrl);
  var logsql = false;

  function processMessage() {
    sqs_u.getMessage(queueUrl)
    .then(function(response) {
      if (response.Messages) {
        var id = response.Messages[0].Body;
        var receiptHandle = response.Messages[0].ReceiptHandle;
        rc_util
        .getRowById(dbUrl, id, logsql)
        .then(function(crawl) {
          if (!crawl) {
            throw new Error('No crawls with id %s', id)
          }

          var crawlMetrics = processCrawl(crawl, log);
          reportGraphite(crawlMetrics, graphiteClient);
          // TODO write to db

        })
        .then(function() {  // terminate on success
          sqs_u.deleteMessage(queueUrl, receiptHandle);
          process.nextTick(processMessage);
        })
        .catch(function(error) { // terminate on message processing error
          console.error(error);
          process.exit(1);
        });
      } else { // terminate on message absence error
        console.error('No new messages \t at %s', moment().format());
        process.nextTick(processMessage);
      }
    });
  };

  for(var i = 0; i < max; i++) {
    console.log("Spawned subworker", i);
    processMessage();
  }
};
