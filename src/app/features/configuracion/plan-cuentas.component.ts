import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { CuentaContable } from '../../core/interfaces/contabilidad.interface';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CrearCuentaDialogComponent } from '../comprobantes/components/crear-cuenta-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/dialogs/confirm-dialog.component';
import { AppStateService } from '../../core/state/app.state';
import { EmpresaService } from '../../core/services/empresa.service';
import { switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
@Component({
  selector: 'app-plan-cuentas',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    ReactiveFormsModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatDialogModule, 
    MatSnackBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="p-8 max-w-5xl mx-auto animate-fade-in">
      <div class="sticky top-[-32px] z-50 flex items-center justify-between mb-8 bg-slate-50 pt-8 pb-4 px-8 -mx-8 -mt-8 shadow-sm border-b border-slate-200">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center">
            Plan de Cuentas
            <mat-icon class="ml-2 text-slate-400 cursor-help" 
                      matTooltip="El sistema clasifica automáticamente las cuentas según su prefijo numérico. Usa 11 para Activo Circulante, 12 Activo Fijo, 21 Pasivo Circulante, 22 Pasivo Largo Plazo, 23 Patrimonio. Si no sigues este estándar, los reportes podrían mostrar clasificaciones incorrectas."
                      matTooltipPosition="right">
              help_outline
            </mat-icon>
          </h1>
          <p class="text-slate-500 mt-1">Administración del catálogo contable</p>
        </div>
        <button *ngIf="!isNoEmpresaSelected() && !isSelectionMode()" mat-flat-button color="primary" 
                class="!bg-violet-600 hover:!bg-violet-700 disabled:!bg-slate-300 disabled:!text-slate-500" 
                (click)="openCrear()"
                [disabled]="authService.currentUser()?.activo === false">
          <mat-icon>add</mat-icon>
          Nueva Cuenta
        </button>
      </div>

      <ng-container *ngIf="!isNoEmpresaSelected()">
        <!-- MODO NORMAL: Plan de cuentas ya configurado -->
        <div *ngIf="!isSelectionMode()" class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table mat-table [dataSource]="cuentas()" class="w-full">
          <!-- Código -->
          <ng-container matColumnDef="codigo">
            <th mat-header-cell *matHeaderCellDef class="font-bold text-slate-700"> Código </th>
            <td mat-cell *matCellDef="let element" class="font-medium text-slate-600"> {{element.codigo}} </td>
          </ng-container>

          <!-- Nombre -->
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef class="font-bold text-slate-700"> Nombre de la Cuenta </th>
            <td mat-cell *matCellDef="let element" class="font-medium text-slate-900"> {{element.nombre}} </td>
          </ng-container>

          <!-- Tipo -->
          <ng-container matColumnDef="tipo">
            <th mat-header-cell *matHeaderCellDef class="font-bold text-slate-700"> Clasificación </th>
            <td mat-cell *matCellDef="let element">
              <span class="px-2 py-1 text-xs rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {{element.tipo}}
              </span>
            </td>
          </ng-container>

          <!-- Acciones -->
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef class="text-right font-bold text-slate-700"> Acciones </th>
            <td mat-cell *matCellDef="let element" class="text-right">
              <button mat-icon-button class="text-blue-500 hover:text-blue-700 mr-1 disabled:text-slate-400" 
                      (click)="editar(element)"
                      [disabled]="authService.currentUser()?.activo === false">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button class="text-red-500 hover:text-red-700 disabled:text-slate-400" 
                      (click)="eliminar(element.codigo)"
                      [disabled]="authService.currentUser()?.activo === false">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-slate-50 transition-colors"></tr>
        </table>
        
        <div *ngIf="cuentas().length === 0 && appState.empresaRutActiva()" class="p-8 text-center text-slate-500">
          No hay cuentas registradas.
        </div>
      </div>

      <!-- MODO SELECCIÓN: Empresa sin plan de cuentas -->
      <div *ngIf="isSelectionMode()" class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-8 animate-fade-in">
        
        <div class="text-center max-w-2xl mx-auto mb-8">
          <div class="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <mat-icon class="text-indigo-600 text-3xl h-[30px] w-[30px]">account_balance</mat-icon>
          </div>
          <h2 class="text-2xl font-bold text-slate-800 mb-2">Configura el Plan de Cuentas</h2>
          <p class="text-slate-500">Esta empresa aún no tiene un plan de cuentas. Selecciona una plantilla del sistema o clona el plan de otra empresa para comenzar.</p>
        </div>

        <div class="max-w-md mx-auto mb-8">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Plan Base a Clonar</mat-label>
            <mat-select [formControl]="origenPlanCtrl" (selectionChange)="onOrigenChange($event.value)">
              <mat-optgroup label="Plantillas del Sistema">
                <mat-option *ngFor="let p of opcionesPlanResource()?.plantillas" [value]="'plan_' + p.id">
                  {{ p.nombre }}
                </mat-option>
              </mat-optgroup>
              <mat-optgroup label="Clonar de mis Empresas" *ngIf="opcionesPlanResource()?.empresas?.length">
                <mat-option *ngFor="let e of opcionesPlanResource()?.empresas" [value]="'empresa_' + e.rut">
                  {{ e.razonSocial }} ({{ e.rut }})
                </mat-option>
              </mat-optgroup>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Previsualización -->
        <div *ngIf="previewLoading()" class="flex justify-center py-8">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div *ngIf="previewCuentas().length > 0 && !previewLoading()" class="mt-4 border border-slate-200 rounded-xl overflow-hidden mb-8">
          <div class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 class="font-bold text-slate-700">Previsualización del Plan Seleccionado ({{ previewCuentas().length }} cuentas)</h3>
          </div>
          
          <div class="max-h-96 overflow-y-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                <tr>
                  <th class="px-4 py-3 border-b">Código</th>
                  <th class="px-4 py-3 border-b">Nombre</th>
                  <th class="px-4 py-3 border-b">Tipo</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of previewCuentas()" class="border-b border-slate-100 hover:bg-slate-50">
                  <td class="px-4 py-2 font-mono text-slate-600">{{ c.codigo }}</td>
                  <td class="px-4 py-2 text-slate-800">{{ c.nombre }}</td>
                  <td class="px-4 py-2">
                    <span class="px-2 py-0.5 text-[10px] rounded-full font-bold bg-slate-100 text-slate-600">
                      {{ c.tipo }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div *ngIf="previewCuentas().length > 0 && !previewLoading()" class="flex justify-center">
          <button mat-flat-button color="primary" 
                  class="!bg-indigo-600 !px-8 !py-6 !text-lg !rounded-xl disabled:!bg-slate-300 disabled:!text-slate-500" 
                  (click)="clonarPlan()" 
                  [disabled]="isCloning() || authService.currentUser()?.activo === false">
            <mat-spinner *ngIf="isCloning()" diameter="20" class="mr-2 inline-block"></mat-spinner>
            <mat-icon *ngIf="!isCloning()" class="mr-2">content_copy</mat-icon>
            Clonar y Asignar este Plan
          </button>
        </div>

      </div>
      </ng-container>

      <!-- ESTADOS VACÍOS -->
      <div *ngIf="isNoEmpresaSelected()" class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-12 text-center animate-fade-in">
        <div class="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <mat-icon class="text-slate-400 text-4xl h-[40px] w-[40px]">domain_disabled</mat-icon>
        </div>
        
        <ng-container *ngIf="hasEmpresas()">
          <h2 class="text-2xl font-bold text-slate-800 mb-3">Ninguna Empresa Seleccionada</h2>
          <p class="text-slate-500 max-w-md mx-auto mb-6">
            Para ver o configurar un plan de cuentas, primero debes seleccionar una empresa activa en el selector de la esquina superior derecha.
          </p>
        </ng-container>

        <ng-container *ngIf="!hasEmpresas()">
          <h2 class="text-2xl font-bold text-slate-800 mb-3">No tienes empresas registradas</h2>
          <p class="text-slate-500 max-w-md mx-auto mb-8">
            Para poder gestionar un plan de cuentas, primero necesitas crear tu primera empresa en el sistema.
          </p>
          <button mat-flat-button color="primary" class="!bg-violet-600 !px-8 !py-6 !text-lg !rounded-xl" [routerLink]="['/configuracion']" [queryParams]="{tab: 'empresas'}">
            <mat-icon class="mr-2">add_business</mat-icon>
            Ir a Crear Empresa
          </button>
        </ng-container>
      </div>

    </div>
  `
})
export class PlanCuentasComponent {
  private contabilidadService = inject(ContabilidadService);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);
  public appState = inject(AppStateService);
  private empresaService = inject(EmpresaService);
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);

  public cuentas = signal<CuentaContable[]>([]);
  public displayedColumns: string[] = ['codigo', 'nombre', 'tipo', 'acciones'];
  
  public isSelectionMode = signal<boolean>(false);
  public isInitialLoading = signal<boolean>(true);

  public isNoEmpresaSelected = computed(() => !this.appState.empresaRutActiva());
  public hasEmpresas = computed(() => {
    const resource = this.opcionesPlanResource();
    return resource && resource.empresas && resource.empresas.length > 0;
  });

  public opcionesPlanResource = toSignal(
    this.appState.refreshEmpresas$.pipe(switchMap(() => this.empresaService.getOpcionesPlan())), 
    { initialValue: { plantillas: [], empresas: [] } }
  );

  public origenPlanCtrl = this.fb.control('', Validators.required);
  public previewCuentas = signal<CuentaContable[]>([]);
  public previewLoading = signal<boolean>(false);
  public isCloning = signal<boolean>(false);

  constructor() {
    this.appState.empresaRutActiva$.subscribe(() => {
      this.cargarCuentas();
    });
  }

  cargarCuentas() {
    const rut = this.appState.empresaRutActiva();
    if (!rut) {
      this.cuentas.set([]);
      this.isSelectionMode.set(false);
      return;
    }
    
    this.isInitialLoading.set(true);
    this.contabilidadService.getCuentas(rut).subscribe({
      next: (data) => {
        this.cuentas.set(data);
        this.isInitialLoading.set(false);

        if (data.length === 0) {
          this.isSelectionMode.set(true);
          this.previewCuentas.set([]);
          this.origenPlanCtrl.reset();
        } else {
          this.isSelectionMode.set(false);
        }
      },
      error: () => {
        this.isInitialLoading.set(false);
        this.isSelectionMode.set(false);
      }
    });
  }

  onOrigenChange(value: string) {
    if (!value) {
      this.previewCuentas.set([]);
      return;
    }
    
    this.previewLoading.set(true);
    
    if (value.startsWith('plan_')) {
      const planId = parseInt(value.split('_')[1], 10);
      this.contabilidadService.getPlantillaCuentas(planId).subscribe({
        next: (data) => {
          this.previewCuentas.set(data);
          this.previewLoading.set(false);
        },
        error: () => this.previewLoading.set(false)
      });
    } else if (value.startsWith('empresa_')) {
      const rut = value.split('_')[1];
      this.contabilidadService.getCuentas(rut).subscribe({
        next: (data) => {
          this.previewCuentas.set(data);
          this.previewLoading.set(false);
        },
        error: () => this.previewLoading.set(false)
      });
    }
  }

  clonarPlan() {
    const rutDestino = this.appState.empresaRutActiva();
    const origen = this.origenPlanCtrl.value;
    
    if (!rutDestino || !origen) return;
    
    this.isCloning.set(true);
    
    const payload: any = { empresaRut: rutDestino };
    if (origen.startsWith('plan_')) {
      payload.origenPlanId = parseInt(origen.split('_')[1], 10);
    } else if (origen.startsWith('empresa_')) {
      payload.origenEmpresaRut = origen.split('_')[1];
    }
    
    this.contabilidadService.clonarCuentas(payload).subscribe({
      next: () => {
        this.toastService.success('Plan de cuentas configurado exitosamente');
        this.isCloning.set(false);
        this.cargarCuentas(); // Esto recargará las cuentas y automáticamente apagará el isSelectionMode
      },
      error: (err) => {
        this.isCloning.set(false);
        const errorMsg = err.error?.message || 'Error al clonar el plan';
        this.toastService.error(errorMsg);
      }
    });
  }

  openCrear() {
    const dialogRef = this.dialog.open(CrearCuentaDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) {
        this.cargarCuentas();
        this.toastService.success('Cuenta creada con éxito');
      }
    });
  }

  editar(cuenta: CuentaContable) {
    const dialogRef = this.dialog.open(CrearCuentaDialogComponent, {
      width: '400px',
      data: cuenta
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) {
        this.cargarCuentas();
        this.toastService.success('Cuenta actualizada con éxito');
      }
    });
  }

  eliminar(codigo: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Cuenta',
        message: `¿Estás seguro que deseas eliminar la cuenta ${codigo}? Solo será posible si no tiene movimientos contables asociados.`,
        confirmText: 'Eliminar',
        isDestructive: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const rut = this.appState.empresaRutActiva();
        if (!rut) return;
        this.contabilidadService.eliminarCuenta(rut, codigo).subscribe({
          next: () => {
            this.toastService.success(`Cuenta ${codigo} eliminada correctamente.`);
            this.cargarCuentas();
          },
          error: (err: any) => {
            const errorMsg = err.error?.message || err.message || 'Error desconocido';
            this.toastService.error(`Error al eliminar: ${errorMsg}`);
          }
        });
      }
    });
  }
}
