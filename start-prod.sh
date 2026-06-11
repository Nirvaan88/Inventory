#!/bin/bash
<<<<<<< HEAD
# start-prod.sh — Run this on your AWS server to start the app
# Usage: bash start-prod.sh

export DB_MODE=sql
export DB_HOST=localhost          # SQL Server is on same machine
=======
export DB_MODE=sql
export DB_HOST=localhost
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
export DB_USER=sa
export DB_PASS=Admin@123
export DB_NAME=Inventorybkp
export DB_PORT=1433
export NODE_ENV=production
export SESSION_SECRET=kisna-inventory-super-secret-2024
<<<<<<< HEAD

echo "Starting Kisna Inventory in PRODUCTION mode..."
echo "  DB Host : $DB_HOST"
echo "  DB Name : $DB_NAME"
echo "  DB User : $DB_USER"
echo ""

=======
 
echo "Starting Kisna Inventory in PRODUCTION mode..."
echo "  DB Host : $DB_HOST"
echo "  DB Name : $DB_NAME"
echo ""
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
node server.js
