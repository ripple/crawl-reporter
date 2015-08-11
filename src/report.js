'use strict';
var rc_util = require('rippled-network-crawler/src/lib/utility.js');
var Promise = require('bluebird');
var graphite = require('graphite');
var writeToGraphite = require('./lib/report_graphite.js').writeToGraphite;
var _ = require('lodash');
var graphiteClient;

function iterReport(startId, endId, dbUrl, logsql) {
  return new Promise(function(resolve, reject) {
    rc_util.getRowsByIds(dbUrl, startId, endId, logsql).then(function(rows) {
      _.each(rows, function(crawl) {
        writeToGraphite(crawl, graphiteClient);
        console.log('wrote crawl', crawl.id, 'to graphite');
      });
    });
    return resolve();
  });
}

module.exports = function(startId, endId, dbUrl, graphiteUrl, commander) {
  return new Promise(function(resolve, reject) {
    var logsql = false;
    graphiteClient = graphite.createClient(graphiteUrl);
    iterReport(startId, endId, dbUrl, logsql);
  });
};
