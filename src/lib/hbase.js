var Hbase = require('hbase');
var _ = require('lodash');

var hbaseClient = Hbase({
  host: process.env.hbaseHost,
  port: process.env.hbasePort
})

function writeNode(node) {

}

function writeConnection(crawl, fromNode, toNode){

}

function writeNodeStats(crawl, node) {

}

module.exports = {
  getRawCrawl: function(id) {
    return new Promise(function(resolve, reject) {
      hbaseClient.getRow('raw_crawls', id, function(err, data) {
        if (err) {
          return reject(error)
        }
        return resolve(data['rc:data'])
      })
    });
  },

  writeProcessedCrawl: function(processedCrawl) {
    return new Promise(function(resolve, reject) {
      _.forEach(processedCrawl.rippleds, function(rippled, public_key) {
        writeNode()
      });

      _.forEach(processedCrawl.connections, function (n, connection) {
        writeConnection(crawl, connection[0], connection[1])
      });

      var key = moment().valueOf() + '_' + moment(crawl.end).valueOf();
      console.log(key);
      hbase
      .table('raw_crawls')
      .create('rc', function(err, success) {
        if (err) {
          return reject(err);
        }
        var row = this.row(key);
        var cells = [
          { column: 'rc:entry_ipp',   $: crawl.entry },
          { column: 'rc:data',        $: JSON.stringify(crawl.data) },
          { column: 'rc:exceptions',  $: JSON.stringify(crawl.errors) }
        ];
        row
        .put(cells, function(err, success) {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
  }
}
