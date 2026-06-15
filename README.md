# 📊 INEX Token Analytics V2

An ultra-advanced, high-performance dashboard for tracking AI token consumption, model economics, and agent performance.

## 🚀 What's New in V2?

- **Branding Revamp:** Rebuilt with a sleek, high-contrast neon interface.
- **Economic Trends:** Dual-axis charts visualizing Cost vs. Token Throughput.
- **Enhanced Filtering:** Deep-dive analysis with Agent and Model cross-filtration.
- **Live Transaction Stream:** Real-time logging of the last 100 transactions with detailed I/O breakdown.
- **Performance Optimized:** Refined data aggregation engine for lightning-fast analytics.

## 🛠️ Tech Stack

- **Frontend:** HTML5, Tailwind CSS, Chart.js (V2 Engine).
- **Backend:** Node.js, Express.
- **Database:** Supabase (PostgreSQL).
- **Pricing API:** OpenRouter Live Pricing.

## ⚙️ Setup Instructions

1. **Clone & Enter:**
   ```bash
   git clone https://github.com/AmmarBasha2011/Tokens_Usage.git
   cd Tokens_Usage
   ```

2. **Environment Configuration:**
   Create a `.env` file:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   PORT=3000
   ```

3. **Database Setup:**
   Run the code in `schema.sql` within your Supabase SQL Editor.

4. **Install & Launch:**
   ```bash
   npm install
   npm run seed  # Generates 1,000 rows of test data
   # npm start
   ```

---
**Developed by INEX SYSTEMS**
