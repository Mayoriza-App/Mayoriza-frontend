import { Injectable } from '@angular/core';
import { AuthStrategy } from '../../interfaces/auth-strategy.interface';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseAuthStrategy implements AuthStrategy {
  private supabase!: SupabaseClient;

  init(): void {
    const url = environment.supabaseUrl;
    const key = environment.supabaseKey;

    if (url && url !== 'REPLACE_WITH_YOUR_SUPABASE_URL' && key && key !== 'REPLACE_WITH_YOUR_SUPABASE_KEY') {
      this.supabase = createClient(url, key);
    } else {
      console.warn('Supabase URL or Key not configured. Authentication will fail.');
    }
  }

  async login(email: string, password: string): Promise<{ token: string; userId: string }> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized. Please configure environment variables.');
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session) {
      throw new Error('No session returned after login');
    }

    return {
      token: data.session.access_token,
      userId: data.user.id
    };
  }

  async logout(): Promise<void> {
    if (this.supabase) {
      await this.supabase.auth.signOut();
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.supabase) return null;
    
    const { data } = await this.supabase.auth.getSession();
    return data.session?.access_token || null;
  }
}
