import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// Campaigns endpoints
app.get('/api/campaigns', async (req, res) => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) return res.status(400).json({ error });
  res.json(data);
});

app.post('/api/campaigns', async (req, res) => {
  const { data, error } = await supabase
    .from('campaigns')
    .insert([req.body])
    .select()
    .single();
  
  if (error) return res.status(400).json({ error });
  res.json(data);
});

app.put('/api/campaigns/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('campaigns')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  
  if (error) return res.status(400).json({ error });
  res.json(data);
});

app.delete('/api/campaigns/:id', async (req, res) => {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', req.params.id);
  
  if (error) return res.status(400).json({ error });
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});