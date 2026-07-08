import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStrategy } from '../interfaces/auth-strategy.interface';
import { Usuario } from '../interfaces/empresa-usuario.interface';
import { AppStateService } from '../state/app.state';
import { UsuarioService } from './usuario.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public readonly token = signal<string | null>(localStorage.getItem('token'));
  public readonly currentUser = signal<Usuario | null>(null);

  public readonly isAuthenticating = signal<boolean>(false);
  public readonly authError = signal<string | null>(null);

  private router = inject(Router);
  private appState = inject(AppStateService);
  private authStrategy = inject(AuthStrategy);
  private usuarioService = inject(UsuarioService);

  /**
   * Devuelve el cliente Supabase si la estrategia activa es Supabase.
   * Devuelve null si es otra estrategia (Firebase, etc).
   *
   * Usamos `as any` para acceder al campo `supabase` (privado en SupabaseAuthStrategy).
   * Es la única vía limpia sin modificar esa clase.
   */
  private getSupabaseClient(): any {
    return (this.authStrategy as any)?.supabase ?? null;
  }

  constructor() {
    this.authStrategy.init();
    this.setupAuthStateListener();
    if (this.token()) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        this.currentUser.set(JSON.parse(savedUser));
      } else {
        this.logout();
      }
    }
  }

  /**
   * Suscribe a cambios de sesión de Supabase para mantener el token
   * sincronizado y manejar el caso de sesión expirada.
   *
   * Eventos que escucha:
   * - SIGNED_OUT: la sesión murió (refresh falló). Limpia y redirige a /login.
   * - TOKEN_REFRESHED: Supabase renovó el access_token. Actualiza localStorage.
   */
  private setupAuthStateListener(): void {
    const supabase = this.getSupabaseClient();
    if (!supabase?.auth?.onAuthStateChange) return;

    supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === 'SIGNED_OUT') {
        // Sesión realmente murió → limpiar y mandar a /login
        this.token.set(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUser.set(null);
        this.appState.clearEmpresa();
        // Evitar loop si ya estamos en /login
        if (!this.router.url.startsWith('/login')) {
          this.router.navigate(['/login']);
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.access_token) {
        // Supabase renovó el token → actualizar signal y localStorage
        this.token.set(session.access_token);
        localStorage.setItem('token', session.access_token);
      }
    });
  }

  /**
   * Autentica a un usuario utilizando la estrategia configurada (Supabase/Firebase)
   * y recupera su perfil completo desde la base de datos central de Mayoriza.
   *
   * @param email - Correo electrónico del usuario
   * @param password - Contraseña en texto plano
   * @throws {Error} Si las credenciales son inválidas o el usuario no existe en la BD.
   * @returns {Promise<void>} Una promesa que se resuelve cuando el usuario es autenticado y redirigido al dashboard.
   */
  async login(email: string, password: string): Promise<void> {
    this.isAuthenticating.set(true);
    this.authError.set(null);

    try {
      const authData = await this.authStrategy.login(email, password);

      localStorage.setItem('token', authData.token);
      this.token.set(authData.token);

      const userProfile = await new Promise<Usuario>((resolve, reject) => {
        this.usuarioService.findOne(authData.userId).subscribe({
          next: (user) => resolve(user),
          error: (err) => reject(err),
        });
      });

      localStorage.setItem('user', JSON.stringify(userProfile));
      this.currentUser.set(userProfile);

      // Activar auto-refresh — Supabase renueva el JWT automáticamente antes que expire
      const supabase = this.getSupabaseClient();
      if (supabase?.auth?.startAutoRefresh) {
        supabase.auth.startAutoRefresh();
      }

      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.authError.set(error.message || 'Error al iniciar sesión');
      throw error;
    } finally {
      this.isAuthenticating.set(false);
    }
  }

  /**
   * Cierra la sesión activa en el proveedor de autenticación y limpia el estado local,
   * incluyendo tokens, perfiles y datos de empresas seleccionadas.
   * Redirige al usuario a la pantalla de Login tras finalizar.
   *
   * @returns {Promise<void>}
   */
  async logout(): Promise<void> {
    try {
      // Detener auto-refresh antes de cerrar sesión
      const supabase = this.getSupabaseClient();
      if (supabase?.auth?.stopAutoRefresh) {
        supabase.auth.stopAutoRefresh();
      }
      await this.authStrategy.logout();
    } catch (e) {
      console.error('Error logging out from strategy', e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      this.token.set(null);
      this.currentUser.set(null);

      this.appState.clearEmpresa();

      this.router.navigate(['/login']);
    }
  }
}
