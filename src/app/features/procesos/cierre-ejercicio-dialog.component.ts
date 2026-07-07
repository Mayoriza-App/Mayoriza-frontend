import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { ComprobanteService } from '../../core/services/comprobante.service';
import { AppStateService } from '../../core/state/app.state';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-cierre-ejercicio-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title class="!font-bold !text-slate-800 flex items-center">
      <mat-icon class="mr-2 text-violet-600">event_busy</mat-icon>
      Cierre de Ejercicio
    </h2>
    <mat-dialog-content class="!pt-4">
      
      <div class="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 mb-6 text-sm">
        <p class="font-bold mb-1">¿Qué hace este proceso?</p>
        <p>Tomará todas las cuentas de <strong>Pérdida y Ganancia</strong> con saldo en el año seleccionado y creará un comprobante automático dejándolas en $0, traspasando el saldo neto a la cuenta de Patrimonio elegida.</p>
      </div>

      <form [formGroup]="form" class="flex flex-col gap-4">
        
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Año a Cerrar</mat-label>
          <input matInput type="number" formControlName="anio" placeholder="Ej: 2026">
          <mat-error *ngIf="form.get('anio')?.hasError('required')">El año es obligatorio</mat-error>
          <mat-error *ngIf="form.get('anio')?.hasError('min')">Año inválido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Fecha del Asiento</mat-label>
          <input matInput type="date" formControlName="fechaCierre">
          <mat-hint>Normalmente es el 31 de Diciembre</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Cuenta Destino (Patrimonio)</mat-label>
          <mat-select formControlName="cuentaPatrimonioCodigo">
            <mat-option *ngFor="let c of cuentasPatrimonio()" [value]="c.codigo">
              {{c.codigo}} - {{c.nombre}}
            </mat-option>
          </mat-select>
          <mat-hint>Aquí se depositará la Utilidad o Pérdida neta</mat-hint>
        </mat-form-field>

      </form>

      <div *ngIf="error()" class="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
        {{ error() }}
      </div>
      <div *ngIf="success()" class="mt-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-200">
        Comprobante de cierre generado con éxito.
      </div>

    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!pb-4 !px-6">
      <button mat-button mat-dialog-close [disabled]="loading()">Cancelar</button>
      <button mat-flat-button color="primary" class="!bg-violet-600 hover:!bg-violet-700 ml-2" 
              (click)="ejecutarCierre()" [disabled]="form.invalid || loading() || success()">
        <span *ngIf="!loading()">Ejecutar Cierre</span>
        <mat-spinner *ngIf="loading()" diameter="20" color="accent"></mat-spinner>
      </button>
    </mat-dialog-actions>
  `
})
export class CierreEjercicioDialogComponent {
  private fb = inject(FormBuilder);
  private contabilidadService = inject(ContabilidadService);
  private comprobanteService = inject(ComprobanteService);
  public dialogRef = inject(MatDialogRef<CierreEjercicioDialogComponent>);
  private data = inject(MAT_DIALOG_DATA);
  private appState = inject(AppStateService);

  public loading = signal(false);
  public error = signal<string | null>(null);
  public success = signal(false);

  public cuentasPatrimonio = toSignal(
    this.contabilidadService.getCuentas(this.appState.empresaRutActiva()!).pipe(
      map(cuentas => cuentas.filter(c => c.tipo === 'PATRIMONIO'))
    ), 
    { initialValue: [] }
  );

  public form: FormGroup = this.fb.group({
    anio: [new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
    fechaCierre: [`${new Date().getFullYear()}-12-31`, Validators.required],
    cuentaPatrimonioCodigo: ['', Validators.required]
  });

  ejecutarCierre() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    const payload = {
      empresaRut: this.data.empresaRut,
      anio: this.form.value.anio,
      fechaCierre: new Date(this.form.value.fechaCierre).toISOString(),
      cuentaPatrimonioCodigo: this.form.value.cuentaPatrimonioCodigo
    };

    this.comprobanteService.generarAsientoCierre(payload).subscribe({
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
