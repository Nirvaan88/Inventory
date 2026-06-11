# KISNA Inventory Management System - Overview

## Project Summary
The **KISNA Inventory Management System** is a comprehensive, full-stack web application designed to manage the entire lifecycle of jewelry inventory. It provides a centralized platform for handling purchase orders, stock inwards, stock issues, returns, and comprehensive reporting. The system is built with a focus on ease of use, robust data validation, and real-time inventory tracking.

## Technology Stack
- **Frontend**: 
  - HTML5, CSS3 (Vanilla, custom UI/UX design)
  - JavaScript (Vanilla JS, Single Page Application architecture)
  - Font Awesome (Icons)
  - SheetJS (XLSX parsing/exporting)
- **Backend**: 
  - Node.js (Runtime environment)
  - Express.js (Web application framework)
  - `msnodesqlv8` / `mssql` (SQL Server connection)
  - `express-session` & `session-file-store` (Session management)
  - `nodemailer` (Automated email notifications)
- **Database**: 
  - Microsoft SQL Server
- **Deployment/Infrastructure**: 
  - AWS EC2 (Ubuntu Linux)
  - PM2 (Process manager for Node.js)
  - Nginx (Reverse proxy & SSL termination)
  - Let's Encrypt / Self-Signed SSL (HTTPS support)

## Architecture
The application follows a standard **Client-Server architecture**. 
1. **Client**: A Single Page Application (SPA) built with pure JavaScript that dynamically fetches and renders data without full page reloads.
2. **Server**: An Express.js REST API that handles authentication, business logic, email dispatching, and database interactions.
3. **Database**: A relational SQL Server database storing all master data, transactions, and audit logs.

## Core Modules

### 1. Dashboard
A real-time analytics hub displaying key metrics such as Total Items, Vendors, Dealers, Issue Transactions, Inward Transactions, Low Stock Alerts, and Dead Stock Items.

### 2. Masters (Data Setup)
The foundation of the system. This module allows administrators to manage core entities like Items, Categories, Vendors, Dealers, Departments, and System Users. It ensures data consistency across all transactions.

### 3. Transactions (Inventory Lifecycle)
The operational core of the system.
- **Purchase Orders (Order Items)**: Creating and managing orders sent to vendors.
- **Purchase Inward**: Receiving stock against purchase orders, automatically updating the master stock.
- **Return Issue Pending**: Processing defective or incorrect items returned to vendors.
- **Issue Items**: Issuing stock to departments, individuals, or dealers.
- **Issue Returns**: Receiving unused or returned items back into the main inventory.

### 4. Reports & AI Insights
- **Standard Reports**: Detailed logs of Challans, Item Stock, and overall Inventory movements.
- **AI Insights**: Smart features like the **Smart Order Suggestions** (flagging items low in stock and orders can be placed via the same with a click), **Dead Stock Identifier** (flagging slow-moving inventory) and **Vendor Scorecard** (evaluating vendor performance based on delivery times, return rates, and order fulfillment).

## Key Features
- **Secure Authentication**: Session-based login system ensuring unauthorized users cannot access the portal.
- **Environment Agnostic**: Seamlessly switches between Windows Authentication (for local development) and SQL Server Authentication (for AWS production) using environment variables.
- **Automated Emailing**: Automatically sends stylized HTML emails to vendors when Purchase Orders are generated or when delivery tracking IDs are updated.
- **Excel Export/Import**: Bulk download and upload capabilities for reporting and data entry.
- **Dark/Light Mode**: A responsive, themeable UI for better user experience.
