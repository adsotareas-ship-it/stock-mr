module.exports = {
  apps: [{
    name: 'stock-mr',
    script: 'backend/server.js',
    cwd: '/var/www/stock-mr',
    node_args: '--env-file=/var/www/stock-mr/.env', // Node 20+
  }],
};
