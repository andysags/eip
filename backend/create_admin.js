const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
// Using Service Role key would be better for admin tasks, but ANON_KEY might work if public signups are enabled for any role.
// Actually, we need to log in or use admin api to set role, but since our trigger handles it via metadata:
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
    console.log("Creating admin user...");
    const { data, error } = await supabase.auth.signUp({
        email: 'admin@eventbenin.bj',
        password: 'AdminPassword2026!',
        options: {
            data: {
                user_type: 'admin',
                name: 'Administrateur Principal'
            }
        }
    });

    if (error) {
        console.error("Error creating admin:", error.message);
    } else {
        console.log("Admin successfully created:", data.user?.email);
        console.log("Email: admin@eventbenin.bj");
        console.log("Password: AdminPassword2026!");
    }
}

createAdmin();
