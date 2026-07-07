import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Empresa } from '../../../../core/interfaces/empresa-usuario.interface';

@Component({
  selector: 'app-habilitar-transferencia-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title class="!font-bold !text-xl flex items-center bg-slate-50 py-4 px-6 border-b border-slate-100 m-0">
      <mat-icon class="mr-2 text-indigo-600">swap_horiz</mat-icon> Habilitar Transferencia
    </h2>
    <mat-dialog-content class="!p-6 !pt-4">
      <p class="text-slate-600 mb-6">
        Ingresa el correo electrónico del nuevo contador al que deseas transferir <strong>{{ data.razonSocial }}</strong>.
        El administrador verá esta solicitud y procederá a confirmarla.
      </p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col space-y-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Correo del Contador Destino</mat-label>
          <input matInput formControlName="email" type="email" placeholder="ejemplo@correo.com">
          <mat-error *ngIf="form.get('email')?.hasError('required')">
            El correo es obligatorio
          </mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('email')">
            Debe ser un correo electrónico válido
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!px-6 !py-4 border-t border-slate-100 bg-slate-50 m-0">
      <button mat-button mat-dialog-close class="!rounded-lg">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="onSubmit()" class="!rounded-lg !px-6">
        Habilitar Transferencia
      </button>
    </mat-dialog-actions>
  `
})
export class HabilitarTransferenciaDialogComponent {
  private fb = inject(FormBuilder);
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<HabilitarTransferenciaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Empresa
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value.email.trim());
    }
  }
}
