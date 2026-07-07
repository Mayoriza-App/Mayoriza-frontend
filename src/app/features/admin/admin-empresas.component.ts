import { Component, inject, ViewChild, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AdminService, EmpresaConDueño } from '../../core/services/admin.service';
import { TransferirEmpresaDialogComponent } from './components/transferir-empresa-dialog.component';

@Component({
  selector: 'app-admin-empresas',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatIconModule, 
    MatButtonModule, 
    MatDialogModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule
  ],
  template: `
    <div class="space-y-6 animate-fade-in p-8">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Gestión de Empresas</h1>
        <p class="text-slate-500 mt-1">Administra y transfiere las empresas de los usuarios.</p>
      </div>

      <div class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <mat-form-field appearance="outline" class="w-96 !mb-0 text-sm">
            <mat-label>Buscar empresa...</mat-label>
            <input matInput (keyup)="applyFilter($event)" placeholder="Ej. ACME Corp o RUT">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>

        <table mat-table [dataSource]="dataSource" class="w-full bg-transparent">
          
          <ng-container matColumnDef="rut">
            <th mat-header-cell *matHeaderCellDef class="!bg-white"> RUT </th>
            <td mat-cell *matCellDef="let element" class="font-mono text-sm"> {{element.rut}} </td>
          </ng-container>

          <ng-container matColumnDef="razonSocial">
            <th mat-header-cell *matHeaderCellDef class="!bg-white"> Razón Social </th>
            <td mat-cell *matCellDef="let element" class="font-medium text-slate-800"> {{element.razonSocial}} </td>
          </ng-container>

          <ng-container matColumnDef="duenoActual">
            <th mat-header-cell *matHeaderCellDef class="!bg-white"> Dueño Actual </th>
            <td mat-cell *matCellDef="let element">
              <div class="flex items-center" *ngIf="element.duenoActual">
                <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mr-3">
                  {{ element.duenoActual.nombre.charAt(0) }}
                </div>
                <div>
                  <p class="text-sm font-medium text-slate-700 leading-tight">{{ element.duenoActual.nombre }}</p>
                  <p class="text-xs text-slate-500">{{ element.duenoActual.email }}</p>
                </div>
              </div>
              <span *ngIf="!element.duenoActual" class="text-slate-400 italic">Sin dueño</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef class="!bg-white text-right"> Acciones </th>
            <td mat-cell *matCellDef="let element" class="text-right">
              <button mat-stroked-button color="primary" class="!rounded-lg" (click)="transferir(element)">
                <mat-icon>swap_horiz</mat-icon> Transferir
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-slate-50 transition-colors"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell text-center py-8 text-slate-500" colspan="4">No se encontraron empresas con esa búsqueda.</td>
          </tr>
        </table>
        
        <mat-paginator [pageSizeOptions]="[10, 25, 100]" aria-label="Select page of users"></mat-paginator>

      </div>
    </div>
  `
})
export class AdminEmpresasComponent implements AfterViewInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  
  displayedColumns: string[] = ['rut', 'razonSocial', 'duenoActual', 'acciones'];
  dataSource = new MatTableDataSource<EmpresaConDueño>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    this.cargarEmpresas();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  cargarEmpresas() {
    this.adminService.getEmpresas().subscribe(empresas => {
      this.dataSource.data = empresas;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  transferir(empresa: EmpresaConDueño) {
    const dialogRef = this.dialog.open(TransferirEmpresaDialogComponent, {
      width: '500px',
      data: empresa,
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarEmpresas();
      }
    });
  }
}
