<<<<<<< HEAD
// ecosystem.config.js — pm2 configuration
// Usage on AWS server:
//   pm2 start ecosystem.config.js
//   pm2 save   (to persist across reboots)

module.exports = {
  apps: [{
    name: 'inventory',
    script: 'server.js',
    instances: 1,           // single instance (file-based sessions don't support cluster)
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',

    env_production: {
      NODE_ENV: 'production',
      DB_MODE: 'sql',
      DB_HOST: 'localhost',   // SQL Server is on the same machine
      DB_USER: 'sa',
      DB_PASS: 'Admin@123',
      DB_NAME: 'Inventorybkp',
      DB_PORT: '1433',
      SESSION_SECRET: 'kisna-inventory-super-secret-2024',
      TAQTICS_API_URL: 'https://kisna.taqtics.co/v1/external/store',
      TAQTICS_ACCESS_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InZpcGluLnNAa2lzbmEuY29tIiwidXNlcklkIjoiNjg5MGUxZWFhOTYxZmJmZGUwNWQ4NmM1IiwibmFtZSI6IlZpcGluIFNlbmkiLCJyb2xlIjoidXNlciIsImNvbXBhbnlJZCI6Imtpc25hIiwic3ViZG9tYWluIjoia2lzbmEudGFxdGljcy5jbyIsInVzZXJSb2xlIjoiY29tcGFueUFkbWluIiwicmVhZE9ubHkiOmZhbHNlLCJicm93c2VyIjoiY2hyb21lIiwiYnJvd3NlclZlcnNpb24iOiIxNDgiLCJvcyI6IndpbmRvd3MgbnQiLCJvc1ZlcnNpb24iOiIxMC4wIiwiaXBBZGRyZXNzIjoiMjcuMTA3LjI0NC4xOTAiLCJ0b2tlblZlcnNpb24iOjEsImlhdCI6MTc3ODgzNzU2NywiZXhwIjoxNzc5NDQyMzY3fQ.J2IP_lPX4Y8VXwyHM63-85gkqR73v69W1x1YHT667FQ'
=======
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
      DB_HOST:         '43.204.41.145',
      DB_USER:         'sa',
      DB_PASS:         'sa@123',
      DB_NAME:         'Inventorybkp',
      DB_PORT:         '1433',
      SESSION_SECRET:  'kisna-inventory-super-secret-2024'
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
    }
  }]
};
