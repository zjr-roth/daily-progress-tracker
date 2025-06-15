import { supabase } from './supabase'

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  static async signUp({ email, password, fullName }: SignUpData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      if (error.message.includes('weak password')) {
        throw new Error('Password is too weak. Please choose a stronger password.');
      }
      throw error;
    }
    return data
  }

  static async signIn({ email, password }: SignInData) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        // This is the generic error for wrong email OR wrong password.
        throw new Error('Invalid credentials');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please verify your email to sign in.');
      }
      // Fallback for any other errors (e.g., network issues)
      throw new Error('Sign in failed. Please try again.');
    }

    return data
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }

  static async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  }

  static onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)
    })
  }

  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      if (error.message.includes('email') || error.message.includes('not found')) {
        throw new Error('No account found with this email address.');
      }
      throw error;
    }
  }

  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) {
      if (error.message.includes('weak password')) {
        throw new Error('Password is too weak. Please choose a stronger password.');
      }
      throw error;
    }
  }

  static async resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })
    if (error) throw error;
  }
}