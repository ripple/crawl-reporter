'use strict';
var rc_util = require('rippled-network-crawler/src/lib/utility.js');
var _ = require('lodash');
var writeToGraphite = require('./lib/report_graphite.js').writeToGraphite;
var moment = require('moment');
var Promise = require('bluebird');
var graphite = require('graphite');
var graphiteClient;
var lastCrawlID;

function advanceLastCrawlID(batchSize, ids) {
  ids.start = lastCrawlID + 1;
  ids.end = lastCrawlID + batchSize;
  lastCrawlID = ids.end;
}

function reportCrawl(crawl) {
  writeToGraphite(crawl, graphiteClient);
  return parseInt(crawl.id, 10);
}

function recReport(ids, batchSize, dbUrl, logsql) {
  rc_util
  .getRowsByIds(dbUrl, ids.start, ids.end, logsql)
  .then(function(latestCrawls) {
    if (latestCrawls && latestCrawls.length) {
      console.log('received crawls [%d, %d]',
        ids.start, ids.start + latestCrawls.length - 1);
      ids.start += latestCrawls.length || 0;
      _.map(latestCrawls, reportCrawl);
    }
    if (ids.start > ids.end) {
      advanceLastCrawlID(batchSize, ids);
    }
    process.nextTick(function() {
      recReport(ids, batchSize, dbUrl, logsql);
    });
  })
  .catch(function(err) {
    console.log('Error: could not get crawls %d-%d', ids.start, ids.end);
    console.log(err);
    if (err.name === 'SequelizeDatabaseError') {
      process.exit(1);
    }
  });
}

module.exports = function(workersCount, batchSize, dbUrl, graphiteUrl) {
  return new Promise(function(resolve, reject) {
    var logsql = false;
    workersCount = parseInt(workersCount, 10);
    batchSize = parseInt(batchSize, 10);
    graphiteClient = graphite.createClient(graphiteUrl);
    rc_util
    .getLatestRow(dbUrl, logsql)
    .then(function(latestCrawl) {
      if (!latestCrawl || !latestCrawl.id) {
        return reject(new Error('No crawls detected.'));
      }
      lastCrawlID = reportCrawl(latestCrawl);
      for (var i = 0; i < workersCount; ++i) {
        var ids = {};
        advanceLastCrawlID(batchSize, ids);
        recReport(ids, batchSize, dbUrl, logsql);
      }
    })
    .catch(reject);
  });
};
