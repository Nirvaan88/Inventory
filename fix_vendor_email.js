
const fs = require('fs');

// ════════════════════════════════════════════════════════════════════
//  PART A – server.js : add VendorEmail to GET/POST/PUT /api/vendors
// ════════════════════════════════════════════════════════════════════
let sv = fs.readFileSync('server.js', 'utf8').replace(/\r\n/g, '\n');

// A1 – Add VendorEmail to SELECT in GET /api/vendors
const OLD_V_SELECT = `SELECT v.[vendorid], v.[Name], v.[Mob], v.[Addr1], v.[Addr2],
             v.[Pin], v.[CompanyName], v.[PAN], v.[AadharNo], v.[GstNo],
             v.[BankName], v.[BankAccNo], v.[IFSCCode],
             v.[Status], v.[AddedBy], v.[AddedDate], v.[ModifyBy], v.[DateModify],
             v.[StateID], v.[CityID],
             s.[State] AS StateName,
             c.[City]  AS CityName`;

const NEW_V_SELECT = `SELECT v.[vendorid], v.[Name], v.[Mob], v.[Addr1], v.[Addr2],
             v.[Pin], v.[CompanyName], v.[PAN], v.[AadharNo], v.[GstNo],
             v.[BankName], v.[BankAccNo], v.[IFSCCode],
             v.[VendorEmail],
             v.[Status], v.[AddedBy], v.[AddedDate], v.[ModifyBy], v.[DateModify],
             v.[StateID], v.[CityID],
             s.[State] AS StateName,
             c.[City]  AS CityName`;

if (sv.includes(OLD_V_SELECT)) { sv = sv.replace(OLD_V_SELECT, NEW_V_SELECT); console.log('A1 OK: VendorEmail in GET select'); }
else console.error('A1 NOT FOUND: GET select');

// A2 – Add VendorEmail to POST INSERT columns + VALUES
const OLD_V_INSERT_COLS = `[Name],[Mob],[Addr1],[Addr2],[CityID],[StateID],[Pin],[CompanyName],[GstNo],[PAN],[AadharNo],[BankName],[BankAccNo],[IFSCCode],[Status],[AddedBy],[AddedDate])
       OUTPUT INSERTED.[vendorid]
       VALUES (@name,@mob,@addr1,@addr2,@cityId,@stateId,@pin,@company,@gst,@pan,@aadhar,@bank,@bankAcc,@ifsc,'Y',@user,GETDATE())`;

const NEW_V_INSERT_COLS = `[Name],[Mob],[Addr1],[Addr2],[CityID],[StateID],[Pin],[CompanyName],[GstNo],[PAN],[AadharNo],[BankName],[BankAccNo],[IFSCCode],[VendorEmail],[Status],[AddedBy],[AddedDate])
       OUTPUT INSERTED.[vendorid]
       VALUES (@name,@mob,@addr1,@addr2,@cityId,@stateId,@pin,@company,@gst,@pan,@aadhar,@bank,@bankAcc,@ifsc,@vemail,'Y',@user,GETDATE())`;

if (sv.includes(OLD_V_INSERT_COLS)) { sv = sv.replace(OLD_V_INSERT_COLS, NEW_V_INSERT_COLS); console.log('A2 OK: VendorEmail in INSERT'); }
else console.error('A2 NOT FOUND: INSERT cols');

// A3 – Add VendorEmail param to POST body destructure + params object
const OLD_V_POST_BODY = `const { Name, Mob, Addr1, Addr2, CityID, StateID, Pin, CompanyName, GstNo, PAN, AadharNo, BankName, BankAccNo, IFSCCode } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      \`INSERT INTO [Vendor]`;
const NEW_V_POST_BODY = `const { Name, Mob, Addr1, Addr2, CityID, StateID, Pin, CompanyName, GstNo, PAN, AadharNo, BankName, BankAccNo, IFSCCode, VendorEmail } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      \`INSERT INTO [Vendor]`;

if (sv.includes(OLD_V_POST_BODY)) { sv = sv.replace(OLD_V_POST_BODY, NEW_V_POST_BODY); console.log('A3 OK: VendorEmail in POST destructure'); }
else console.error('A3 NOT FOUND: POST body destructure');

// A4 – Add vemail param to POST params object
const OLD_V_POST_PARAMS = `aadhar: AadharNo || '', bank: BankName || '', bankAcc: BankAccNo || '', ifsc: IFSCCode || '', user
      }
    );
    res.json({ success: true, vendorid: r.recordset[0].vendorid });`;

const NEW_V_POST_PARAMS = `aadhar: AadharNo || '', bank: BankName || '', bankAcc: BankAccNo || '', ifsc: IFSCCode || '',
        vemail: VendorEmail || '', user
      }
    );
    res.json({ success: true, vendorid: r.recordset[0].vendorid });`;

if (sv.includes(OLD_V_POST_PARAMS)) { sv = sv.replace(OLD_V_POST_PARAMS, NEW_V_POST_PARAMS); console.log('A4 OK: vemail param in POST'); }
else console.error('A4 NOT FOUND: POST params');

// A5 – Add VendorEmail to PUT UPDATE SET + params
const OLD_V_PUT_BODY = `const { Name, Mob, Addr1, Addr2, CityID, StateID, Pin, CompanyName, GstNo, PAN, AadharNo, BankName, BankAccNo, IFSCCode } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      \`UPDATE [Vendor] SET [Name]=@name,[Mob]=@mob,[Addr1]=@addr1,[Addr2]=@addr2,
       [CityID]=@cityId,[StateID]=@stateId,[Pin]=@pin,[CompanyName]=@company,
       [GstNo]=@gst,[PAN]=@pan,[AadharNo]=@aadhar,[BankName]=@bank,
       [BankAccNo]=@bankAcc,[IFSCCode]=@ifsc,[ModifyBy]=@user,[DateModify]=GETDATE()
       WHERE [vendorid]=@id\``;

const NEW_V_PUT_BODY = `const { Name, Mob, Addr1, Addr2, CityID, StateID, Pin, CompanyName, GstNo, PAN, AadharNo, BankName, BankAccNo, IFSCCode, VendorEmail } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      \`UPDATE [Vendor] SET [Name]=@name,[Mob]=@mob,[Addr1]=@addr1,[Addr2]=@addr2,
       [CityID]=@cityId,[StateID]=@stateId,[Pin]=@pin,[CompanyName]=@company,
       [GstNo]=@gst,[PAN]=@pan,[AadharNo]=@aadhar,[BankName]=@bank,
       [BankAccNo]=@bankAcc,[IFSCCode]=@ifsc,[VendorEmail]=@vemail,
       [ModifyBy]=@user,[DateModify]=GETDATE()
       WHERE [vendorid]=@id\``;

if (sv.includes(OLD_V_PUT_BODY)) { sv = sv.replace(OLD_V_PUT_BODY, NEW_V_PUT_BODY); console.log('A5 OK: VendorEmail in PUT'); }
else console.error('A5 NOT FOUND: PUT body');

// A6 – Add vemail to PUT params object
const OLD_V_PUT_PARAMS = `aadhar: AadharNo || '', bank: BankName || '', bankAcc: BankAccNo || '',
        ifsc: IFSCCode || '', user, id: parseInt(req.params.id)`;

const NEW_V_PUT_PARAMS = `aadhar: AadharNo || '', bank: BankName || '', bankAcc: BankAccNo || '',
        ifsc: IFSCCode || '', vemail: VendorEmail || '', user, id: parseInt(req.params.id)`;

if (sv.includes(OLD_V_PUT_PARAMS)) { sv = sv.replace(OLD_V_PUT_PARAMS, NEW_V_PUT_PARAMS); console.log('A6 OK: vemail param in PUT'); }
else console.error('A6 NOT FOUND: PUT params');

fs.writeFileSync('server.js', sv);
console.log('server.js written');
