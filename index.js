'use strict';
var util = require('util');
var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var lifx = require('lifx');
var tinycolor = require('tinycolor2');
var debug = require('debug')('meshblu-lifx-light')

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
    },
    white: {
      type: 'number'
    }
  }
};

var OPTIONS_SCHEMA = {
  type: 'object',
  properties: {
    lightId: {
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
  this.options = options;
  this._lifx = undefined;
  this._bulb = undefined;
  this.setupLifx();
};

Plugin.prototype.setupLifx = function() {
  var lightId = this.lightId;
  if(!lightId){
    return console.error('No light id');
  }
  this._lifx = lifx.init();
  debug('searching for light id', lightId);
  this._bulb = _.find(this._lifx.bulbs, {id: lightId});
  debug('found bulb', this._bulb);

}

Plugin.prototype.updateLifx = function(payload) {
  var hsv, hue, sat, bri, temp, bulb, bulbName, timing;

  if (payload.on === false) {
    debug('black light', bulb);
    payload.color = 'rgba(0,0,0,0.0)';
  }

  hsv      = tinycolor(payload.color).toHsv();
  hue      = parseInt((hsv.h/360) * UINT16_MAX);
  sat      = parseInt(hsv.s * UINT16_MAX);
  bri      = parseInt(hsv.v * hsv.a * UINT16_MAX);
  temp     = parseInt(hsv.a * MAX_KELVIN);
  timing   = payload.timing || 0;

  var bulb = this._bulb;
  debug('lightsColour', hue, sat, bri, temp, timing, bulb);
  this._lifx.lightsOn(bulb);
  this._lifx.lightsColour(hue, sat, bri, temp, timing, bulb);
}

module.exports = {
  messageSchema: MESSAGE_SCHEMA,
  optionsSchema: OPTIONS_SCHEMA,
  Plugin: Plugin
};
