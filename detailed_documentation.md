# KISNA Inventory Management System - Detailed Documentation

## 1. Technical Architecture & Stack

### Frontend
- **Architecture**: Single Page Application (SPA). The `index.html` loads the core `app.js` and various page modules (`pages-masters.js`, `pages-transactions.js`, etc.). Routing is handled client-side via `navigateTo(page)` function.
- **Styling**: Vanilla CSS (`style.css`) with CSS variables for a comprehensive Light/Dark mode theme system.
- **Dependencies**: 
  - Font Awesome for icons.
  - SheetJS (`xlsx`) for exporting data from tables to Excel files.
- **State Management**: A global `State` object stores the current user session and UI state.

### Backend
- **Framework**: Node.js with Express.js.
- **Database Connection**: Uses `mssql` and `msnodesqlv8` for reliable connectivity to Microsoft SQL Server. Supports both Windows Authentication (Local Dev) and SQL Server Auth (Production AWS).
- **Session Management**: Uses `express-session` backed by `session-file-store` to ensure sessions persist across server restarts. Cookies are set with `SameSite: 'lax'` for modern browser compatibility.
- **Environment**: Configured via `.env` and PM2 `ecosystem.config.js`.

### Deployment Environment
- **Server**: AWS EC2 instance running Ubuntu.
- **Process Manager**: PM2 handles the Node.js process.
- **Web Server / Reverse Proxy**: Nginx handles incoming port 80/443 traffic, terminates SSL, and forwards requests to the Node application on port 3000.
- **Security**: Self-signed or Let's Encrypt SSL Certificates used for HTTPS ensuring data transmission is encrypted and bypassing strict corporate firewalls.

---

## 2. Dashboard
The landing page upon login. It aggregates real-time data from various tables to give a bird's eye view of the inventory.
- **Total Items**: Count of active items in the `Item` table.
- **Vendors**: Count of active vendors in the `Vendor` table.
- **Dealers**: Count of active dealers in the `DealerMaster` table.
- **Issue Transactions**: Total number of Issue operations performed.
- **Inward Transactions**: Total number of Inward operations performed.
- **Low Stock Items**: Identifies items where current `Stock` is less than or equal to the `ReorderLevel`. Provides a quick table view of these items.
- **Dead Stock Items**: Items that haven't been issued or moved recently.

---

## 3. Masters (Data Configuration)
Masters form the building blocks. Transactions depend entirely on the data configured here. Every master screen supports **Adding, Editing, Deleting, Bulk Deleting, and Exporting to Excel**.

### Division
- **Purpose**: Represents divisions of the company.
- **Columns**: Division ID, Division Name, Status, Added By/Date, Modify By/Date.

### Department
- **Purpose**: Represents internal departments requesting inventory (e.g., HR, Sales, IT).
- **Columns**: DepId, DepName.

### Product Category
- **Purpose**: Groups items (e.g., Electronics, Stationery, Packaging) tied to a Division.
- **Columns**: CategoryId, CategoryName, DivisionId.

### State & City
- **Purpose**: Geographical mapping used primarily for Dealer and Vendor locations.
- **Columns**: StateId, StateName, CityId, CityName.

### Kisna Region State
- **Purpose**: Custom regional demarcations specific to business operations.
- **Columns**: RegionId, RegionName.

### Category / Item Code
- **Purpose**: Shortcodes for categories/items for easier search and billing integration.

### Item Master
- **Purpose**: The core catalogue. Defines every piece of inventory the system handles.
- **Key Columns**:
  - `ItemId`, `ItemName`
  - `CategoryId`: Links item to a specific category.
  - `Stock`: The current available quantity in the warehouse.
  - `ReorderLevel`: Threshold at which the system flags the item as "Low Stock".
  - `ReorderQty`: Recommended quantity to order when stock is low.

### Vendor Details
- **Purpose**: Companies or individuals from whom inventory is purchased.
- **Key Columns**: `VendorId`, `Name`, `CompanyName`, `VendorEmail` (used for automated PO dispatch), `Mobile`, Address fields.

### Dealer Master
- **Purpose**: Stores or franchises to whom inventory is issued/sold.
- **Key Columns**: `DealerID`, `DealerCompanyName`, `ContactPersonName`, `Email`, `Mobile`, `GST`.

### Courier Details
- **Purpose**: Logistics partners used for dispatching Issue items.
- **Columns**: `CourierId`, `CourierName`.

### Kit Master
- **Purpose**: Pre-defined bundles of items. Useful for issuing standard sets (e.g., a "New Joiner Kit" containing a laptop, notebook, and pen).

### Item-Vendor Mapping
- **Purpose**: Defines which items can be procured from which vendors.
- **Usage**: Used to filter dropdowns dynamically when creating Purchase Orders.

### Login & User Master
- **Purpose**: System access control. Defines user roles (e.g., Admin, Viewer).
- **Security**: Passwords are securely hashed using `bcryptjs` before being stored in the database.

---

## 4. Transactions (Inventory Movement)

### Order Items (Purchase Order - PO)
- **Purpose**: Creating a formal request to a vendor to supply items.
- **Process**:
  1. Select Vendor and Division.
  2. Add Items (filtered by vendor mapping), specifying `Qty`.
  3. On submit, an order is generated in the `Order` and `OrderItem` tables.
  4. **Automation**: An HTML-stylized email is automatically generated and sent to the `VendorEmail` via `nodemailer` detailing the PO. Further, if the order is updated, an email is shot stating the same (explicitly highlighting the updated items)

### Purchase Inward
- **Purpose**: Receiving goods against a previously raised Purchase Order.
- **Process**:
  1. Input `OrderNumber`, `DCNumber` (Delivery Challan), and `InvoiceNumber`.
  2. Enter the received quantities (`TotalQty`, `DCQty`).
  3. If items are defective or short received, they are marked as `RP` (Return Pending) or `SP` (Scrap Pending).
  4. **Stock Update**: The `Stock` field in the `Item` master is incremented based on the received quantity.

### Inward Return Pending
- **Purpose**: Managing items that were marked as `RP` or `SP` during the Purchase Inward phase.
- **Process**:
  1. Shows all items pending return to the vendor.
  2. User inputs courier tracking details and updates the status of the respective item(s) as `Completed` or `Return complete`.

### Issue Items
- **Purpose**: Dispatching inventory from the warehouse to Departments or Dealers.
- **Process**:
  1. Select recipient (Department or Dealer).
  2. Input delivery mode (Hand Delivery or Courier).
  3. Select items to issue and specify `RequestQty` and `IssueQty`.
  4. **Stock Update**: The `Stock` field in the `Item` master is decremented.

### Issue Pending Items
- **Purpose**: Tracking requested items that could not be fully fulfilled due to low stock.
- **Process**: Allows the warehouse manager to fulfill the remaining balance of an issue request once new stock arrives.

### Return Issue Item
- **Purpose**: Receiving unused or excess items back from a Department or Dealer.
- **Process**: Re-adds the returned quantity back to the master `Stock` if only the condition of the item in question is Good/Satisfactory, in this case the status of the same is updated to `Complete`

### Return Issues Pending
- **Purpose**: Decision on the items that were returned from a Department or Dealer which are pending to be returned to vendor.
- **Process**: If re-adding the returned quantity back to the master `Stock`, then the status of the same is updated to `Complete`. If not in good condition, the status is updated to `Scrap Complete` and if the items need to be returned to the vendor then the status is updated to `Return complete`.

---

## 5. Reports

### Challan Report
- Generates a formal Delivery Challan for issued items. Useful for gate passes and logistics tracking.

### View Items Stock 
- Provides detailed, filterable views of current inventory levels across all categories and divisions.

### Inventory Report (Inward & Outward)
- Complete audit trails showing when items came in (Inward) and when they went out (Issue) between specific date ranges.

---

## 6. AI Insights & Advanced Analytics

### Dead Stock Identifier
- **Purpose**: Identifies capital tied up in non-moving inventory.
- **Logic**: Analyzes `InwardItem` and `IssueItem` history to find items that have high stock but haven't been issued over a specified period (e.g., 6 months).

### Vendor Scorecard
- **Purpose**: Evaluates vendor performance.
- **Metrics Tracked**:
  - **Fulfillment Rate**: How much of the requested order quantity was actually delivered.
  - **Rejection Rate**: Percentage of inwarded items marked as scrap/return item.
  - **Timeliness**: Evaluates the gap between the `OrderDate` and the `InwardDate`.

### Smart Order Suggestions
- **Purpose**: To suggest items to place order to the vendor based on the ReorderLevel and ReorderQty.
- **Logic**: Analyzes the Order history and the time frame of the same, and on the basis of it, suggests the items to be placed order to the vendor, before the stock level goes below the ReorderLevel.

---

## 7. Crucial Technical Implementations & Fixes

- **Datetime Standardization**: Solved a critical bug where dates from the frontend (YYYY-MM-DD) were defaulting to midnight (00:00:00.000) on the AWS UTC server. The system now utilizes SQL Server's internal `GETDATE()` time combined with the user's date input via `CAST(@date AS DATETIME) + CAST(CAST(GETDATE() AS TIME) AS DATETIME)` to ensure strictly localized (IST) timestamps are recorded for all transactions.
- **Audit Trails**: Every Master and Transaction table strictly maintains `AddedBy`, `AddedDate`, `ModifyBy`, and `ModifyDate` fields. The backend automatically populates these using the `req.session.user` object and GETDATE().
- **Global Error Handling**: Express middleware captures all internal server errors and formats them into JSON `res.status(500).json({ error: e.message })`, preventing HTML error pages from breaking the frontend SPA routing.
