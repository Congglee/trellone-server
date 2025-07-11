module.exports = {
  apps: [
    {
      name: 'trellone-api-server',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
}
