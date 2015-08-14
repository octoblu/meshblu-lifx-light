'use strict';
var util = require('util');
var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var tinycolor = require('tinycolor2');
var debug = require('debug')('meshblu-lifx-light')
var Client = require('node-lifx').Client;
var Light = require('node-lifx').Light;

var UINT16_MAX = 65535;
var MAX_KELVIN = 9000;

var MESSAGE_SCHEMA = {
  type: 'object',
  properties: {
    on: {
      type: 'boolean',
      required: true
    },
    color: {
      type: 'string',
      required: true
    },
    timing: {
      type: 'number'
    }
  }
};

var OPTIONS_SCHEMA = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      required: true
    },
    address: {
      type: 'string',
      required: true
    },
    port: {
      type: 'string',
      required: true
    },
    status: {
      type: 'string',
      required: true
    }
  }
};

function Plugin(){
  this.options = {};
  this.messageSchema = MESSAGE_SCHEMA;
  this.optionsSchema = OPTIONS_SCHEMA;
  return this;
}
util.inherits(Plugin, EventEmitter);

Plugin.prototype.onMessage = function(message){
  var payload = message.payload;
  this.updateLifx(payload);
};

Plugin.prototype.onConfig = function(device){
  this.setOptions(device.options||{});
};

Plugin.prototype.setOptions = function(options){
  this.options = options || {};
  this.client = undefined;
  this.setupLifx();
};

Plugin.prototype.setupLifx = function() {
  this.client = new Client();
  this.client.init()
}

Plugin.prototype.updateLifx = function(payload) {
  var hsv, hue, sat, bri, temp, timing;

  if (payload.on === false) {
    debug('black light');
    payload.color = 'rgba(0,0,0,0.0)';
  }

  hsv      = tinycolor(payload.color).toHsv();
  hue      = parseInt((hsv.h/360) * 360);
  sat      = parseInt(hsv.s * 100);
  bri      = parseInt(hsv.v * hsv.a * 100);
  temp     = parseInt(hsv.a * MAX_KELVIN);
  timing   = payload.timing || 0;

  debug('light color', hue, sat, bri, temp, timing);
  var light = this.options || {};
  var lightId = light.id || light.lightId;
  if(!lightId){
    return console.error('No light id');
  }
  debug('lightId', lightId);
  debug('light', light);
  var newLight = {
    client : this.client,
    id: lightId,
    address: light.address,
    port: light.port,
    status: light.status
  };
  var lightDevice = new Light(newLight);
  lightDevice.color(hue, sat, bri, temp, timing);
}

module.exports = {
  messageSchema: MESSAGE_SCHEMA,
  optionsSchema: OPTIONS_SCHEMA,
  Plugin: Plugin
};
