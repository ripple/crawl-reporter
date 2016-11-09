var _ = require('lodash');
var moment = require('moment');
var ripple = require('ripple-lib');
var hbaseUtils = require('crawler-hbase').utils;
var sjcl = ripple.sjcl;
var toNormPubKey = {}
var ippToPk = {}


function normalizePubKey(pubKeyStr) {
  if (pubKeyStr.length > 50 && pubKeyStr[0] === 'n') {
    return pubKeyStr;
  }

  var bits = sjcl.codec.base64.toBits(pubKeyStr);
  var bytes = sjcl.codec.bytes.fromBits(bits);
  return ripple.Base.encode_check(ripple.Base.VER_NODE_PUBLIC, bytes);
}

var DEFAULT_PORT = 51235

/*
* Deals with a variety of (ip, port) possibilities that occur
* in rippled responses and normalizes them to the format 'ip:port'
*/
function normalizeIpp(ip, port) {
  if (ip) {
    var split = ip.split(':'),
        splitIp = split[0],
        splitPort = split[1];

    var out_ip = splitIp;
    var out_port = port || splitPort || DEFAULT_PORT;
    if (out_port) {
      var ipp = out_ip + ':' + out_port;
      return ipp;
    }
  }

  throw new Error('ip is undefined');
}

function getRippleds(nodes) {
  var rippleds = {};
  var maxUptimeByIpp = {};

  _.each(nodes, function(node) {

    // node properties
    var n_ipp = Object.keys(node)[0];
    maxUptimeByIpp[n_ipp] = 0;
    if (!node[n_ipp]['overlay']) {
      return;
    }
    var n_peers = node[n_ipp].overlay.active;
    
    var requestStart = moment(node[n_ipp].request_start_at);
    var requestEnd = moment(node[n_ipp].request_end_at);

    _.each(n_peers, function(peer) {

      // peer properties
      var p_v = peer.version;
      var p_pk;
      if (toNormPubKey[peer.public_key]) {
        p_pk = toNormPubKey[peer.public_key];
      } else {
        p_pk = normalizePubKey(peer.public_key);
        toNormPubKey[peer.public_key] = p_pk;
      }
      var p_ipp;
      try {
        p_ipp = normalizeIpp(peer.ip, peer.port);
      } catch (error) {
        p_ipp = undefined;
      }
      var uptime = peer.uptime;
      maxUptimeByIpp[n_ipp] = Math.max(maxUptimeByIpp[n_ipp], uptime);
      // Fill in rippled
      var rippled = rippleds[p_pk];
      if (rippled) {
        if (!rippled.ipp) {
          rippled.ipp = p_ipp;
        }
        if (!rippled.version) {
          rippled.version = p_v;
        }
        if (!rippled.uptime || rippled.uptime<uptime) {
          rippled.uptime = uptime;
        }
      } else {
        rippleds[p_pk] = {ipp: p_ipp, version: p_v, uptime: uptime, request_time: requestEnd.diff(requestStart)};
      }
    });
  });
  // correcting uptime once rippleds and maxUptimeByIpp are ready
  _.each(rippleds, function(r) {
    var peerMaxUptime = r.ipp && maxUptimeByIpp[r.ipp];
    if (!r.uptime || peerMaxUptime > r.uptime) {
      r.uptime = peerMaxUptime;
    }
  });
  return rippleds;
}

function getConnections(nodes) {
  var connections = {};

  // Get connections
  _.each(nodes, function(node) {

    // node properties
    var n_ipp = Object.keys(node)[0];
    if (!node[n_ipp]['overlay']) {
      return;
    }
    var n_peers = node[n_ipp].overlay.active;

    _.each(n_peers, function(peer) {

      // peer properties
      var p_pk;
      if (toNormPubKey[peer.public_key]) {
        p_pk = toNormPubKey[peer.public_key];
      } else {
        p_pk = normalizePubKey(peer.public_key);
        toNormPubKey[peer.public_key] = p_pk;
      }
      var p_type = peer.type;

      var a, b; // a = from, b = to
      // Make link
      if (p_type) {
        // Get link
        if (p_type === 'in') {
          a = p_pk;
          b = ippToPk[n_ipp];
        } else if (p_type === 'out') {
          a = ippToPk[n_ipp];
          b = p_pk;
        } else if (p_type === 'peer') {
          if (peer.ip) {
            if (peer.ip.split(':').length === 2) {
              a = p_pk;
              b = ippToPk[n_ipp];
            } else {
              a = ippToPk[n_ipp];
              b = p_pk;
            }
          }
        } else {
          // If type is not in/out/peer
          throw new Error('Peer has unexpected type');
        }

        if (a !== undefined && b !== undefined) {
          if (connections[[a, b]] === undefined) {
            connections[[a, b]] = 0;
          }
          connections[[a, b]] += 1;
        }
      }

    });
  });

  return connections;
}

function getMetrics(crawl_row) {
  var metrics = {}; // metrics that will be returned

  /* Crawl Info */
  var crawl = {
    'id': crawl_row.rowkey,
    'start': hbaseUtils.keyToStart(crawl_row.rowkey),
    'end': hbaseUtils.keyToEnd(crawl_row.rowkey),
    'entry': crawl_row.entry_ipp
  };

  /* Rippled Info */
  var nodes = JSON.parse(crawl_row.data);
  var rippleds = getRippleds(nodes);

  // Create ippToPk using rippleds
  _.each(Object.keys(rippleds), function(pk) {
    var ipp = rippleds[pk].ipp;
    if (ipp) {
      ippToPk[ipp] = pk;
    }
  });

  /* Connections Info */
  var connections = getConnections(nodes);

  /* In & Out Info */
  _.each(Object.keys(connections), function(link) {
    var from = link.split(',')[0];
    var to = link.split(',')[1];

    if (rippleds[from] && rippleds[to]) {
      // from
      if (!rippleds[from].in) {
        rippleds[from].in = 0;
      }
      if (!rippleds[from].out) {
        rippleds[from].out = 0;
      }
      rippleds[from].out += 1;

      // to
      if (!rippleds[to].in) {
        rippleds[to].in = 0;
      }
      if (!rippleds[to].out) {
        rippleds[to].out = 0;
      }
      rippleds[to].in += 1;
    }
  });


  /* Error Info */
  var exceptions = JSON.parse(crawl_row.exceptions);
  _.each(exceptions, function(exception) {
    _.forIn(exception, function(error, ipp) {
      var pubkey = ippToPk[ipp];
      if (pubkey) {
        if (!rippleds[pubkey]) {
          rippleds[pubkey] = {errors: error}
        } else {
          rippleds[pubkey].errors = error;
        }
      }
    })
  });


  // Fill in metrics
  metrics.crawl = crawl;
  metrics.rippleds = rippleds;
  metrics.connections = connections;

  return metrics;
}

module.exports = function(crawl_row, log) {
  if(!crawl_row) return undefined;
  var metrics = getMetrics(crawl_row);
  if (log) {
    console.log('Processed crawl %s \t at %s', crawl_row.rowkey, moment().format());
  }
  return metrics;
}
