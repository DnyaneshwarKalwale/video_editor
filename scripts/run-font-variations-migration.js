#!/usr/bin/env node

/**
 * Migration script to add font_variations column to projects table
 * Run this script to add the missing column to your Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔄 Running font_variations column migration...');
    
    // Add the font_variations column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE projects 
        ADD COLUMN IF NOT EXISTS font_variations JSONB DEFAULT '[]'::jsonb;
      `
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('   - Added font_variations column to projects table');
    console.log('   - Column type: JSONB with default value []');
    
    // Verify the column was added
    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default')
      .eq('table_name', 'projects')
      .eq('column_name', 'font_variations');

    if (verifyError) {
      console.warn('⚠️  Could not verify column creation:', verifyError);
    } else if (columns && columns.length > 0) {
      console.log('✅ Column verification successful:');
      console.log('   - Column name:', columns[0].column_name);
      console.log('   - Data type:', columns[0].data_type);
      console.log('   - Default value:', columns[0].column_default);
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function runMigrationAlternative() {
  try {
    console.log('🔄 Running font_variations column migration (alternative method)...');
    
    // Try to execute the SQL directly
    const { data, error } = await supabase
      .from('projects')
      .select('font_variations')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      // Column doesn't exist, we need to add it
      console.log('📝 Column font_variations does not exist, adding it...');
      
      // Note: This would require a database admin to run the SQL manually
      console.log('⚠️  Manual step required:');
      console.log('   Please run this SQL in your Supabase SQL editor:');
      console.log('   ALTER TABLE projects ADD COLUMN font_variations JSONB DEFAULT \'[]\'::jsonb;');
      
    } else if (error) {
      console.error('❌ Error checking column:', error);
    } else {
      console.log('✅ Column font_variations already exists!');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

// Run the migration
runMigrationAlternative();
