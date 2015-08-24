'use strict';
var assert = require('chai').assert;
var expect = require('chai').expect;
var processCrawl = require('../src/lib/process_crawl');
var valid_row = require('./data/valid_row.json');

describe('Crawl Processing', function() {
  describe('#getMetrics()', function() {
    it("Shouldn't throw an error when given valid row", function() {
      var metrics = processCrawl(valid_row, false);
    });
    it("Should return an object with expected properties", function() {
      var metrics = processCrawl(valid_row, false);

      // crawl
      expect(metrics).to.have.property('crawl');
      expect(metrics.crawl).to.be.an('object');

      expect(metrics.crawl).to.have.property('id');
      expect(metrics.crawl.id).to.be.an('string');
      expect(metrics.crawl).to.have.property('start');
      expect(metrics.crawl.start).to.be.a('string');
      expect(metrics.crawl).to.have.property('end');
      expect(metrics.crawl.end).to.be.a('string');

      // rippleds
      expect(metrics).to.have.property('rippleds');
      expect(metrics.rippleds).to.be.an('object');
      expect(Object.keys(metrics.rippleds).length).to.equal(117);

      // connections
      expect(metrics).to.have.property('connections');
      expect(metrics.connections).to.be.an('object');
      expect(Object.keys(metrics.connections).length).to.equal(1942);
    });

  });
});
