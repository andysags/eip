const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer to store file in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = (supabase) => {
    const authMiddleware = require('../middleware/authMiddleware')(supabase);

    // POST /api/upload
    // Expects 'file' in form-data
    router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded.' });
            }

            const file = req.file;
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`; // Path inside the bucket

            // Upload to Supabase Storage bucket 'products'
            const { data, error } = await supabase
                .storage
                .from('products')
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (error) {
                console.error('Supabase Storage Error:', error);
                return res.status(500).json({ error: 'Failed to upload image.' });
            }

            // Get Public URL
            const { data: publicUrlData } = supabase
                .storage
                .from('products')
                .getPublicUrl(filePath);

            res.status(200).json({
                message: 'Upload successful',
                url: publicUrlData.publicUrl
            });

        } catch (err) {
            console.error('Server upload error:', err);
            res.status(500).json({ error: 'Internal server error during upload.' });
        }
    });

    return router;
};
