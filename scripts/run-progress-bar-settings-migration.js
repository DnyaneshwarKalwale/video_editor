const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting progress bar settings migration...');
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'add-progress-bar-settings-column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Results:', data);
    
    // Verify the migration
    const { data: users, error: verifyError } = await supabase
      .from('users')
      .select('id, progress_bar_settings')
      .limit(5);
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('🔍 Sample users with progress bar settings:');
      users.forEach(user => {
        console.log(`- User ${user.id}: ${user.progress_bar_settings ? 'Has settings' : 'No settings'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
