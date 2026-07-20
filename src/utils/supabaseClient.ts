import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

// Validar si las credenciales están configuradas correctamente por el usuario
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Obtiene el PIN de seguridad configurado.
 * Primero intenta consultar de Supabase si está disponible, con fallback a localStorage y al valor por defecto "151224".
 */
export async function getSecurityPin(): Promise<string> {
  const defaultPin = '151224';
  if (!isSupabaseConfigured || !supabase) {
    return localStorage.getItem('security_pin') || defaultPin;
  }
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'security_pin')
      .single();
    if (!error && data && data.value) {
      localStorage.setItem('security_pin', data.value);
      return data.value;
    }
  } catch (e) {
    console.warn('Error fetching security_pin from Supabase, using local fallback:', e);
  }
  return localStorage.getItem('security_pin') || defaultPin;
}
