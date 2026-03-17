const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

// On n'a pas besoin de dotenv en production sur Vercel, mais on le garde pour le local
try {
    require('dotenv').config();
} catch (e) {}

const app = express();
const port = 4000;

// Middleware de base
app.use(cors()); 
app.use(express.json());

// Diagnostic endpoint intégré
app.get('/api/health', (req, res) => {
  res.json({ 
    status: "ok", 
    env: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
        nodeEnv: process.env.NODE_ENV
    }
  });
});

// Initialisation sécurisée de Supabase et des routes
app.use((req, res, next) => {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            return res.status(500).json({ 
                error: "Variables d'environnement Supabase manquantes dans le dashboard Vercel",
                details: "Assurez-vous d'avoir SUPABASE_URL et SUPABASE_ANON_KEY dans Settings -> Environment Variables"
            });
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // On injecte supabase dans l'objet req pour les routes
        req.supabase = supabase;
        next();
    } catch (err) {
        res.status(500).json({ error: "Erreur d'initialisation Supabase", message: err.message });
    }
});

// Chargement dynamique des routes pour isoler les erreurs de require
app.use('/api/auth', (req, res, next) => {
    try {
        require('../backend/routes/auth')(req.supabase)(req, res, next);
    } catch (err) {
        res.status(500).json({ error: "Erreur chargement routes Auth", details: err.message });
    }
});

app.use('/api/products', (req, res, next) => {
    try {
        require('../backend/routes/products')(req.supabase)(req, res, next);
    } catch (err) {
        res.status(500).json({ error: "Erreur chargement routes Products", details: err.message });
    }
});

app.use('/api/orders', (req, res, next) => {
    try {
        require('../backend/routes/orders')(req.supabase)(req, res, next);
    } catch (err) {
        res.status(500).json({ error: "Erreur chargement routes Orders", details: err.message });
    }
});

app.use('/api/upload', (req, res, next) => {
    try {
        require('../backend/routes/upload')(req.supabase)(req, res, next);
    } catch (err) {
        res.status(500).json({ error: "Erreur chargement routes Upload", details: err.message });
    }
});

app.use('/api/admin', (req, res, next) => {
    try {
        require('../backend/routes/clarity')(req.supabase)(req, res, next);
    } catch (err) {
        res.status(500).json({ error: "Erreur chargement routes Admin", details: err.message });
    }
});

app.use('/api/track', (req, res, next) => {
    try {
        require('../backend/routes/track')(req.supabase)(req, res, next);
    } catch (err) {
        res.status(500).json({ error: "Erreur chargement routes Track", details: err.message });
    }
});

// Catch-all route for API
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        error: 'Route API introuvable', 
        path: req.originalUrl,
        method: req.method
    });
});

module.exports = app;
