require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const agents = ['Alpha-Agent', 'Beta-Bot', 'Gamma-Assistant', 'Delta-Core', 'Epsilon-Sentinel'];
const TARGET_MODELS = [
    "google/gemini-3.1-flash-lite", 
    "moonshotai/kimi-k2.7-code", 
    "anthropic/claude-fable-5", 
    "minimax/minimax-m3"
];

async function seedData() {
    console.log(`Fetching live pricing for target models from OpenRouter...`);
    
    try {
        const response = await axios.get('https://openrouter.ai/api/v1/models');
        const allModels = response.data.data;
        
        const modelPricings = {};
        TARGET_MODELS.forEach(id => {
            const info = allModels.find(m => m.id === id);
            if (info) {
                modelPricings[id] = {
                    prompt: parseFloat(info.pricing.prompt),
                    completion: parseFloat(info.pricing.completion)
                };
                console.log(`✓ Loaded: ${id} ($${modelPricings[id].prompt * 1000000}/1M)`);
            } else {
                // Fallback for demo if model not found in OpenRouter yet
                modelPricings[id] = { prompt: 0.0000001, completion: 0.0000003 };
                console.log(`! Using fallback for: ${id} (Not found in API)`);
            }
        });

        console.log('Clearing database for 1000-row stress test...');
        await supabase.from('inextokenusage').delete().neq('id', 0);

        const entries = [];
        const now = new Date();

        for (let i = 0; i < 1000; i++) {
            const modelId = TARGET_MODELS[Math.floor(Math.random() * TARGET_MODELS.length)];
            const agent = agents[Math.floor(Math.random() * agents.length)];
            const pricing = modelPricings[modelId];

            const input = Math.floor(Math.random() * 50000) + 500;
            const output = Math.floor(Math.random() * 20000) + 200;
            const total = input + output;
            
            const cost = (input * pricing.prompt) + (output * pricing.completion);
            const date = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);

            entries.push({
                agent_name: agent,
                model_name: modelId,
                input_tokens: input,
                output_tokens: output,
                total_tokens: total,
                cost: cost.toFixed(8),
                created_at: date.toISOString()
            });

            // Batch insert every 200 rows to avoid request limits
            if (entries.length >= 200) {
                await supabase.from('inextokenusage').insert(entries);
                entries.length = 0;
            }
        }

        console.log(`Successfully seeded 1000 entries across 4 models.`);
    } catch (error) {
        console.error('Failed to seed data:', error.message);
    }
}

seedData();
