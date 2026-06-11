const { query } = require('./db');

async function migrate() {
  try {
    // Check if Role column exists
    const checkRole = await query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Login' AND COLUMN_NAME = 'Role'
    `);
    
    if (checkRole.recordset.length === 0) {
      console.log('Adding Role column to Login table...');
      await query(`ALTER TABLE [Login] ADD [Role] VARCHAR(50) DEFAULT 'User'`);
    } else {
      console.log('Role column already exists.');
    }

    // Check if DivisionId column exists
    const checkDiv = await query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Login' AND COLUMN_NAME = 'DivisionId'
    `);

    if (checkDiv.recordset.length === 0) {
      console.log('Adding DivisionId column to Login table...');
      await query(`ALTER TABLE [Login] ADD [DivisionId] INT`);
    } else {
      console.log('DivisionId column already exists.');
    }

    // Update the admin user to have SuperAdmin role
    await query(`UPDATE [Login] SET [Role] = 'SuperAdmin' WHERE [LoginID] = 'admin'`);
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
