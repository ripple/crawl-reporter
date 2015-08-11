'use strict';
var rc_util = require('rippled-network-crawler/src/lib/utility.js');
var _ = require('lodash');
var writeToGraphite = require('./lib/report_graphite.js').writeToGraphite;
var moment = require('moment');
var Promise = require('bluebird');
var graphite = require('graphite');
var graphiteClient;

function reportCrawl(crawl, lastId) {
  writeToGraphite(crawl, graphiteClient);
  console.log('Wrote crawl %d (%s) to graphite at %s',
              crawl.id, moment(crawl.start_at).format(), moment().format());
  return Math.max(lastId, parseInt(crawl.id));
}

function recReport(timeout, lastId, dbUrl, logsql) {
  console.log('Looking for crawls with id >= %d', lastId + 1);
  rc_util
  .getRowsByIds(dbUrl, lastId + 1, Number.MAX_VALUE, logsql)
  .then(function(latestCrawls) {
    _.forEach(latestCrawls, function(crawl) {
      var lastId = reportCrawl(crawl, lastId);
    });
    setTimeout(function() {
      recReport(timeout, lastId, dbUrl, logsql);
    }, timeout);
  })
  .catch(function(err) {
    console.log(err);
    if (err.name === 'SequelizeDatabaseError') {
      process.exit(1);
    }
  });
}

module.exports = function(timeout, dbUrl, graphiteUrl, commander) {
  return new Promise(function(resolve, reject) {
    var logsql = false;
    graphiteClient = graphite.createClient(graphiteUrl);
    rc_util
    .getLatestRow(dbUrl, logsql)
    .then(function(latestCrawl) {
      if (!latestCrawl || !latestCrawl.id) {
        return reject(new Error('No crawls detected.'));
      }
      var lastId = reportCrawl(latestCrawl, -1);
      recReport(timeout, lastId, dbUrl, logsql);
    })
    .catch(reject);
  });
};
