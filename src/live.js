'use strict';
var rc_util = require('rippled-network-crawler/src/lib/utility.js');
var writeToGraphite = require('./lib/report_graphite.js').writeToGraphite;
var Promise = require('bluebird');
var graphite = require('graphite');
var graphiteClient;

function recReport(timeout, lastId, dbUrl, logsql) {
  rc_util.getLatestCrawl(dbUrl, logsql).then(function(latestCrawl) {
    if (lastId < latestCrawl.id) {
      writeToGraphite(latestCrawl, graphiteClient);
      lastId = latestCrawl.id;
      console.log('wrote crawl', lastId, 'to graphite');
    } else {
      console.log('no new crawls');
    }
    setTimeout(function() {
      recReport(timeout, lastId, dbUrl, logsql)
    }, timeout);
  });
}

module.exports = function(timeout, dbUrl, graphiteUrl, commander) {
  return new Promise(function(resolve, reject) {
    var logsql = false;
    graphiteClient = graphite.createClient(graphiteUrl);
    recReport(timeout, -1, dbUrl, logsql);
  });
};
