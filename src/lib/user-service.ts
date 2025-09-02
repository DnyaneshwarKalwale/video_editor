import { supabase, TABLES } from '@/lib/supabase';

export async function createUser(userData: {
  email: string;
  name: string;
  companyDomain: string;
  password?: string;
  googleId?: string;
  isAdmin?: boolean;
}) {
  try {
    const { data: user, error } = await supabase
      .from(TABLES.USERS)
      .insert({
        email: userData.email,
        name: userData.name,
        company_domain: userData.companyDomain,
        password: userData.password,
        google_id: userData.googleId,
        is_admin: userData.isAdmin || false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function findUserByEmail(email: string) {
  try {
    const { data: user, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return user;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
}

export async function findUserById(id: string) {
  try {
    const { data: user, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return user;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
}

export async function updateUser(id: string, updateData: any) {
  try {
    const { data: user, error } = await supabase
      .from(TABLES.USERS)
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}
