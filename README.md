# 📜 PixeLedger OS // Vintage Slate Edition

A lightweight, local-first vintage slate productivity layout designed for distraction-free text drafting, localized workspace organization, and automated file logging routines.

## 🚀 Live Demo
You can access the live web application here: **https://mantasha1501.github.io/pixeledger-os/**

## 🎨 System Overview
PixeLedger OS provides an immersive, retro-inspired operating system aesthetic using a unified slate blue and parchment palette. Built completely with raw, dependency-free frontend web technologies, it features a focused, screen-wide editing canvas removing all live-rendered visual noise to keep your focus strictly on structural writing.

## ⚙️ Core Modules & Application Features

### 📝 1. Canvas Writer Workspace
* **Full-Width Canvas Grid:** The side-by-side split rendering has been completely decoupled. The plain-text textarea fills the entire view grid for a focused typing environment.
* **Triple Slot Drafting Buffer:** Swap state contexts seamlessly across Slot 01, Slot 02, and Slot 03.
* **Flexible Layout Constraints:** Enforce optional hard character-cap rules (e.g., 140-char Micro Log, 450-char Standard Document) and switch margin indentation rules (Wide Screen Edge vs. Narrow Book Center).
* **Keyboard Timestamp Hook:** Press `Ctrl + T` (or `Cmd + T`) within the canvas fields to instantly inject a formatted date-time string line break.

### 🗂️ 2. Index Directory Matrix
* **Chronological Feeds:** Save drafts directly to localized application states structured inside historical database tables.
* **Live Search Indexing:** Type instantly into the filter search shelf to query matching keyword parameters across both custom titles and underlying document strings simultaneously.
* **Retroactive Hindsight Annotation:** Select archived historical entries to write independent hindsight side-notes mapping to that precise ID pointer without breaking the immutable baseline sheet data.

### 📖 3. Deep Review Desk
* **Inspection Layout:** Opens literal text layouts exactly as formatted inside your active workspace with custom headings and side-note mirrors attached.

### ⚙️ 4. Security Vault & HTML5 Direct Linking
* **Gatekeeper Mask:** Secure systemic initialization requiring local password string validation tokens to mount or unmount background data pools.
* **Automated Folder Syncing Pipeline:** Leverages native web system APIs (`showDirectoryPicker`) to securely request direct write access to a folder on your computer. When active, saving an entry logs data locally to browser state arrays *and* exports an automated plain `.txt` file straight to your desktop filesystem in the background.
* **Database Management:** Manual JSON database package export snapshots, system restorations via backup file uploads, and storage array purges.

## 🛠️ Technology Stack
* **Markup:** Semantic HTML5 Structure
* **Styling:** Vanilla CSS3 Layouts, Root Color Variables, Pixelated Image Rendering
* **Typography:** `Press Start 2P` via Google Fonts Engine
* **Logic Environment:** Pure Vanilla JavaScript (Native LocalStorage Management & Async FileSystem Access APIs)

## 📁 Repository Blueprint
```text
├── index.html     # Application structures, navigational nodes, and viewport modals
├── style.css      # Retro OS canvas stylings, color matrices, and layout media rules
├── script.js      # Vault authentication layers, slot swappers, and pipeline controllers
└── README.md      # System documentation handbook
