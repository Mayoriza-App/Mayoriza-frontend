import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from '../interfaces/empresa-usuario.interface';
import { AppStateService } from '../state/app.state';
import { AuthStrategy } from '../interfaces/auth-strategy.interface';
import { UsuarioService } from './usuario.service';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
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

  constructor() {
    this.authStrategy.init();
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


      const userProfile = await new Promise<Usuario>((resolve, reject) => {
        this.usuarioService.findOne(authData.userId).subscribe({
          next: (user) => resolve(user),
          error: (err) => reject(err)
        });
      });

      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(userProfile));
      
      this.token.set(authData.token);
      this.currentUser.set(userProfile);

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
