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

      expect(metrics).to.have.property('crawl');
      expect(metrics.crawl).to.be.an('object');

      expect(metrics).to.have.property('rippleds');
      expect(metrics.rippleds).to.be.an('object');

      expect(metrics).to.have.property('connections');
      expect(metrics.connections).to.be.an('object');
    });
  });
});
