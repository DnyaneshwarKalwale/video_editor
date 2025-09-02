const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://xwhezwlbxtkirkroofer.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupOTPTable() {
  try {
    console.log('🚀 Setting up OTP table...');

    // Create OTP table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS otp_codes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email TEXT NOT NULL,
          otp TEXT NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          attempts INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createError) {
      console.log('ℹ️  OTP table might already exist, trying alternative approach...');
      
      // Try direct SQL execution
      const { error: directError } = await supabase
        .from('otp_codes')
        .select('id')
        .limit(1);
      
      if (directError) {
        console.error('❌ Failed to create OTP table:', directError);
        console.log('💡 Please run this SQL manually in Supabase SQL Editor:');
        console.log(`
          CREATE TABLE IF NOT EXISTS otp_codes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email TEXT NOT NULL,
            otp TEXT NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            attempts INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
          CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);
        `);
        return;
      }
    }

    // Create indexes
    console.log('📊 Creating indexes...');
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
          CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);
        `
      });
    } catch (indexError) {
      console.log('ℹ️  Indexes might already exist or will be created automatically');
    }

    console.log('✅ OTP table setup completed successfully!');
    console.log('🎯 You can now test OTP functionality with persistent storage');

  } catch (error) {
    console.error('❌ Error setting up OTP table:', error);
    console.log('💡 Please run the SQL manually in Supabase SQL Editor');
  }
}

// Run the setup
setupOTPTable();