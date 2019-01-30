'use strict'

const { EventEmitter } = require('events')
const errorUtils = require('@electron/internal/common/error-utils')

const emitter = new EventEmitter()

// Do not throw exception when channel name is "error".
emitter.on('error', () => {})

const callHandler = function (handler, event, ...args) {
  return new Promise(resolve => {
    resolve(handler(event, ...args))
  }).then(result => {
    return [null, result]
  }, error => {
    return [errorUtils.serialize(error)]
  })
}

emitter.handle = function (channel, handler) {
  emitter.on(channel, (event, requestId, ...args) => {
    callHandler(handler, event, ...args).then(responseArgs => {
      event._replyInternal(`${channel}_RESPONSE_${requestId}`, ...responseArgs)
    })
  })
}

emitter.handleSync = function (channel, handler) {
  emitter.on(channel, (event, ...args) => {
    callHandler(handler, event, ...args).then(responseArgs => {
      event.returnValue = responseArgs
    })
  })
}

module.exports = emitter
