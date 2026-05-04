const express = require('express');
const session = require('express-session');
const path = require('path');
const { query, execSP, sql, getPool } = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'inventory-kisna-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 } // 8 hours
}));

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// =================== AUTH ROUTES ===================
app.post('/api/login', async (req, res) => {
  const { loginId, password } = req.body;
  if (!loginId || !password) return res.status(400).json({ error: 'Missing credentials' });

  // Admin bypass
  if (loginId === 'admin' && password === 'admin') {
    req.session.user = { loginId: 'admin', isAdmin: true };
    return res.json({ success: true, user: { loginId: 'admin', isAdmin: true } });
  }

  try {
    const result = await query(
      `SELECT * FROM Login WITH (NOLOCK) WHERE LoginID = @lid AND Password = @pwd AND status = 'Y'`,
      { lid: loginId, pwd: password }
    );
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid Login ID and Password!' });
    }
    const user = result.recordset[0];
    req.session.user = { loginId: user.LoginID, name: user.UserName || loginId };
    res.json({ success: true, user: req.session.user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/session', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// =================== MASTERS ===================

// Division
app.get('/api/divisions', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT * FROM Division ORDER BY DivisionName');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/divisions', requireAuth, async (req, res) => {
  const { DivisionName } = req.body;
  try {
    await query('INSERT INTO Division (DivisionName) VALUES (@name)', { name: DivisionName });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/divisions/:id', requireAuth, async (req, res) => {
  const { DivisionName } = req.body;
  try {
    await query('UPDATE Division SET DivisionName = @name WHERE DivisionID = @id', { name: DivisionName, id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/divisions/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM Division WHERE DivisionID = @id', { id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Department
app.get('/api/departments', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT * FROM Department ORDER BY DepartmentName');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/departments', requireAuth, async (req, res) => {
  const { DepartmentName } = req.body;
  try {
    await query('INSERT INTO Department (DepartmentName) VALUES (@name)', { name: DepartmentName });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/departments/:id', requireAuth, async (req, res) => {
  const { DepartmentName } = req.body;
  try {
    await query('UPDATE Department SET DepartmentName = @name WHERE DepartmentID = @id', { name: DepartmentName, id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/departments/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM Department WHERE DepartmentID = @id', { id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Category
app.get('/api/categories', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT * FROM Category ORDER BY CategoryName');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/categories', requireAuth, async (req, res) => {
  const { CategoryName, CategoryCode } = req.body;
  try {
    await query('INSERT INTO Category (CategoryName, CategoryCode) VALUES (@name, @code)', { name: CategoryName, code: CategoryCode });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/categories/:id', requireAuth, async (req, res) => {
  const { CategoryName, CategoryCode } = req.body;
  try {
    await query('UPDATE Category SET CategoryName = @name, CategoryCode = @code WHERE CategoryId = @id', { name: CategoryName, code: CategoryCode, id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/categories/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM Category WHERE CategoryId = @id', { id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// State
app.get('/api/states', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT * FROM State ORDER BY StateName');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/states', requireAuth, async (req, res) => {
  const { StateName } = req.body;
  try {
    await query('INSERT INTO State (StateName) VALUES (@name)', { name: StateName });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/states/:id', requireAuth, async (req, res) => {
  const { StateName } = req.body;
  try {
    await query('UPDATE State SET StateName = @name WHERE StateID = @id', { name: StateName, id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/states/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM State WHERE StateID = @id', { id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// City
app.get('/api/cities', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT c.*, s.StateName FROM City c LEFT JOIN State s ON c.StateID = s.StateID ORDER BY c.CityName');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/cities', requireAuth, async (req, res) => {
  const { CityName, StateID } = req.body;
  try {
    await query('INSERT INTO City (CityName, StateID) VALUES (@name, @stateId)', { name: CityName, stateId: StateID });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/cities/:id', requireAuth, async (req, res) => {
  const { CityName, StateID } = req.body;
  try {
    await query('UPDATE City SET CityName = @name, StateID = @stateId WHERE CityID = @id', { name: CityName, stateId: StateID, id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/cities/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM City WHERE CityID = @id', { id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Item Master
app.get('/api/items', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT i.*, c.CategoryName, d.DivisionName FROM Item i 
      LEFT JOIN Category c ON i.CategoryId = c.CategoryId 
      LEFT JOIN Division d ON i.DivisionID = d.DivisionID ORDER BY i.ItemName`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/items', requireAuth, async (req, res) => {
  const { ItemName, CategoryId, DivisionID, SellPrice, ReorderLevel, ReorderQty, Stock, UOM, Priority } = req.body;
  try {
    await query(`INSERT INTO Item (ItemName, CategoryId, DivisionID, SellPrice, ReorderLevel, ReorderQty, Stock, UOM, Priority) 
      VALUES (@name, @catId, @divId, @sellPrice, @reorderLevel, @reorderQty, @stock, @uom, @priority)`,
      { name: ItemName, catId: CategoryId, divId: DivisionID, sellPrice: SellPrice, reorderLevel: ReorderLevel, reorderQty: ReorderQty, stock: Stock, uom: UOM, priority: Priority });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/items/:id', requireAuth, async (req, res) => {
  const { ItemName, CategoryId, DivisionID, SellPrice, ReorderLevel, ReorderQty, Stock, UOM, Priority } = req.body;
  try {
    await query(`UPDATE Item SET ItemName=@name, CategoryId=@catId, DivisionID=@divId, SellPrice=@sellPrice, 
      ReorderLevel=@reorderLevel, ReorderQty=@reorderQty, Stock=@stock, UOM=@uom, Priority=@priority WHERE Itemid=@id`,
      { name: ItemName, catId: CategoryId, divId: DivisionID, sellPrice: SellPrice, reorderLevel: ReorderLevel, reorderQty: ReorderQty, stock: Stock, uom: UOM, priority: Priority, id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/items/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM Item WHERE Itemid = @id', { id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Vendor Master
app.get('/api/vendors', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT v.*, c.CityName, s.StateName FROM Vendor v 
      LEFT JOIN City c ON v.CityID = c.CityID 
      LEFT JOIN State s ON v.StateID = s.StateID ORDER BY v.VendorName`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/vendors', requireAuth, async (req, res) => {
  const { VendorName, CompanyName, Address1, Address2, CityID, StateID, PinCode, Mobile, GSTNo, PANNo, AadharNo, BankName, BankAccNo, IFSCCode } = req.body;
  try {
    await query(`INSERT INTO Vendor (VendorName, CompanyName, Address1, Address2, CityID, StateID, PinCode, Mobile, GSTNo, PANNo, AadharNo, BankName, BankAccNo, IFSCCode) 
      VALUES (@name, @company, @addr1, @addr2, @cityId, @stateId, @pin, @mobile, @gst, @pan, @aadhar, @bank, @bankAcc, @ifsc)`,
      { name: VendorName, company: CompanyName, addr1: Address1, addr2: Address2, cityId: CityID, stateId: StateID, pin: PinCode, mobile: Mobile, gst: GSTNo, pan: PANNo, aadhar: AadharNo, bank: BankName, bankAcc: BankAccNo, ifsc: IFSCCode });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/vendors/:id', requireAuth, async (req, res) => {
  const { VendorName, CompanyName, Address1, Address2, CityID, StateID, PinCode, Mobile, GSTNo, PANNo, AadharNo, BankName, BankAccNo, IFSCCode } = req.body;
  try {
    await query(`UPDATE Vendor SET VendorName=@name, CompanyName=@company, Address1=@addr1, Address2=@addr2, 
      CityID=@cityId, StateID=@stateId, PinCode=@pin, Mobile=@mobile, GSTNo=@gst, PANNo=@pan, 
      AadharNo=@aadhar, BankName=@bank, BankAccNo=@bankAcc, IFSCCode=@ifsc WHERE VendorID=@id`,
      { name: VendorName, company: CompanyName, addr1: Address1, addr2: Address2, cityId: CityID, stateId: StateID, pin: PinCode, mobile: Mobile, gst: GSTNo, pan: PANNo, aadhar: AadharNo, bank: BankName, bankAcc: BankAccNo, ifsc: IFSCCode, id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/vendors/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM Vendor WHERE VendorID = @id', { id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Dealer Master
app.get('/api/dealers', requireAuth, async (req, res) => {
  try {
    const { search, searchBy } = req.query;
    let sql = `SELECT dm.*, c.CityName, s.StateName FROM DealerMaster dm 
      LEFT JOIN City c ON dm.CityID = c.CityID 
      LEFT JOIN State s ON dm.StateID = s.StateID`;
    const params = {};
    if (search) {
      if (searchBy === 'DealerID') {
        sql += ' WHERE dm.DealerID = @search';
        params.search = parseInt(search);
      } else if (searchBy === 'PersonName') {
        sql += ' WHERE dm.ContactPersonName LIKE @search';
        params.search = `%${search}%`;
      } else {
        sql += ' WHERE dm.DealerCompanyName LIKE @search';
        params.search = `%${search}%`;
      }
    }
    sql += ' ORDER BY dm.DealerCompanyName';
    const r = await query(sql, params);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/dealers/:id', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT * FROM DealerMaster WHERE DealerID = @id', { id: req.params.id });
    res.json(r.recordset[0] || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/dealers', requireAuth, async (req, res) => {
  const f = req.body;
  try {
    await query(`INSERT INTO DealerMaster (DealerCompanyName, ContactPersonName, Mobile, TelNo, Email, Address1, Address2, Address3, CityID, StateID, PinCode, GSTNo, PANNo, AadharNo, BankName, BankAccNo, IFSCCode, DealerType, PlaceOfSalesPromotion, DivisionID) 
      VALUES (@co, @cp, @mob, @tel, @email, @a1, @a2, @a3, @city, @state, @pin, @gst, @pan, @aadhar, @bank, @bankAcc, @ifsc, @type, @place, @div)`,
      { co: f.DealerCompanyName, cp: f.ContactPersonName, mob: f.Mobile, tel: f.TelNo, email: f.Email, a1: f.Address1, a2: f.Address2, a3: f.Address3, city: f.CityID, state: f.StateID, pin: f.PinCode, gst: f.GSTNo, pan: f.PANNo, aadhar: f.AadharNo, bank: f.BankName, bankAcc: f.BankAccNo, ifsc: f.IFSCCode, type: f.DealerType, place: f.PlaceOfSalesPromotion, div: f.DivisionID });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/dealers/:id', requireAuth, async (req, res) => {
  const f = req.body;
  try {
    await query(`UPDATE DealerMaster SET DealerCompanyName=@co, ContactPersonName=@cp, Mobile=@mob, TelNo=@tel, Email=@email,
      Address1=@a1, Address2=@a2, Address3=@a3, CityID=@city, StateID=@state, PinCode=@pin, GSTNo=@gst, PANNo=@pan,
      AadharNo=@aadhar, BankName=@bank, BankAccNo=@bankAcc, IFSCCode=@ifsc, DealerType=@type, PlaceOfSalesPromotion=@place, DivisionID=@div
      WHERE DealerID=@id`,
      { co: f.DealerCompanyName, cp: f.ContactPersonName, mob: f.Mobile, tel: f.TelNo, email: f.Email, a1: f.Address1, a2: f.Address2, a3: f.Address3, city: f.CityID, state: f.StateID, pin: f.PinCode, gst: f.GSTNo, pan: f.PANNo, aadhar: f.AadharNo, bank: f.BankName, bankAcc: f.BankAccNo, ifsc: f.IFSCCode, type: f.DealerType, place: f.PlaceOfSalesPromotion, div: f.DivisionID, id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/dealers/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM DealerMaster WHERE DealerID = @id', { id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Courier
app.get('/api/couriers', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT * FROM Courier ORDER BY CourierName');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/couriers', requireAuth, async (req, res) => {
  const { CourierName, ContactNo, Address } = req.body;
  try {
    await query('INSERT INTO Courier (CourierName, ContactNo, Address) VALUES (@name, @contact, @addr)', { name: CourierName, contact: ContactNo, addr: Address });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/couriers/:id', requireAuth, async (req, res) => {
  const { CourierName, ContactNo, Address } = req.body;
  try {
    await query('UPDATE Courier SET CourierName=@name, ContactNo=@contact, Address=@addr WHERE CourierID=@id', { name: CourierName, contact: ContactNo, addr: Address, id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/couriers/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM Courier WHERE CourierID = @id', { id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// User Master
app.get('/api/users', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT UserID, UserName, LoginID, Email FROM UserMaster ORDER BY UserName');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/users', requireAuth, async (req, res) => {
  const { UserName, LoginID, Password, Email } = req.body;
  try {
    await query('INSERT INTO UserMaster (UserName, LoginID, Password, Email) VALUES (@name, @lid, @pwd, @email)', { name: UserName, lid: LoginID, pwd: Password, email: Email });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/users/:id', requireAuth, async (req, res) => {
  const { UserName, LoginID, Password, Email } = req.body;
  try {
    let q = 'UPDATE UserMaster SET UserName=@name, LoginID=@lid, Email=@email';
    const params = { name: UserName, lid: LoginID, email: Email, id: req.params.id };
    if (Password) { q += ', Password=@pwd'; params.pwd = Password; }
    q += ' WHERE UserID=@id';
    await query(q, params);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/users/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM UserMaster WHERE UserID = @id', { id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Login Master
app.get('/api/logins', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT l.*, u.UserName FROM Login l LEFT JOIN UserMaster u ON l.LoginID = u.LoginID ORDER BY l.LoginID`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/logins', requireAuth, async (req, res) => {
  const { LoginID, Password, Status } = req.body;
  try {
    await query('INSERT INTO Login (LoginID, Password, Status) VALUES (@lid, @pwd, @status)', { lid: LoginID, pwd: Password, status: Status || 'Y' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/logins/:id', requireAuth, async (req, res) => {
  const { Password, Status } = req.body;
  try {
    await query('UPDATE Login SET Password=@pwd, Status=@status WHERE LoginID=@id', { pwd: Password, status: Status, id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/logins/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM Login WHERE LoginID = @id', { id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Kit Master
app.get('/api/kits', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT * FROM KitMaster ORDER BY KitName');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/kits/:id/details', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT kd.*, i.ItemName FROM KitMasterDetail kd LEFT JOIN Item i ON kd.ItemID = i.Itemid WHERE kd.KitID = @id`, { id: req.params.id });
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/kits', requireAuth, async (req, res) => {
  const { KitName, items } = req.body; // items = [{ItemID, Qty}]
  try {
    const db = await getPool();
    const r = await db.request().input('name', KitName).query('INSERT INTO KitMaster (KitName) OUTPUT INSERTED.KitID VALUES (@name)');
    const kitId = r.recordset[0].KitID;
    if (items && items.length) {
      for (const item of items) {
        await query('INSERT INTO KitMasterDetail (KitID, ItemID, Qty) VALUES (@kitId, @itemId, @qty)', { kitId, itemId: item.ItemID, qty: item.Qty });
      }
    }
    res.json({ success: true, KitID: kitId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Items-Vendor Mapping
app.get('/api/item-vendor-mapping', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT ivm.*, i.ItemName, v.VendorName FROM ItemVendorMapping ivm 
      LEFT JOIN Item i ON ivm.ItemID = i.Itemid LEFT JOIN Vendor v ON ivm.VendorID = v.VendorID`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/item-vendor-mapping', requireAuth, async (req, res) => {
  const { ItemID, VendorID } = req.body;
  try {
    await query('INSERT INTO ItemVendorMapping (ItemID, VendorID) VALUES (@itemId, @vendorId)', { itemId: ItemID, vendorId: VendorID });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/item-vendor-mapping/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM ItemVendorMapping WHERE MappingID = @id', { id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Kisna Region State
app.get('/api/kisna-region-states', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT * FROM KisnaRegionState ORDER BY Region');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =================== TRANSACTIONS ===================

// Purchase Inward
app.get('/api/inward', requireAuth, async (req, res) => {
  try {
    const { inwardId, orderNo } = req.query;
    let q = `SELECT i.*, v.VendorName FROM Inward i LEFT JOIN Vendor v ON i.VendorID = v.VendorID`;
    const params = {};
    if (inwardId) { q += ' WHERE i.InwardID = @inwardId'; params.inwardId = inwardId; }
    else if (orderNo) { q += ' WHERE i.OrderNo = @orderNo'; params.orderNo = orderNo; }
    q += ' ORDER BY i.InwardDate DESC';
    const r = await query(q, params);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/inward/:id/items', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT ii.*, i.ItemName FROM InwardItem ii LEFT JOIN Item i ON ii.ItemID = i.Itemid WHERE ii.InwardID = @id`, { id: req.params.id });
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/inward', requireAuth, async (req, res) => {
  const { VendorID, InwardDate, InvoiceNumber, DCNumber, DCQty, OrderNo, ReturnMode, Reason, PersonName, ItemStatus, DivisionID, items } = req.body;
  try {
    const db = await getPool();
    const r = await db.request()
      .input('VendorID', VendorID).input('InwardDate', InwardDate).input('InvoiceNumber', InvoiceNumber)
      .input('DCNumber', DCNumber).input('DCQty', DCQty).input('OrderNo', OrderNo)
      .input('ReturnMode', ReturnMode).input('Reason', Reason).input('PersonName', PersonName)
      .input('ItemStatus', ItemStatus).input('DivisionID', DivisionID)
      .query(`INSERT INTO Inward (VendorID, InwardDate, InvoiceNumber, DCNumber, DCQty, OrderNo, ReturnMode, Reason, PersonName, ItemStatus, DivisionID) 
        OUTPUT INSERTED.InwardID VALUES (@VendorID, @InwardDate, @InvoiceNumber, @DCNumber, @DCQty, @OrderNo, @ReturnMode, @Reason, @PersonName, @ItemStatus, @DivisionID)`);
    const inwardId = r.recordset[0].InwardID;
    if (items && items.length) {
      for (const item of items) {
        await query(`INSERT INTO InwardItem (InwardID, ItemID, Qty, Rate, Amount) VALUES (@inwardId, @itemId, @qty, @rate, @amount)`,
          { inwardId, itemId: item.ItemID, qty: item.Qty, rate: item.Rate, amount: item.Amount });
        // Update stock
        await query('UPDATE Item SET Stock = ISNULL(Stock, 0) + @qty WHERE Itemid = @itemId', { qty: item.Qty, itemId: item.ItemID });
      }
    }
    res.json({ success: true, InwardID: inwardId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Issue Items
app.get('/api/issues', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT i.*, d.DealerCompanyName FROM Issue i LEFT JOIN DealerMaster d ON i.DealerID = d.DealerID ORDER BY i.IssueDate DESC`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/issues/:id/items', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT ii.*, i.ItemName FROM IssueItem ii LEFT JOIN Item i ON ii.ItemID = i.Itemid WHERE ii.IssueID = @id`, { id: req.params.id });
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/issues', requireAuth, async (req, res) => {
  const { DealerID, IssueDate, CourierID, CourierDocketNo, DivisionID, items } = req.body;
  try {
    const db = await getPool();
    const r = await db.request()
      .input('DealerID', DealerID).input('IssueDate', IssueDate).input('CourierID', CourierID)
      .input('CourierDocketNo', CourierDocketNo).input('DivisionID', DivisionID)
      .query(`INSERT INTO Issue (DealerID, IssueDate, CourierID, CourierDocketNo, DivisionID) OUTPUT INSERTED.IssueID VALUES (@DealerID, @IssueDate, @CourierID, @CourierDocketNo, @DivisionID)`);
    const issueId = r.recordset[0].IssueID;
    for (const item of (items || [])) {
      await query(`INSERT INTO IssueItem (IssueID, ItemID, Qty, Rate, Amount) VALUES (@issueId, @itemId, @qty, @rate, @amount)`,
        { issueId, itemId: item.ItemID, qty: item.Qty, rate: item.Rate, amount: item.Amount });
      await query('UPDATE Item SET Stock = ISNULL(Stock, 0) - @qty WHERE Itemid = @itemId', { qty: item.Qty, itemId: item.ItemID });
    }
    res.json({ success: true, IssueID: issueId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Issue Return
app.get('/api/issue-returns', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT ir.*, d.DealerCompanyName FROM IssueReturn ir LEFT JOIN DealerMaster d ON ir.DealerID = d.DealerID ORDER BY ir.ReturnDate DESC`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/issue-returns/:id/items', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT iri.*, i.ItemName FROM IssueReturnItem iri LEFT JOIN Item i ON iri.ItemID = i.Itemid WHERE iri.IssueReturnID = @id`, { id: req.params.id });
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/issue-returns', requireAuth, async (req, res) => {
  const { DealerID, ReturnDate, IssueID, items } = req.body;
  try {
    const db = await getPool();
    const r = await db.request()
      .input('DealerID', DealerID).input('ReturnDate', ReturnDate).input('IssueID', IssueID)
      .query(`INSERT INTO IssueReturn (DealerID, ReturnDate, IssueID) OUTPUT INSERTED.IssueReturnID VALUES (@DealerID, @ReturnDate, @IssueID)`);
    const returnId = r.recordset[0].IssueReturnID;
    for (const item of (items || [])) {
      await query(`INSERT INTO IssueReturnItem (IssueReturnID, ItemID, Qty, Rate, Amount) VALUES (@rid, @itemId, @qty, @rate, @amount)`,
        { rid: returnId, itemId: item.ItemID, qty: item.Qty, rate: item.Rate, amount: item.Amount });
      await query('UPDATE Item SET Stock = ISNULL(Stock, 0) + @qty WHERE Itemid = @itemId', { qty: item.Qty, itemId: item.ItemID });
    }
    res.json({ success: true, IssueReturnID: returnId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Order
app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT o.*, v.VendorName FROM [Order] o LEFT JOIN Vendor v ON o.VendorID = v.VendorID ORDER BY o.OrderDate DESC`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/orders/:id/items', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT oi.*, i.ItemName FROM OrderItem oi LEFT JOIN Item i ON oi.ItemID = i.Itemid WHERE oi.OrderID = @id`, { id: req.params.id });
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/orders', requireAuth, async (req, res) => {
  const { VendorID, OrderDate, DivisionID, items } = req.body;
  try {
    const db = await getPool();
    const r = await db.request()
      .input('VendorID', VendorID).input('OrderDate', OrderDate).input('DivisionID', DivisionID)
      .query(`INSERT INTO [Order] (VendorID, OrderDate, DivisionID) OUTPUT INSERTED.OrderID VALUES (@VendorID, @OrderDate, @DivisionID)`);
    const orderId = r.recordset[0].OrderID;
    for (const item of (items || [])) {
      await query(`INSERT INTO OrderItem (OrderID, ItemID, Qty, Rate) VALUES (@orderId, @itemId, @qty, @rate)`,
        { orderId, itemId: item.ItemID, qty: item.Qty, rate: item.Rate });
    }
    res.json({ success: true, OrderID: orderId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =================== REPORTS ===================

// Item Stock Report
app.get('/api/reports/item-stock', requireAuth, async (req, res) => {
  try {
    const { divisionId } = req.query;
    let q = `SELECT i.*, c.CategoryName, d.DivisionName FROM Item i 
      LEFT JOIN Category c ON i.CategoryId = c.CategoryId 
      LEFT JOIN Division d ON i.DivisionID = d.DivisionID`;
    const params = {};
    if (divisionId) { q += ' WHERE i.DivisionID = @divId'; params.divId = divisionId; }
    q += ' ORDER BY i.ItemName';
    const r = await query(q, params);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Transactions Report
app.get('/api/reports/transactions', requireAuth, async (req, res) => {
  try {
    const { fromDate, toDate, type } = req.query;
    let data = {};
    if (!type || type === 'inward') {
      const r = await query(`SELECT 'Inward' as TxType, i.InwardDate as TxDate, v.VendorName, ii.Qty, ii.Rate, ii.Amount, it.ItemName
        FROM Inward i JOIN InwardItem ii ON i.InwardID=ii.InwardID JOIN Item it ON ii.ItemID=it.Itemid LEFT JOIN Vendor v ON i.VendorID=v.VendorID
        WHERE (@from IS NULL OR i.InwardDate >= @from) AND (@to IS NULL OR i.InwardDate <= @to)`,
        { from: fromDate || null, to: toDate || null });
      data.inward = r.recordset;
    }
    if (!type || type === 'issue') {
      const r = await query(`SELECT 'Issue' as TxType, i.IssueDate as TxDate, d.DealerCompanyName, ii.Qty, ii.Rate, ii.Amount, it.ItemName
        FROM Issue i JOIN IssueItem ii ON i.IssueID=ii.IssueID JOIN Item it ON ii.ItemID=it.Itemid LEFT JOIN DealerMaster d ON i.DealerID=d.DealerID
        WHERE (@from IS NULL OR i.IssueDate >= @from) AND (@to IS NULL OR i.IssueDate <= @to)`,
        { from: fromDate || null, to: toDate || null });
      data.issue = r.recordset;
    }
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Inward Pricing Report
app.get('/api/reports/inward-pricing', requireAuth, async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const r = await query(`SELECT i.InwardDate, v.VendorName, it.ItemName, ii.Qty, ii.Rate, ii.Amount, i.InvoiceNumber
      FROM Inward i JOIN InwardItem ii ON i.InwardID=ii.InwardID JOIN Item it ON ii.ItemID=it.Itemid LEFT JOIN Vendor v ON i.VendorID=v.VendorID
      WHERE (@from IS NULL OR i.InwardDate >= @from) AND (@to IS NULL OR i.InwardDate <= @to)
      ORDER BY i.InwardDate`,
      { from: fromDate || null, to: toDate || null });
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// View Items Stock (Division-wise)
app.get('/api/reports/stock-division-wise', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT i.ItemName, d.DivisionName, i.Stock, i.ReorderLevel, i.ReorderQty, c.CategoryName 
      FROM Item i LEFT JOIN Division d ON i.DivisionID=d.DivisionID LEFT JOIN Category c ON i.CategoryId=c.CategoryId ORDER BY d.DivisionName, i.ItemName`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Pending Inward Returns
app.get('/api/reports/inward-return-pending', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT ii.*, i.ItemName, iw.InwardDate, iw.VendorID, v.VendorName
      FROM InwardReturnItem ii JOIN Item i ON ii.ItemID=i.Itemid JOIN Inward iw ON ii.InwardID=iw.InwardID LEFT JOIN Vendor v ON iw.VendorID=v.VendorID
      WHERE ii.ReturnStatus IS NULL OR ii.ReturnStatus <> 'Y'`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Pending Issue Returns
app.get('/api/reports/issue-return-pending', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT ii.*, i.ItemName, iss.IssueDate, iss.DealerID, d.DealerCompanyName
      FROM IssueItem ii JOIN Item i ON ii.ItemID=i.Itemid JOIN Issue iss ON ii.IssueID=iss.IssueID LEFT JOIN DealerMaster d ON iss.DealerID=d.DealerID
      WHERE ii.ReturnStatus IS NULL OR ii.ReturnStatus <> 'Y'`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Issue Pending Items
app.get('/api/reports/issue-pending', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT oi.*, i.ItemName, o.OrderDate, o.VendorID, v.VendorName
      FROM OrderItem oi JOIN Item i ON oi.ItemID=i.Itemid JOIN [Order] o ON oi.OrderID=o.OrderID LEFT JOIN Vendor v ON o.VendorID=v.VendorID
      WHERE oi.IssuedQty IS NULL OR oi.IssuedQty < oi.Qty`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Catch-all for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Inventory Web App running at http://localhost:${PORT}`);
});
