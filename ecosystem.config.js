module.exports = {
  apps: [{
    name:         'inventory',
    script:       'server.js',
    instances:    1,
    autorestart:  true,
    watch:        false,
    max_memory_restart: '500M',
 
    env_production: {
      NODE_ENV:        'production',
      DB_MODE:         'sql',
      DB_HOST:         'localhost',
      DB_USER:         'sa',
      DB_PASS:         'Kisna@123Strong',
      DB_NAME:         'Inventorybkp',
      DB_PORT:         '1433',
      SESSION_SECRET:  'kisna-inventory-super-secret-2024'
    }
  }]
};
