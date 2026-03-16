const express = require('express');
const router = express.Router();

module.exports = (supabase) => {
  // Registration endpoint (already exists)
  router.post('/register', async (req, res) => {
    const { name, email, password, user_type } = req.body; // user_type: 'client' or 'loueur'

    if (!name || !email || !password || !user_type) {
      return res.status(400).json({ error: 'Name, email, password, and user type are required.' });
    }

    if (!['client', 'loueur'].includes(user_type)) {
      return res.status(400).json({ error: 'Invalid user type. Must be "client" or "loueur".' });
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            user_type: user_type, // Store user_type in user metadata
            name: name, // Store name in user metadata
          },
        },
      });

      if (error) {
        console.error('Supabase signup error:', error);
        return res.status(400).json({ error: error.message });
      }

      res.status(200).json({ message: 'User registered successfully. Please check your email for verification.', user: data.user });

    } catch (err) {
      console.error('Server error during signup:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // Login endpoint (already exists)
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Supabase login error:', error);
        return res.status(401).json({ error: error.message }); // 401 Unauthorized
      }

      res.status(200).json({ message: 'Logged in successfully.', session: data.session, user: data.user });

    } catch (err) {
      console.error('Server error during login:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // New Logout endpoint
  router.post('/logout', async (req, res) => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Supabase logout error:', error);
        return res.status(400).json({ error: error.message });
      }

      res.status(200).json({ message: 'Logged out successfully.' });

    } catch (err) {
      console.error('Server error during logout:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  return router;
};