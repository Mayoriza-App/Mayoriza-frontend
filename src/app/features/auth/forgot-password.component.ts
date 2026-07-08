import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Pantalla para que el usuario solicite un correo de recuperación de contraseña.
 * Llama directamente al SDK de Supabase (es público, no requiere JWT).
 *
 * Flujo:
 * 1. Usuario ingresa su email.
 * 2. Cliente Supabase llama a resetPasswordForEmail() con redirectTo a /auth/callback.
 * 3. Supabase manda email con template "Reset password" customizado.
 * 4. Usuario clickea → aterriza en /auth/callback → /auth/set-password.
 *
 * Nota: Por seguridad siempre se muestra éxito, sin importar si el email existe.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);

  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey,
  );

  public isSubmitting = signal<boolean>(false);
  public submitted = signal<boolean>(false);
  public errorMessage = signal<string>('');

  public forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async onSubmit(): Promise<void> {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const { email } = this.forgotForm.value;

    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      // Por seguridad: siempre se muestra éxito (no le decimos al usuario
      // si el email existe o no, para prevenir enumeración de cuentas).
      if (error) {
        console.warn('Reset password error:', error.message);
      }

      this.submitted.set(true);
    } catch (err: any) {
      // Caso raro de error real (red caída, etc) — sí mostramos error
      this.errorMessage.set(
        'Ocurrió un error de conexión. Verifica tu internet e intenta nuevamente.',
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
