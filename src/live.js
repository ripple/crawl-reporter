'use strict';
var rc_util = require('rippled-network-crawler/src/lib/utility.js');
var _ = require('lodash');
var writeToGraphite = require('./lib/report_graphite.js').writeToGraphite;
var Promise = require('bluebird');
var graphite = require('graphite');
var graphiteClient;

function recReport(timeout, lastId, dbUrl, logsql) {
  console.log('trying to fetch >=', lastId + 1);
  rc_util
  .getRowsByIds(dbUrl, lastId + 1, Number.MAX_VALUE, logsql)
  .then(function(latestCrawls) {
    _.forEach(latestCrawls, function(crawl) {
      writeToGraphite(crawl, graphiteClient);
      lastId = Math.max(lastId, parseInt(crawl.id));
      console.log('wrote crawl', crawl.id, 'to graphite');
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
        return reject(new Error('no crawls detected.'));
      }
      writeToGraphite(latestCrawl, graphiteClient);
      console.log('wrote crawl', latestCrawl.id, 'to graphite');
      var lastId = parseInt(latestCrawl.id);
      recReport(timeout, lastId, dbUrl, logsql);
    })
    .catch(reject);
  });
};
