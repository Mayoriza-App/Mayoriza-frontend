import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { Empresa } from '../../../../core/interfaces/empresa-usuario.interface';
import { formatRut, rutValidator } from '../../../../core/utils/rut.util';

@Component({
  selector: 'app-editar-empresa-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title class="!text-slate-800 !font-bold">Editar Empresa</h2>
    <mat-dialog-content class="!pt-4">
      <form [formGroup]="editForm" class="space-y-4 flex flex-col">
        <!-- RUT inmutable -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>RUT (No editable)</mat-label>
          <input matInput [value]="empresa.rut" disabled>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Razón Social</mat-label>
          <input matInput formControlName="razonSocial">
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Giro Comercial</mat-label>
          <input matInput formControlName="giro">
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Dirección</mat-label>
          <input matInput formControlName="direccion">
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Comuna</mat-label>
            <input matInput formControlName="comuna">
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Ciudad</mat-label>
            <input matInput formControlName="ciudad">
          </mat-form-field>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Teléfono</mat-label>
            <input matInput formControlName="telefono">
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Correo</mat-label>
            <input matInput formControlName="correo">
          </mat-form-field>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Nombre Representante Legal</mat-label>
            <input matInput formControlName="representanteNombre">
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>RUT Representante Legal</mat-label>
            <input matInput formControlName="representanteRut" placeholder="12345678-9">
          </mat-form-field>
        </div>
      </form>

      <div *ngIf="errorMessage" class="text-red-500 text-sm mt-2">
        {{ errorMessage }}
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!pb-6 !px-6">
      <button mat-button mat-dialog-close [disabled]="isLoading" class="!text-slate-500">Cancelar</button>
      <button mat-flat-button color="primary" 
              class="!bg-violet-600 hover:!bg-violet-700" 
              [disabled]="editForm.invalid || isLoading"
              (click)="guardar()">
        <mat-spinner *ngIf="isLoading" diameter="20" class="mr-2 inline-block"></mat-spinner>
        Guardar Cambios
      </button>
    </mat-dialog-actions>
  `
})
export class EditarEmpresaDialogComponent {
  editForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  private empresaService = inject(EmpresaService);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditarEmpresaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public empresa: Empresa
  ) {
    this.editForm = this.fb.group({
      razonSocial: [empresa.razonSocial, Validators.required],
      giro: [empresa.giro, Validators.required],
      direccion: [empresa.direccion],
      comuna: [empresa.comuna],
      ciudad: [empresa.ciudad],
      telefono: [empresa.telefono],
      correo: [empresa.correo, [Validators.email]],
      representanteNombre: [empresa.representanteNombre],
      representanteRut: [empresa.representanteRut, [rutValidator]]
    });

    this.editForm.get('representanteRut')?.valueChanges.subscribe(value => {
      if (value) {
        const formatted = formatRut(value);
        if (formatted !== value) {
          this.editForm.get('representanteRut')?.setValue(formatted, { emitEvent: false });
        }
      }
    });
  }

  guardar() {
    if (this.editForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';

    const updateData = this.editForm.value;

    this.empresaService.updateEmpresa(this.empresa.rut, updateData).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.dialogRef.close(true); // Return true indicating success
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error al actualizar empresa';
      }
    });
  }
}
