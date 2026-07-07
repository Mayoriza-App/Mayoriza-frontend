import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService, EmpresaConDueño } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { Usuario } from '../../../core/interfaces/empresa-usuario.interface';

@Component({
  selector: 'app-transferir-empresa-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title class="!font-bold !text-xl flex items-center bg-slate-50 py-4 px-6 border-b border-slate-100 m-0">
      <mat-icon class="mr-2 text-indigo-600">swap_horiz</mat-icon> Transferir Empresa
    </h2>
    <mat-dialog-content class="!p-6 !pt-4">
      <p class="text-slate-600 mb-6">
        Estás a punto de transferir la empresa <strong>{{ data.razonSocial }}</strong> (RUT: {{ data.rut }}).
        Esto moverá todos sus datos, incluyendo cuentas y comprobantes, al nuevo contador.
      </p>

      <div class="flex flex-col space-y-4">
        
        <div class="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4">
          <p class="text-xs text-indigo-800 font-semibold uppercase tracking-wider mb-1">Dueño Actual</p>
          <div class="flex items-center" *ngIf="data.duenoActual">
            <mat-icon class="text-indigo-500 mr-2">person</mat-icon>
            <span class="font-medium text-indigo-900">{{ data.duenoActual.nombre }} ({{ data.duenoActual.email }})</span>
          </div>
          <div *ngIf="!data.duenoActual" class="text-indigo-500 italic">Ninguno</div>
        </div>

        <div class="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-4">
          <p class="text-xs text-emerald-800 font-semibold uppercase tracking-wider mb-1">Destino Autorizado</p>
          <div class="flex items-center">
            <mat-icon class="text-emerald-500 mr-2">forward_to_inbox</mat-icon>
            <span class="font-medium text-emerald-900">{{ data.transferenciaDestinoEmail }}</span>
          </div>
        </div>

      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!px-6 !py-4 border-t border-slate-100 bg-slate-50 m-0">
      <button mat-button mat-dialog-close class="!rounded-lg">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="isLoading" (click)="onSubmit()" class="!rounded-lg !px-6">
        <mat-icon *ngIf="!isLoading">check</mat-icon>
        <span *ngIf="isLoading" class="animate-spin inline-block mr-2">⟳</span>
        Confirmar Transferencia
      </button>
    </mat-dialog-actions>
  `
})
export class TransferirEmpresaDialogComponent {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);
  
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<TransferirEmpresaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EmpresaConDueño
  ) {}

  onSubmit() {
    this.isLoading = true;
    this.adminService.transferirEmpresa(this.data.rut).subscribe({
      next: (response: any) => {
        this.toastService.success(response.mensaje);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.error?.message || 'Error al transferir la empresa');
      }
    });
  }
}
