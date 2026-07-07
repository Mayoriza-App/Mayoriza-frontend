import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-6 max-w-sm">
      <div class="flex items-center space-x-3 mb-4" [ngClass]="data.isDestructive ? 'text-red-600' : 'text-violet-600'">
        <mat-icon>{{ data.isDestructive ? 'warning' : 'info' }}</mat-icon>
        <h2 class="text-xl font-bold m-0 leading-none">{{ data.title }}</h2>
      </div>
      
      <p class="text-slate-600 mb-6 leading-relaxed">
        {{ data.message }}
      </p>
      
      <div class="flex justify-end space-x-3">
        <button mat-stroked-button mat-dialog-close class="!rounded-lg text-slate-500">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        
        <button mat-flat-button 
                [mat-dialog-close]="true"
                class="!rounded-lg !text-white"
                [ngClass]="data.isDestructive ? '!bg-red-600 hover:!bg-red-700' : '!bg-violet-600 hover:!bg-violet-700'">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
