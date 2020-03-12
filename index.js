var express = require('express');
var client = require('prom-client');

var app = express();

const { collectDefaultMetrics, Registry } = client;
const register = new Registry();

// Collect Node.js metrics
collectDefaultMetrics({ register });

// Summary metric for measuring request durations
const requestDurationSummary = new client.Summary({
  name: 'sample_app_summary_request_duration_seconds',
  help: 'Summary of request durations',
  labelNames: ['method', 'status'],
  percentiles: [0.5, 0.75, 0.9, 0.95, 0.99]
});