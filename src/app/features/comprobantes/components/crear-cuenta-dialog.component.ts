import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { CuentaContable } from '../../../core/interfaces/contabilidad.interface';
import { AppStateService } from '../../../core/state/app.state';
@Component({
  selector: 'app-crear-cuenta-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title class="font-bold">{{ isEditing ? 'Editar' : 'Nueva' }} Cuenta Contable</h2>
    <mat-dialog-content class="!pt-6">
      <form [formGroup]="cuentaForm" class="flex flex-col space-y-3 mt-4 min-w-[300px]">
        
        <mat-form-field appearance="outline">
          <mat-label>Código (Ej: 1.1.02.05)</mat-label>
          <input matInput formControlName="codigo" placeholder="1.1.02.05">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nombre de la Cuenta</mat-label>
          <input matInput formControlName="nombre">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Clasificación</mat-label>
          <mat-select formControlName="tipo">
            <mat-option value="ACTIVO">Activo</mat-option>
            <mat-option value="PASIVO">Pasivo</mat-option>
            <mat-option value="PATRIMONIO">Patrimonio</mat-option>
            <mat-option value="RESULTADO_PERDIDA">Pérdida</mat-option>
            <mat-option value="RESULTADO_GANANCIA">Ganancia</mat-option>
          </mat-select>
        </mat-form-field>

        <div *ngIf="errorMessage" class="text-sm text-red-600 bg-red-50 p-2 rounded">
          {{ errorMessage }}
        </div>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="isSubmitting">Cancelar</button>
      <button mat-flat-button color="primary" class="!bg-violet-600" [disabled]="cuentaForm.invalid || isSubmitting" (click)="guardar()">
        <mat-spinner *ngIf="isSubmitting" diameter="20" class="inline-block mr-2"></mat-spinner>
        <span *ngIf="!isSubmitting">{{ isEditing ? 'Actualizar' : 'Guardar' }} Cuenta</span>
      </button>
    </mat-dialog-actions>
  `
})
export class CrearCuentaDialogComponent {
  private dialogRef = inject(MatDialogRef<CrearCuentaDialogComponent>);
  private contabilidadService = inject(ContabilidadService);
  private fb = inject(FormBuilder);
  private appState = inject(AppStateService);
  public data: CuentaContable | null = inject(MAT_DIALOG_DATA, { optional: true });

  public isEditing = false;
  
  public cuentaForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.maxLength(255)]],
    tipo: ['ACTIVO', Validators.required]
  });

  public isSubmitting = false;
  public errorMessage = '';

  constructor() {
    if (this.data) {
      this.isEditing = true;
      this.cuentaForm.patchValue({
        codigo: this.data.codigo,
        nombre: this.data.nombre,
        tipo: this.data.tipo
      });

      this.cuentaForm.get('codigo')?.disable();
    }
  }

  guardar() {
    if (this.cuentaForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      
      const payload = this.cuentaForm.getRawValue() as Partial<CuentaContable>;
      const rut = this.appState.empresaRutActiva();
      
      if (!rut) {
        this.errorMessage = 'No hay empresa activa';
        this.isSubmitting = false;
        return;
      }

      if (!this.isEditing) {
        payload['empresaRut'] = rut;
      }

      const request$ = this.isEditing 
        ? this.contabilidadService.updateCuenta(rut, this.data!.codigo, payload)
        : this.contabilidadService.createCuenta(payload);

      request$.subscribe({
        next: (resultado) => {
          this.isSubmitting = false;
          this.dialogRef.close(resultado);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err.error?.message || `Error al ${this.isEditing ? 'actualizar' : 'crear'} la cuenta`;
        }
      });
    }
  }
}
