import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ComprobanteService } from '../../core/services/comprobante.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-apertura-ejercicio-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title class="!font-bold !text-slate-800 flex items-center">
      <mat-icon class="mr-2 text-violet-600">lock_open</mat-icon>
      Asiento de Apertura
    </h2>
    <mat-dialog-content class="!pt-4">
      
      <div class="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 mb-6 text-sm">
        <p class="font-bold mb-1">¿Qué hace este proceso?</p>
        <p>Tomará todas las cuentas de <strong>Activo, Pasivo y Patrimonio</strong> con saldo al cierre del año anterior, y creará un comprobante automático para inicializar sus saldos en el nuevo año.</p>
      </div>

      <form [formGroup]="form" class="flex flex-col gap-4">
        
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Año a Abrir</mat-label>
          <input matInput type="number" formControlName="anioAAbrir" placeholder="Ej: 2026">
          <mat-hint>El sistema buscará los saldos del año anterior ({{ form.get('anioAAbrir')?.value - 1 }}).</mat-hint>
          <mat-error *ngIf="form.get('anioAAbrir')?.hasError('required')">El año es obligatorio</mat-error>
          <mat-error *ngIf="form.get('anioAAbrir')?.hasError('min')">Año inválido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full mt-2">
          <mat-label>Fecha del Asiento</mat-label>
          <input matInput type="date" formControlName="fechaApertura">
          <mat-hint>Normalmente es el 1 de Enero</mat-hint>
        </mat-form-field>

      </form>

      <div *ngIf="error()" class="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
        {{ error() }}
      </div>
      <div *ngIf="success()" class="mt-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-200">
        Asiento de Apertura generado con éxito.
      </div>

    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!pb-4 !px-6">
      <button mat-button mat-dialog-close [disabled]="loading()">Cancelar</button>
      <button mat-flat-button color="primary" class="!bg-violet-600 hover:!bg-violet-700 ml-2" 
              (click)="ejecutarApertura()" [disabled]="form.invalid || loading() || success()">
        <span *ngIf="!loading()">Ejecutar Apertura</span>
        <mat-spinner *ngIf="loading()" diameter="20" color="accent"></mat-spinner>
      </button>
    </mat-dialog-actions>
  `
})
export class AperturaEjercicioDialogComponent {
  private fb = inject(FormBuilder);
  private comprobanteService = inject(ComprobanteService);
  public dialogRef = inject(MatDialogRef<AperturaEjercicioDialogComponent>);
  private data = inject(MAT_DIALOG_DATA);

  public loading = signal(false);
  public error = signal<string | null>(null);
  public success = signal(false);

  private currentYear = new Date().getFullYear();

  public form: FormGroup = this.fb.group({
    anioAAbrir: [this.currentYear, [Validators.required, Validators.min(2000)]],
    fechaApertura: [`${this.currentYear}-01-01`, Validators.required]
  });

  ejecutarApertura() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    const payload = {
      empresaRut: this.data.empresaRut,
      anioAAbrir: this.form.value.anioAAbrir,
      fechaApertura: new Date(this.form.value.fechaApertura).toISOString()
    };

    this.comprobanteService.generarAsientoApertura(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => this.dialogRef.close(true), 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || err.message || 'Error desconocido');
      }
    });
  }
}
