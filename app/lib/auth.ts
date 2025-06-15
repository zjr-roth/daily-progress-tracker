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
      // Enhanced error handling for signup
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      if (error.message.includes('weak password') || error.message.includes('password')) {
        throw new Error('Password is too weak. Please choose a stronger password.');
      }
      if (error.message.includes('invalid email') || error.message.includes('Invalid email')) {
        throw new Error('Please enter a valid email address.');
      }
      if (error.message.includes('rate limit') || error.message.includes('too many')) {
        throw new Error('Too many signup attempts. Please wait a few minutes before trying again.');
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
      console.log('SignIn Error:', error.message); // Debug log

      // Enhanced error handling for specific sign-in scenarios
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('invalid login credentials') ||
          errorMessage.includes('invalid credentials') ||
          errorMessage.includes('email not confirmed')) {

        // Try to determine if it's a password issue or email doesn't exist
        try {
          // Check if user exists by attempting to send a reset email
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });

          if (resetError) {
            // If reset fails, likely email doesn't exist
            if (resetError.message.includes('email') || resetError.message.includes('not found')) {
              throw new Error('An account with this email address was not found. Please check your email or sign up for a new account.');
            }
          }

          // If reset succeeds, email exists, so it's probably a password issue
          throw new Error('The password you entered is incorrect. Please try again.');

        } catch (resetCheckError: any) {
          // If we can't determine, default to password error (more common)
          if (resetCheckError.message.includes('An account with this email')) {
            throw resetCheckError; // Re-throw our custom error
          }
          throw new Error('The password you entered is incorrect. Please try again.');
        }
      }

      if (errorMessage.includes('email not confirmed') || errorMessage.includes('not confirmed')) {
        throw new Error('Please check your email and click the verification link to activate your account before signing in.');
      }

      if (errorMessage.includes('too many requests') || errorMessage.includes('rate limit')) {
        throw new Error('Too many sign-in attempts. Please wait a few minutes before trying again.');
      }

      if (errorMessage.includes('invalid email') || errorMessage.includes('malformed')) {
        throw new Error('Please enter a valid email address.');
      }

      // Fallback for any other errors
      throw new Error('Sign in failed. Please check your credentials and try again.');
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
      if (error.message.includes('rate limit') || error.message.includes('too many')) {
        throw new Error('Too many reset requests. Please wait before trying again.');
      }
      throw error;
    }
  }

  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) {
      if (error.message.includes('weak password') || error.message.includes('password')) {
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
    if (error) {
      if (error.message.includes('rate limit') || error.message.includes('too many')) {
        throw new Error('Too many requests. Please wait before requesting another verification email.');
      }
      throw error;
    }
  }
}