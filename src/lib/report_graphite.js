var moment = require('moment');
var graphiteClient = graphite.createClient(graphiteUrl);

// Currently doesn't work. Structure will be different, so it needs to be
//  rewritten anyways

module.exports = function(metrics, graphiteClient) {
  // note: crawl not defined
  graphiteClient.write(metrics, moment(crawl.start_at).valueOf(), function(error) {
    if (error) {
      throw new Error(error);
    } else {
      console.log('Wrote crawl %d \t at %s \t to graphite',
        crawl.id, moment().format());
    }
  });
};
