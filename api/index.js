require('dotenv').config();

const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
const port = 4000;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Middleware
app.use(cors()); 
app.use(express.json());

// Logger
app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
});

// Routes - Now relative to /api directory
const authRoutes = require('../backend/routes/auth')(supabase); 
app.use('/api/auth', authRoutes);

const productRoutes = require('../backend/routes/products')(supabase);
app.use('/api/products', productRoutes);

const orderRoutes = require('../backend/routes/orders')(supabase);
app.use('/api/orders', orderRoutes);

const uploadRoutes = require('../backend/routes/upload')(supabase);
app.use('/api/upload', uploadRoutes);

const clarityRoutes = require('../backend/routes/clarity')(supabase);
app.use('/api/admin', clarityRoutes);

const trackRoutes = require('../backend/routes/track')(supabase);
app.use('/api/track', trackRoutes);

// Catch-all route for API
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
      return res.status(404).json({ 
          error: 'Route API introuvable', 
          path: req.path,
          method: req.method
      });
  }
  // En production sur Vercel, les fichiers statiques (HTML/JS) sont servis directement.
  // Ce catch-all ne devrait être atteint que pour des routes inconnues.
  res.status(404).send('Not Found');
});

// Export the app for Vercel
module.exports = app;

// Local development
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Backend local listening at http://localhost:${port}`);
  });
}
