var rc_util = require('rippled-network-crawler/src/lib/utility.js');
var _ = require('lodash');
var moment = require('moment');

module.exports = {
  writeToGraphite: function(crawl, graphiteClient) {
    var metrics = {
      crawler: {
        ippCount: rc_util.getIpps(crawl.data).length,
        publicKeyCount: Object.keys(rc_util.getRippleds(crawl.data)).length,
        connectionsCount: Object.keys(rc_util.getLinks(crawl.data)).length,
        rippleds: {}
      }
    };
    var rippleds = rc_util.getRippledsC(crawl.data);
    _.each(Object.keys(rippleds), function (rippled) {
      metrics.crawler.rippleds[rippled] = {
        connectionsCount: rippleds[rippled].in + rippleds[rippled].out,
        up: 1
      };
    });
    graphiteClient.write(metrics, moment(crawl.start_at).valueOf(), function(err) {
      if (err) {
        console.error(err);
      }
    });
  }
};
