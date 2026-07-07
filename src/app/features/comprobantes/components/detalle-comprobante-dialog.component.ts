import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { Comprobante } from '../../../core/interfaces/comprobante.interface';
import { PdfService } from '../../../core/services/pdf.service';
import { AppStateService } from '../../../core/state/app.state';
import { EmpresaService } from '../../../core/services/empresa.service';

@Component({
  selector: 'app-detalle-comprobante-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule
  ],
  template: `
    <div class="p-8">
      <div class="flex justify-between items-start mb-8">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Comprobante N° {{ data.id }}</h2>
          <p class="text-sm text-slate-500 mt-1">{{ data.fecha | date:'fullDate' }}</p>
        </div>
        <span class="px-3 py-1 text-xs font-bold rounded-md border" [ngClass]="getTipoColor(data.tipo)">
          {{ data.tipo }}
        </span>
      </div>

      <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
        <p class="text-sm font-semibold text-slate-600 mb-1">Glosa General</p>
        <p class="text-slate-800">{{ data.glosaGeneral }}</p>
      </div>

      <h3 class="font-bold text-slate-700 mb-3">Líneas de Movimiento</h3>
      
      <div class="border border-slate-200 rounded-xl overflow-hidden">
        <table mat-table [dataSource]="data.movimientos || []" class="w-full bg-transparent">
          
          <ng-container matColumnDef="cuenta">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-100 !text-slate-600 !font-semibold"> Cuenta </th>
            <td mat-cell *matCellDef="let m" class="font-mono text-sm !text-slate-700"> {{ m.cuentaCodigo }} </td>
          </ng-container>

          <ng-container matColumnDef="glosa">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-100 !text-slate-600 !font-semibold"> Detalle </th>
            <td mat-cell *matCellDef="let m" class="text-sm"> {{ m.glosaLinea || '-' }} </td>
          </ng-container>

          <ng-container matColumnDef="debe">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-100 !text-slate-600 !font-semibold !text-right"> Debe </th>
            <td mat-cell *matCellDef="let m" class="!text-right text-emerald-700 font-medium"> 
              {{ m.debe | currency:'CLP':'symbol-narrow':'1.0-0' }} 
            </td>
          </ng-container>

          <ng-container matColumnDef="haber">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-100 !text-slate-600 !font-semibold !text-right"> Haber </th>
            <td mat-cell *matCellDef="let m" class="!text-right text-rose-700 font-medium"> 
              {{ m.haber | currency:'CLP':'symbol-narrow':'1.0-0' }} 
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="['cuenta', 'glosa', 'debe', 'haber']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['cuenta', 'glosa', 'debe', 'haber'];" class="hover:bg-slate-50 transition-colors"></tr>
        </table>
      </div>

      <!-- Totales Footer -->
      <div class="flex justify-end gap-12 mt-4 pr-4">
        <div class="text-right">
          <p class="text-xs text-slate-500 font-bold">TOTAL DEBE</p>
          <p class="text-lg font-bold text-emerald-700 font-mono">{{ data.totales?.debe | currency:'CLP':'symbol-narrow':'1.0-0' }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-500 font-bold">TOTAL HABER</p>
          <p class="text-lg font-bold text-rose-700 font-mono">{{ data.totales?.haber | currency:'CLP':'symbol-narrow':'1.0-0' }}</p>
        </div>
      </div>

    </div>
    
    <div class="px-6 pb-6 pt-2 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
      <button mat-flat-button color="primary" class="!bg-rose-600 hover:!bg-rose-700" (click)="descargarPdf()">
        <mat-icon>picture_as_pdf</mat-icon>
        Descargar PDF
      </button>
      <button mat-button mat-dialog-close>Cerrar</button>
    </div>
  `
})
export class DetalleComprobanteDialogComponent {
  public data: Comprobante = inject(MAT_DIALOG_DATA);
  private pdfService = inject(PdfService);
  private appState = inject(AppStateService);
  private empresaService = inject(EmpresaService);

  descargarPdf() {
    const rut = this.appState.empresaRutActiva();
    this.empresaService.findAll().subscribe(empresas => {
      const empresa = empresas.find(e => e.rut === rut);
      const info = empresa ? { rut: empresa.rut, razonSocial: empresa.razonSocial } : { rut: 'Desconocido', razonSocial: 'Empresa Desconocida' };
      this.pdfService.exportarComprobante(this.data, info);
    });
  }

  getTipoColor(tipo: string): string {
    switch (tipo) {
      case 'INGRESO': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'EGRESO': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'TRASPASO': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }
}
