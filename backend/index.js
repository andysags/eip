require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js'); // Import Supabase client

const app = express();
const port = 4000;
const cors = require('cors');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Middleware
app.use(cors()); // Accepte toutes les origines pour faciliter le déploiement sur Vercel
app.use(express.json());

// Logger simple pour déboguer sur Vercel
app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
});

// Vérification de la configuration Supabase
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Supabase environment variables are missing!');
    // On ne bloque pas tout de suite, mais on retourne une erreur sur les routes concernées
}

// Import and use authentication routes
const authRoutes = require('./routes/auth')(supabase); 
app.use('/api/auth', authRoutes);

// Import and use product routes
const productRoutes = require('./routes/products')(supabase);
app.use('/api/products', productRoutes);

// Import and use order routes
const orderRoutes = require('./routes/orders')(supabase);
app.use('/api/orders', orderRoutes);

// Import and use upload routes
const uploadRoutes = require('./routes/upload')(supabase);
app.use('/api/upload', uploadRoutes);

// Import and use clarity admin routes
const clarityRoutes = require('./routes/clarity')(supabase);
app.use('/api/admin', clarityRoutes);

// Import and use tracking routes (clicks + PMF)
const trackRoutes = require('./routes/track')(supabase);
app.use('/api/track', trackRoutes);

// Serve static assets from the 'assets' directory
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Serve HTML files from the root directory safely
app.use((req, res, next) => {
    if (req.path.endsWith('.html')) {
        res.sendFile(path.join(__dirname, '../', req.path), (err) => {
            if (err) next(); 
        });
    } else {
        next();
    }
});

// Catch-all route 
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
      return res.status(404).json({ 
          error: 'Route API introuvable', 
          path: req.path,
          method: req.method
      });
  }
  // En production sur Vercel, les fichiers statiques sont gérés par Vercel lui-même
  // On ne sert l'index.html que si on est convaincu que c'est une route frontend
  res.sendFile(path.join(__dirname, '../', 'index.html'), (err) => {
      if (err) {
          res.status(404).send('Not Found');
      }
  });
});

// Export the app for Vercel
module.exports = app;

// Only listen if the script is run directly (local development)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`EIP backend listening at http://localhost:${port}`);
    console.log(`Supabase URL: ${supabaseUrl ? 'Configured' : 'NOT CONFIGURED'}`);
  });
}
