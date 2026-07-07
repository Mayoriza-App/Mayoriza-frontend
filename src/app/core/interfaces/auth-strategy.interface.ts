export abstract class AuthStrategy {
  /**
   * Initializes the strategy (e.g. creating the Supabase client)
   */
  abstract init(): void;

  /**
   * Logs a user in with their credentials.
   * @param email The user's email
   * @param password The user's password
   * @returns An object containing the authentication token and user ID
   */
  abstract login(email: string, password: string): Promise<{ token: string, userId: string }>;

  /**
   * Logs out the current user.
   */
  abstract logout(): Promise<void>;

  /**
   * Retrieves the current active session token if any.
   */
  abstract getToken(): Promise<string | null>;
}
