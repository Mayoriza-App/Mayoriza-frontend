import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './set-password.component.html',
})
export class SetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey,
  );

  public isSubmitting = signal<boolean>(false);
  public errorMessage = signal<string>('');

  setPasswordForm: FormGroup = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordsMatchValidator },
  );

  async ngOnInit(): Promise<void> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    if (!session) {
      this.router.navigate(['/login']);
    }
  }

  passwordsMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password && confirm && password !== confirm
      ? { passwordsMismatch: true }
      : null;
  }

  async onSubmit(): Promise<void> {
    if (this.setPasswordForm.invalid) {
      this.setPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const { password } = this.setPasswordForm.value;

    try {
      const { error } = await this.supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      // Contraseña actualizada → al dashboard
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.errorMessage.set(
        err?.message ||
          'No se pudo actualizar la contraseña. Intenta nuevamente.',
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
