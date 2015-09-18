'use strict';
var reportGraphite = require('./lib/report_graphite');
var processCrawl = require('./lib/process_crawl');
var sqs_u = require('./lib/sqs_util');
var moment = require('moment');
var Promise = require('bluebird');
var graphite = require('graphite');
var HbaseClient = require('crawler-hbase').Client;

module.exports = function(max, queueUrl, dbUrl, graphiteUrl, log) {
  var graphiteClient = graphite.createClient(graphiteUrl);
  var hbaseClient = new HbaseClient(dbUrl);
  function processMessage() {
    sqs_u.getMessage(queueUrl)
    .then(function(response) {
      if (response.Messages) {
        var id = response.Messages[0].Body;
        console.log("received message: ", id);
        var receiptHandle = response.Messages[0].ReceiptHandle;
        hbaseClient
        .getRows('0', id, 2, true)  // get it along with the previous one
        .then(function(crawls) {
          if (!crawls) {
            throw new Error('No crawls with id %s', id)
          }
          var newProcessedCrawl = processCrawl(crawls[0], log);
          var oldProcessedCrawl = processCrawl(crawls[1], log);          
          return Promise.all([
            reportGraphite(newProcessedCrawl, graphiteClient), 
            hbaseClient.storeProcessedCrawl(newProcessedCrawl, oldProcessedCrawl)
            .then(function(crawlKey) {
              console.log("Stored processed crawl %s \t at %s", crawlKey, moment().format())
            })
            ]);
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
