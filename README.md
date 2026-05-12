# VeltrixaFX Institutional Trading Platform

![VeltrixaFX Platform](frontend/assets/image_5b30507201.jpg)

VeltrixaFX is a state-of-the-art, institutional-grade web trading terminal designed for professional traders, financial analysts, and quantitative firms. Featuring a sleek, dark-mode cyber-industrial aesthetic, the platform integrates robust market analytics, biometric KYC, wallet management, and AI-driven copy trading into one unified ecosystem.

## Features

- **Professional Trading Terminal**: Advanced charting, real-time order books, and high-speed execution interfaces.
- **Copy Trading & Social Finance**: Replicate the portfolios of elite institutional traders with comprehensive risk metrics.
- **Unified Verification Hub**: High-fidelity, biometric-enabled KYC onboarding flows.
- **Institutional Analytics**: Deep AI insights, currency strength meters, and real-time market pulse feeds.
- **Wallet & Fund Management**: Secure deposit, withdrawal, and robust transaction reporting workflows.
- **Automated Asset Management**: Built-in Python scripts (`download_images.py`, `update_links.py`) to scrape, hash, localize, and map external resources securely.

## Tech Stack

- **Frontend**: HTML5, Vanilla JS
- **Styling**: Tailwind CSS (via CDN with custom Configuration), CSS Grid, Flexbox
- **Typography**: Google Fonts (Geist, JetBrains Mono)
- **Icons**: Google Material Symbols

## Local Development

The project requires no build tools or package managers. Everything runs purely via HTML and CSS.

### 1. View the Application
Open `frontend/emerald_obsidian_edition.html` in any modern web browser to start exploring the platform. All navigation paths are pre-wired.

### 2. Updating Assets & Links
If you add new pages or external images, use the provided Python scripts in the `frontend` directory:

```bash
# Localize external images and hash them for deduplication
python download_images.py

# Auto-wire internal links and map buttons dynamically
python update_links.py
```

## Structure

- `/frontend` - Core application directory
- `/frontend/assets` - Localized images and media
- `/frontend/*.html` - Individual platform views and terminals

## License
Proprietary Software. All rights reserved.
