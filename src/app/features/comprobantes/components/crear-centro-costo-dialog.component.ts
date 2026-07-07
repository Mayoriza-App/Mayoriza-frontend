import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CentroCostoService } from '../../../core/services/centro-costo.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-crear-centro-costo-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title class="!font-bold !text-slate-800">Crear Centro de Costo</h2>
    <mat-dialog-content class="!pt-4">
      <form [formGroup]="form" class="flex flex-col space-y-4 mt-2">
        
        <div *ngIf="errorMessage()" class="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
          {{ errorMessage() }}
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre del Centro de Costo</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej: Administración">
          <mat-error>Requerido</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!pb-6 !pr-6">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" class="!rounded-lg" 
              [disabled]="form.invalid || isLoading()" 
              (click)="onSave()">
        <mat-spinner diameter="20" *ngIf="isLoading()" class="mr-2 inline-block"></mat-spinner>
        Guardar
      </button>
    </mat-dialog-actions>
  `
})
export class CrearCentroCostoDialogComponent {
  private fb = inject(FormBuilder);
  private centroCostoService = inject(CentroCostoService);
  private dialogRef = inject(MatDialogRef<CrearCentroCostoDialogComponent>);

  public form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(255)]]
  });

  public isLoading = signal(false);
  public errorMessage = signal<string | null>(null);

  onSave() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const val = this.form.value;

    this.centroCostoService.create({ nombre: val.nombre! }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Error al crear el centro de costo');
      }
    });
  }
}
