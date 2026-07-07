import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TerceroService } from '../../../core/services/tercero.service';
import { Tercero } from '../../../core/interfaces/tercero.interface';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { formatRut, rutValidator } from '../../../core/utils/rut.util';

@Component({
  selector: 'app-crear-tercero-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title class="!font-bold !text-slate-800">Nuevo Tercero / Cliente</h2>
    <mat-dialog-content class="!pt-4">
      <form [formGroup]="form" class="flex flex-col gap-4">
        
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>RUT</mat-label>
          <input matInput formControlName="rut" placeholder="Ej: 76123456-K">
          <mat-error *ngIf="form.get('rut')?.hasError('required')">El RUT es obligatorio</mat-error>
          <mat-error *ngIf="form.get('rut')?.hasError('invalidRut')">El RUT ingresado no es válido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Razón Social / Nombre</mat-label>
          <input matInput formControlName="razonSocial" placeholder="Ej: Servicios ABC Ltda.">
          <mat-error *ngIf="form.get('razonSocial')?.hasError('required')">La razón social es obligatoria</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Giro (Opcional)</mat-label>
          <input matInput formControlName="giro" placeholder="Ej: Asesoría">
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Dirección (Opcional)</mat-label>
          <input matInput formControlName="direccion">
        </mat-form-field>

        <div class="flex gap-3">
          <mat-form-field appearance="outline" class="w-1/2">
            <mat-label>Comuna (Opcional)</mat-label>
            <input matInput formControlName="comuna">
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="w-1/2">
            <mat-label>Ciudad (Opcional)</mat-label>
            <input matInput formControlName="ciudad">
          </mat-form-field>
        </div>

        <div class="flex gap-3">
          <mat-form-field appearance="outline" class="w-1/2">
            <mat-label>Teléfono (Opcional)</mat-label>
            <input matInput formControlName="telefono">
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="w-1/2">
            <mat-label>Correo Electrónico (Opcional)</mat-label>
            <input matInput formControlName="correo" type="email">
          </mat-form-field>
        </div>

      </form>

      <div *ngIf="errorMessage()" class="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
        {{ errorMessage() }}
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!pb-4 !px-6">
      <button mat-button mat-dialog-close [disabled]="isSubmitting()">Cancelar</button>
      <button mat-flat-button color="primary" class="!bg-violet-600 hover:!bg-violet-700 ml-2" 
              (click)="crear()" [disabled]="form.invalid || isSubmitting()">
        <span *ngIf="!isSubmitting()">Guardar</span>
        <mat-spinner *ngIf="isSubmitting()" diameter="20" color="accent"></mat-spinner>
      </button>
    </mat-dialog-actions>
  `
})
export class CrearTerceroDialogComponent {
  private fb = inject(FormBuilder);
  private terceroService = inject(TerceroService);
  public dialogRef = inject(MatDialogRef<CrearTerceroDialogComponent>);

  public isSubmitting = signal(false);
  public errorMessage = signal<string | null>(null);

  public form: FormGroup = this.fb.group({
    rut: ['', [Validators.required, Validators.maxLength(12), rutValidator]],
    razonSocial: ['', [Validators.required, Validators.maxLength(255)]],
    giro: [''],
    direccion: [''],
    comuna: [''],
    ciudad: [''],
    telefono: [''],
    correo: ['']
  });

  constructor() {
    this.form.get('rut')?.valueChanges.subscribe(value => {
      if (value) {
        const formatted = formatRut(value);
        if (formatted !== value) {
          this.form.get('rut')?.setValue(formatted, { emitEvent: false });
        }
      }
    });
  }

  crear() {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formValue = this.form.value;
    const data: Tercero = {
      rut: formValue.rut,
      razonSocial: formValue.razonSocial
    };

    if (formValue.giro) data.giro = formValue.giro;
    if (formValue.direccion) data.direccion = formValue.direccion;
    if (formValue.comuna) data.comuna = formValue.comuna;
    if (formValue.ciudad) data.ciudad = formValue.ciudad;
    if (formValue.telefono) data.telefono = formValue.telefono;
    if (formValue.correo) data.correo = formValue.correo;

    this.terceroService.create(data).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || err.message || 'Error al crear tercero');
      }
    });
  }
}
