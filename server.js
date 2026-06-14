require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve documentation
app.get('/docs', (req, res) => {
    res.sendFile(__dirname + '/docs/index.html');
});

// Fetch unique agents and models for filters
app.get('/api/filters', async (req, res) => {
    try {
        const { data: agentsData, error: agentsError } = await supabase
            .from('inextokenusage')
            .select('agent_name');
        
        const { data: modelsData, error: modelsError } = await supabase
            .from('inextokenusage')
            .select('model_name');

        if (agentsError || modelsError) throw (agentsError || modelsError);

        const uniqueAgents = [...new Set(agentsData.map(item => item.agent_name))].sort();
        const uniqueModels = [...new Set(modelsData.map(item => item.model_name))].sort();

        res.json({ agents: uniqueAgents, models: uniqueModels });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch dynamic pricing from OpenRouter
app.get('/api/models', async (req, res) => {
    try {
        const response = await axios.get('https://openrouter.ai/api/v1/models');
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching OpenRouter models:', error.message);
        res.status(500).json({ error: 'Failed to fetch model pricing' });
    }
});

// Add new usage data
app.post('/api/usage', async (req, res) => {
    let { agent_name, model_name, input_tokens, output_tokens, total_tokens, cost } = req.body;

    if (!agent_name || !model_name || total_tokens === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Automatically calculate cost if not provided
    if (cost === undefined) {
        try {
            const response = await axios.get('https://openrouter.ai/api/v1/models');
            const models = response.data.data;
            const modelInfo = models.find(m => m.id === model_name);
            
            if (modelInfo) {
                const promptPrice = parseFloat(modelInfo.pricing.prompt) || 0;
                const completionPrice = parseFloat(modelInfo.pricing.completion) || 0;
                cost = (input_tokens * promptPrice) + (output_tokens * completionPrice);
            } else {
                cost = 0; // Fallback if model not found
            }
        } catch (error) {
            console.error('Error calculating dynamic cost:', error.message);
            cost = 0;
        }
    }

    const { data, error } = await supabase
        .from('inextokenusage')
        .insert([{
            agent_name,
            model_name,
            input_tokens,
            output_tokens,
            total_tokens,
            cost: parseFloat(cost).toFixed(8)
        }])
        .select();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data[0]);
});

// Analytics Endpoint
app.get('/api/analytics', async (req, res) => {
    try {
        const { range, start, end, model, agent } = req.query;
        
        let query = supabase
            .from('inextokenusage')
            .select('*')
            .order('created_at', { ascending: false });

        if (model) query = query.eq('model_name', model);
        if (agent) query = query.eq('agent_name', agent);

        const now = new Date();
        if (range === '7days') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            query = query.gte('created_at', sevenDaysAgo.toISOString());
        } else if (range === '30days') {
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            query = query.gte('created_at', thirtyDaysAgo.toISOString());
        } else if (range === 'custom' && start && end) {
            query = query.gte('created_at', start).lte('created_at', end);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Ensure data is an array
        const safeData = data || [];

        const stats = {
            total_cost: 0,
            total_input_tokens: 0,
            total_output_tokens: 0,
            total_tokens: 0,
            avg_cost_per_1m: "0.00",
            input_output_ratio: "0.00",
            models_distribution: {},
            agents_distribution: {},
            usage_trends: {}
        };

        safeData.forEach(entry => {
            const cost = parseFloat(entry.cost) || 0;
            const input = parseInt(entry.input_tokens) || 0;
            const output = parseInt(entry.output_tokens) || 0;
            const total = parseInt(entry.total_tokens) || 0;
            const m_name = entry.model_name || 'unknown';
            const a_name = entry.agent_name || 'unknown';

            stats.total_cost += cost;
            stats.total_input_tokens += input;
            stats.total_output_tokens += output;
            stats.total_tokens += total;

            stats.models_distribution[m_name] = (stats.models_distribution[m_name] || 0) + total;
            stats.agents_distribution[a_name] = (stats.agents_distribution[a_name] || 0) + total;

            const date = entry.created_at ? entry.created_at.split('T')[0] : 'unknown';
            stats.usage_trends[date] = (stats.usage_trends[date] || 0) + total;
        });

        if (stats.total_tokens > 0) {
            stats.avg_cost_per_1m = ((stats.total_cost / stats.total_tokens) * 1000000).toFixed(4);
        }
        if (stats.total_output_tokens > 0) {
            stats.input_output_ratio = (stats.total_input_tokens / stats.total_output_tokens).toFixed(2);
        }

        res.json({
            all_logs: safeData, 
            stats,
            charts: {
                models: stats.models_distribution,
                agents: stats.agents_distribution,
                trends: stats.usage_trends
            }
        });
    } catch (err) {
        console.error('Analytics Error:', err.message);
        res.status(500).json({ 
            error: err.message,
            raw_data: [],
            all_logs: [],
            stats: { total_cost: 0, total_tokens: 0, avg_cost_per_1m: "0.00", input_output_ratio: "0.00" },
            charts: { models: {}, agents: {}, trends: {} }
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
