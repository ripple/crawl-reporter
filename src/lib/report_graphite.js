var moment = require('moment');
var _ = require('lodash');

module.exports = function(crawlMetrics, graphiteClient) {

  var metrics = {
    crawlerTest: {
        publicKeyCount: Object.keys(crawlMetrics.rippleds).length,
        connectionsCount: Object.keys(crawlMetrics.connections).length,
        rippleds: {}
    }
  };
  _.each(Object.keys(crawlMetrics.rippleds), function (rippled) {
    metrics.crawlerTest.rippleds[rippled] = {
      connectionsCount: crawlMetrics.rippleds[rippled].in + crawlMetrics.rippleds[rippled].out,
      uptime: crawlMetrics.rippleds[rippled].uptime,
      up: 1
    };
  });
  graphiteClient.write(metrics, moment(crawlMetrics.crawl.start).valueOf(), function(error) {
    if (error) {
      throw new Error(error);
    } else {
      console.log('Reported  crawl %s \t at %s \t to graphite',
        crawlMetrics.crawl.id, moment().format());
    }
  });
};
