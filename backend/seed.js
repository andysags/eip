const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Note: For seeding, we might need service role key to bypass RLS or ensure we have a user.
// If using anon key, we'll need to create a user first or use a public insert policy (which we don't have for products).

const supabase = createClient(supabaseUrl, supabaseKey);

const dummyProducts = [
    {
        name: 'Pack Sono Complet 500W (BDD TEST)',
        category: 'sonorisation',
        price: 25000,
        stock: 5,
        image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        description: 'Pack idéal pour les anniversaires et petites fêtes. Comprend 2 enceintes actives 250W, 1 table de mixage 4 canaux, et les câbles nécessaires.',
        is_popular: true
    },
    {
        name: 'Chaise Chiavari Or',
        category: 'mobilier',
        price: 1500,
        stock: 200,
        image: 'https://images.unsplash.com/photo-1503602642458-2321114458ed?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        description: 'L\'élégance par excellence. Chaises Chiavari dorées avec coussin blanc inclus. Parfaites pour les mariages et galas.',
        is_popular: true
    },
    {
        name: 'Chapiteau 100 Personnes',
        category: 'tentes',
        price: 150000,
        stock: 2,
        image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        description: 'Grand chapiteau blanc imperméable. Installation et démontage inclus dans le prix. Dimensions : 10m x 10m.',
        is_popular: true
    },
    {
        name: 'Kit Lumière Ambiance',
        category: 'eclairage',
        price: 30000,
        stock: 10,
        image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        description: 'Créez une atmosphère magique avec ce kit de 4 projecteurs LED RGBW et 1 guirlande de 20m.',
        is_popular: true
    }
];

// We need a helper to create a vendor user if not exists, or get an existing one.
// Since we don't have the service role key available in env (usually), we might face RLS issues if we try to insert directly.
// However, the user provided .env might only have ANON_KEY.
// If RLS is enforced, we can't insert products without being authenticated as a vendor.

async function seed() {
    console.log('Seeding products...');

    // Check if we have users
    // For simplicity, let's try to sign up a seed vendor, or sign in.
    const email = 'seed_vendor@eventbenin.com';
    const password = 'password123';

    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.log('Creating seed vendor...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: 'Seed Vendor',
                    user_type: 'loueur'
                }
            }
        });

        if (signUpError) {
            console.error('Error creating vendor:', signUpError);
            return;
        }
        authData = { session: signUpData.session, user: signUpData.user };
        console.log('Vendor created.');
    } else {
        console.log('Vendor logged in.');
    }

    if (!authData.session) {
        console.error('No session established. Cannot insert products due to RLS.');
        return;
    }

    const vendor_id = authData.user.id;

    // Insert products
    const productsWithVendor = dummyProducts.map(p => ({
        ...p,
        vendor_id
    }));

    const { data, error } = await supabase
        .from('products')
        .insert(productsWithVendor)
        .select();

    if (error) {
        console.error('Error inserting products:', error);
    } else {
        console.log(`Success! Inserted ${data.length} products.`);
    }
}

seed();
