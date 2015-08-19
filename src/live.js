'use strict';
var rc_util = require('rippled-network-crawler/src/lib/utility.js');
var _ = require('lodash');
var reportGraphite = require('./lib/report_graphite');
var processCrawl = require('./lib/process_crawl');
var sqs_u = require('./lib/sqs_util');
var moment = require('moment');
var Promise = require('bluebird');
var graphite = require('graphite');

module.exports = function(max, timeout, queueUrl, dbUrl, graphiteUrl) {
  var graphiteClient = graphite.createClient(graphiteUrl);
  var logsql = false;
  var count = 0;

  function processMessage(workerID) {
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

          var crawlMetrics = processCrawl(crawl);
          // TODO write to db
          // TODO report to graphite

        })
        .then(function() {  // terminate on success
          sqs_u.deleteMessage(queueUrl, receiptHandle);
          count -= 1;
        })
        .catch(function(error) { // terminate on message processing error
          count -= 1;
          console.error(error);
        });
      } else { // terminate on message absence error
        count -= 1;
        console.error('No new messages \t at %s', moment().format());
      }
    });
  };

  var addWorker = function() {
    setTimeout(addWorker, timeout);
    if (count < max) {
      count += 1;
      processMessage(count);
    }
  }

  setTimeout(addWorker, timeout);
};
