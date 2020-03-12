var express = require('express');
var client = require('prom-client');

var app = express();

const { collectDefaultMetrics, Registry } = client;
const register = new Registry();

// Collect Node.js metrics
collectDefaultMetrics({ register });