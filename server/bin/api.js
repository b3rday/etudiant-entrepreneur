#!/usr/bin/env node
var bunyan = require('bunyan')
var bunyanFormat = require('bunyan-format')
var nconf = require('nconf')
var Server = require('../api/server')
var http = require('http')
var url = require('url')

nconf.env({
  separator: '_'
}).argv()
nconf.defaults(require('../defaults'))

var logger = bunyan.createLogger({
  name: nconf.get('appname'),
  level: nconf.get('log:level'),
  stream: bunyanFormat({
    outputMode: nconf.get('log:format')
  })
})

var mhttp = require('http-measuring-client').create()
mhttp.mixin(http)
mhttp.on('stat', function (parsed, stats) {
  logger.info({
    parsedUri: parsed,
    stats: stats
  }, '%s %s took %dms (%d)', stats.method || 'GET', url.format(parsed), stats.totalTime, stats.statusCode)
})

var server = new Server({
  port: nconf.get('apiPort'),
  logger: logger,
})

server.start(function (err) {
  if (err) {
    logger.fatal({error: err}, 'cannot recover from previous errors. shutting down now. error was', err.stack)
    setTimeout(process.exit.bind(null, 99), 10)
  }
  logger.info('Sever successfully started.')
})
