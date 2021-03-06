var express = require('express');
var client = require('prom-client');
const gcStats = require('prometheus-gc-stats');

var app = express();

const { collectDefaultMetrics, register } = client;

// Collect Node.js metrics
collectDefaultMetrics({ timeout: 5000 });

// Collect GC metrics from Node.js
const startGcStats = gcStats(client.register);
startGcStats();

// Summary metric for measuring request durations
const requestDurationSummary = new client.Summary({
  name: 'sample_app_summary_request_duration_seconds',
  help: 'Summary of request durations',
  labelNames: ['method', 'status'],
  percentiles: [0.5, 0.75, 0.9, 0.95, 0.99]
});

// Set counters to zero on relevant label combinations
requestDurationSummary.observe({ method: 'GET', status: '404' }, 0);
requestDurationSummary.observe({method: 'GET', status: '500' }, 0);

// Histogram metric for measuring request durations
const requestDurationHistogram = new client.Histogram({
  name: 'sample_app_histogram_request_duration_seconds',
  help: 'Histogram of request durations',
  labelNames: ['method', 'status'],

  // distribution more closely
  buckets:  [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

// Set counters to zero on relevant label combinations
requestDurationHistogram.observe({ method: "GET", status: '404' }, 0);
requestDurationHistogram.observe({ method: 'GET', status: '500' }, 0);

// This middleware measures the request duration with a Summary
app.use((req, res, next) => {
  const end = requestDurationSummary.startTimer();
  res.on('finish', () => {
    end({ method: req.method, status: res.statusCode });
  });
  next();
});

// This middleware measures the request duration with a Histogram
app.use((req, res, next) => {
  const end = requestDurationHistogram.startTimer();
  res.on('finish', () => {
    end({ method: req.method, status: res.statusCode });
  });
  next();
});

// Main route
app.get('/', async (req, res) => {
  // Simulate a 1s delay in ~5% of all requests
  if (Math.random() <= 0.05) {
    const sleep = (ms) => {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    };
    await sleep(1000);
  }
  res.set('Content-Type', 'application/json');
  res.send({ message: 'Looking good!' });
});

// Expose the collected metrics via the /metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(register.metrics());
});

// Start the server
app.listen(4000, () => console.log('Running on port 4000'));
