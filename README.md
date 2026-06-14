# INEX Token Analytics Platform

![INEX Style](https://img.shields.io/badge/Style-INEX%20Minimalist-cyan?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Supabase%20%7C%20Chart.js-white?style=for-the-badge)

A high-performance, minimalist AI Token Analytics Platform designed for senior engineers. This "Control Center" provides deep insights into token consumption, costs, and agent efficiency using a high-contrast dark mode aesthetic with neon accents.

## 🚀 Key Features

- **Deep Resource Tracking:** Monitor Input, Output, and Total token volume across your entire AI ecosystem.
- **Dynamic Cost Analysis:** Real-time cost calculations synchronized with **OpenRouter's** live pricing API.
- **Advanced Filtering:** Granular control to isolate data by **Specific Agent**, **Target Model**, or **Custom Date Ranges**.
- **Live Model Intelligence:** Instant "Model Info" cards showing current provider pricing ($ per 1M tokens) when a model is selected.
- **High-Fidelity Visuals:**
    - **Consumption Trend:** Time-series line chart for token growth.
    - **Model Popularity:** Donut chart for distribution analysis.
    - **Agent Performance:** Horizontal bar chart for resource benchmarking.
- **Massive Data Handling:** Built-in stress testing capabilities with a 1,000-row optimized seeding engine.

## 🛠 Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** Supabase (PostgreSQL) with Row-Level Security
- **Frontend:** Vanilla JS (ES6+), Tailwind CSS (Aesthetic), Chart.js (Visualization)
- **API Integration:** OpenRouter Model Pricing API

## 📋 Prerequisites

- Node.js (v18+)
- A Supabase Project (PostgreSQL)

## ⚙️ Installation & Setup

1. **Clone the Repository:**
   ```bash
   git clone <repository-url>
   cd Tokens_Usage
   ```

2. **Environment Configuration:**
   Create a `.env` file in the root directory:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   PORT=3000
   ```

3. **Database Migration:**
   Execute the code within `schema.sql` in your Supabase SQL Editor to create the `inextokenusage` table.

4. **Install Dependencies:**
   ```bash
   npm install
   ```

5. **Seed Test Data (1,000 Rows):**
   This will clear the database and add 1,000 rows across target models using live pricing.
   ```bash
   npm run seed
   ```

6. **Launch Platform:**
   ```bash
   npm start
   ```

## 🔌 API Reference

### Analytics
- `GET /api/analytics`: Returns processed stats and chart data. 
  - *Query Params:* `range` (all|7days|30days|custom), `agent`, `model`, `start`, `end`.
- `GET /api/filters`: Returns all unique agents and models for UI population.
- `GET /api/models`: Fetches live pricing data from OpenRouter.

### Data Injection
- `POST /api/usage`: Record a new token transaction.
  - *Body:* `{ agent_name, model_name, input_tokens, output_tokens, total_tokens, cost? }`
  - *Note:* If `cost` is omitted, the system automatically calculates it using live API rates.

## 📐 Project Structure

```text
├── public/              # Frontend Assets
│   ├── css/style.css    # Custom INEX Neon Styles
│   ├── js/app.js        # Dashboard Engine
│   ├── js/components.js # UI Components
│   └── index.html       # Main Dashboard (SPA)
├── docs/                # System Documentation
├── server.js            # Express API Server
├── seed.js              # 1000-Row Seeding Engine
└── schema.sql           # Database Migrations
```

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---
**Developed by INEX SYSTEMS**
