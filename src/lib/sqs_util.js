var AWS = require('aws-sdk');
var moment = require('moment');
AWS.config.region = 'us-west-2';
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

module.exports = {
  getMessage: function(queueUrl) {
    return new Promise(function(resolve, reject) {
      var params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        VisibilityTimeout: 10, // how message unavailable to others
        WaitTimeSeconds: 0
      };
      sqs.receiveMessage(params, function(error, data) {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  },

  deleteMessage: function(queueUrl, receiptHandle) {
    return new Promise(function(resolve, reject) {
      var params = {
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle
      };
      sqs.deleteMessage(params, function(error, data) {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }
}
