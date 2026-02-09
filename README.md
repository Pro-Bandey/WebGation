# 🚀 QuickNav Buttons

**QuickNav Buttons** is a lightweight, high-performance Chrome Extension designed to enhance your browsing speed. It provides intelligent, context-aware navigation controls in two distinct modes: **Static** (sleek sidebars) and **Floating** (draggable pill).

![Static Mode Preview](https://via.placeholder.com/800x400?text=QuickNav+Static+Mode+Navigation)

## ✨ Features

- **Dual Modes**: 
    - **Static Mode**: Minimalist red sidebars for Back/Forward and a hidden-until-needed Top Menu for Home/Reload/Close.
    - **Floating Mode**: A fully draggable, glassmorphic pill that can be positioned anywhere on the screen.
- **Smart UI (Auto-Hide)**:
    - Top menus hide automatically when scrolling down to maximize screen real estate and reappear when scrolling up or hovering at the top.
    - Floating controls fade to low opacity when idle.
- **Advanced Tab History**:
    - **Right-click** any Back/Forward button to see a rich history list.
    - Displays actual **Page Titles** (not just URLs) and step indices (e.g., -1, -5).
    - Scoped strictly to the **current tab** for privacy and accuracy.
- **Per-Site Customization**: 
    - Toggle the extension on/off for specific websites.
    - Save unique positions for the floating bar on every site.
- **Native Experience**:
    - Home button redirects to a custom [Online Homepage](https://online-homepage.vercel.app/).
    - Optimized for performance using Manifest V3 and the modern Navigation API.

---

## 🛠️ Installation (Developer Mode)

1.  **Download/Clone** this repository to your local machine.
2.  Open your browser and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** (usually a toggle in the top right corner).
4.  Click **Load unpacked** and select the folder containing the extension files.
5.  QuickNav is now ready! Upon installation, you will be greeted by the [Welcome Page](https://ttiny.ga/tion).

---

## 🖱️ How to Use

### Navigation
*   **Left Click**: Instantly go Back, Forward, Home, Reload, or Close the tab.
*   **Right Click (Back/Forward)**: Opens the **History Menu**. Select a specific page title to jump multiple steps back or forward.

### Static Mode
*   **Sides**: Use the thin red sidebars to navigate.
*   **Top**: Move your mouse to the top 60px of the screen or scroll up to reveal the Home, Reload, and Close buttons.

### Floating Mode
*   **Move**: Click and drag any part of the pill (except buttons) to move it. It will remember its position on that specific website next time you visit.
*   **Idle**: The bar will dim when you aren't using it to stay out of your way.

---

## 📂 Project Structure

- `manifest.json`: Extension configuration (Manifest V3).
- `background.js`: Handles installation/uninstallation and system-level tab creation.
- `content.js`: The bridge between the browser and the page; manages site-specific settings.
- `static.js`: The logic and styling for the sidebar-based UI.
- `floating.js`: The logic and styling for the draggable pill UI.
- `popup.html/js/css`: The settings menu accessible from the browser toolbar.

---

## ⚙️ Technical Details

- **History Management**: Uses the `Navigation API` to access the tab's specific `NavigationHistoryEntry` stack. 
- **Title Syncing**: Employs `sessionStorage` and `MutationObserver` to map history keys to page titles, ensuring the history menu is readable even on complex Single Page Applications (SPAs).
- **Persistence**: Site settings and positions are stored using `chrome.storage.local`.

---

## 🗑️ Uninstallation
We’re sorry to see you go! If you choose to remove the extension, you will be redirected to our [Uninstall Page](https://unintall.ga/tion) where you can provide feedback to help us improve.

---

**Developed for a faster, cleaner web.**