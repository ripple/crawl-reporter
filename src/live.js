'use strict';
var rc_util = require('rippled-network-crawler/src/lib/utility.js');
var _ = require('lodash');
var writeToGraphite = require('./lib/report_graphite');
var sqs_u = require('./lib/sqs_util');
var moment = require('moment');
var Promise = require('bluebird');
var graphite = require('graphite');

module.exports = function(max, timeout, queueUrl, dbUrl, graphiteUrl) {
  var graphiteClient = graphite.createClient(graphiteUrl);
  var logsql = false;
  var count = 0;

  function processCrawl(crawl) {
    writeToGraphite(crawl, graphiteClient)
  }

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
            console.error('No crawls with id %s', id);
            count -= 1;
            return -1;
          }

          processCrawl(crawl);
          count -= 1;

        }).then(function() {
          sqs_u.deleteMessage(queueUrl, receiptHandle).then(function() {
            return 0;
          });
        })
        .catch(console.error);

      } else {
        console.error('No new messages \t at %s', moment().format());
        count -= 1;
        return -1;
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
