const { sql, getPool } = require('./db.js');
async function createTable() {
  try {
    const pool = await getPool();
    const checkSql = \SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PriceApprovalRequests'\;
    const r = await pool.request().query(checkSql);
    if (r.recordset.length === 0) {
      const createSql = \
        CREATE TABLE PriceApprovalRequests (
          ID INT IDENTITY PRIMARY KEY,
          Type NVARCHAR(50),
          RecordID INT,
          ItemName NVARCHAR(255),
          VendorName NVARCHAR(255),
          FieldName NVARCHAR(50),
          ProposedValue DECIMAL(18,2),
          SubmittedBy NVARCHAR(100),
          SubmittedAt DATETIME DEFAULT GETDATE(),
          Status NVARCHAR(20) DEFAULT 'Pending',
          ApprovedValue DECIMAL(18,2),
          ApprovedBy NVARCHAR(100),
          ApprovedAt DATETIME,
          AdminNotified BIT DEFAULT 0
        )
      \;
      await pool.request().query(createSql);
      console.log('Table created.');
    } else {
      console.log('Table already exists.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
createTable();
