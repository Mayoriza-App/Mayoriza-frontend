import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

/**
 * Landing page después de que el usuario hace click en un email de Supabase
 * (invitación o reset de contraseña). La URL trae los tokens en el fragmento
 * (#access_token=...&refresh_token=...&type=invite|recovery).
 *
 * Flujo:
 * 1. Lee el hash, parsea tokens.
 * 2. Llama a supabase.auth.setSession() para activar la sesión.
 * 3. Redirige a /auth/set-password si es invite/recovery, o a /dashboard si ya tenía sesión.
 */
@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './auth-callback.component.html',
})
export class AuthCallbackComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey,
  );

  public status = signal<'processing' | 'success' | 'error'>('processing');
  public errorMessage = signal<string>('');

  async ngOnInit(): Promise<void> {
    try {
      // Supabase pone los tokens en el hash de la URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (!accessToken) {
        // Si no hay token, probablemente el link expiró o ya se usó
        this.status.set('error');
        this.errorMessage.set(
          'El enlace de invitación no es válido o ha expirado. Solicita uno nuevo.',
        );
        setTimeout(() => this.router.navigate(['/login']), 3000);
        return;
      }

      // Activa la sesión con los tokens del hash
      const { error } = await this.supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken ?? '',
      });

      if (error) {
        throw error;
      }

      this.status.set('success');

      // Limpia el hash de la URL (por seguridad y estética)
      window.history.replaceState({}, '', window.location.pathname);

      // Si es invitación o reset, va a set-password. Si es magic link/login, va al dashboard.
      if (type === 'invite' || type === 'recovery' || type === 'signup') {
        setTimeout(() => this.router.navigate(['/auth/set-password']), 800);
      } else {
        setTimeout(() => this.router.navigate(['/dashboard']), 800);
      }
    } catch (err: any) {
      this.status.set('error');
      this.errorMessage.set(
        err?.message || 'No se pudo validar el enlace. Intenta nuevamente.',
      );
      setTimeout(() => this.router.navigate(['/login']), 3000);
    }
  }
}
