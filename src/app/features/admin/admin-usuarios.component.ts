import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { Usuario } from '../../core/interfaces/empresa-usuario.interface';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule
  ],
  template: `
    <div class="space-y-6 animate-fade-in p-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div class="flex items-center justify-between w-full md:w-auto md:flex-1">
          <div>
            <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Gestión de Contadores</h1>
            <p class="text-slate-500 mt-1">Administra los accesos y suscripciones de los contadores registrados.</p>
          </div>
          <button mat-flat-button class="!bg-violet-600 !text-white !rounded-xl !px-6 !py-6" (click)="openNuevoUsuarioModal()">
            <mat-icon class="mr-2">person_add</mat-icon>
            Crear Contador
          </button>
        </div>
        
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full md:w-72 bg-white rounded-lg">
          <mat-icon matPrefix class="text-slate-400 mr-2">search</mat-icon>
          <input matInput type="search"
                 placeholder="Buscar por nombre o email..."
                 autocomplete="off"
                 spellcheck="false"
                 data-lpignore="true"
                 data-1p-ignore="true"
                 data-form-type="other"
                 [ngModel]="searchQuery()"
                 (ngModelChange)="searchQuery.set($event)">
          <button *ngIf="searchQuery()" matSuffix mat-icon-button aria-label="Limpiar" (click)="searchQuery.set('')">
            <mat-icon>close</mat-icon>
          </button>
        </mat-form-field>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table mat-table [dataSource]="filteredUsuarios()" class="w-full">
          <!-- Nombre Column -->
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef class="font-semibold text-slate-600 bg-slate-50/50"> Nombre </th>
            <td mat-cell *matCellDef="let element">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {{ element.nombre.charAt(0) }}
                </div>
                <span class="font-medium text-slate-800">{{ element.nombre }}</span>
              </div>
            </td>
          </ng-container>

          <!-- Email Column -->
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef class="font-semibold text-slate-600 bg-slate-50/50"> Email </th>
            <td mat-cell *matCellDef="let element" class="text-slate-600"> {{ element.email }} </td>
          </ng-container>

          <!-- Rol Column -->
          <ng-container matColumnDef="rol">
            <th mat-header-cell *matHeaderCellDef class="font-semibold text-slate-600 bg-slate-50/50"> Rol </th>
            <td mat-cell *matCellDef="let element">
              <span class="px-2.5 py-1 rounded-full text-xs font-medium"
                    [class.bg-purple-100]="element.rol === 'ADMIN'" [class.text-purple-700]="element.rol === 'ADMIN'"
                    [class.bg-blue-100]="element.rol === 'CONTADOR'" [class.text-blue-700]="element.rol === 'CONTADOR'">
                {{ element.rol }}
              </span>
            </td>
          </ng-container>

          <!-- Suscripción (Activo) Column -->
          <ng-container matColumnDef="activo">
            <th mat-header-cell *matHeaderCellDef class="font-semibold text-slate-600 bg-slate-50/50"> Suscripción </th>
            <td mat-cell *matCellDef="let element">
              <div class="flex items-center gap-2">
                <mat-slide-toggle
                  [checked]="element.activo"
                  [disabled]="element.rol === 'ADMIN' || isToggling()"
                  (change)="toggleStatus(element.id, $event.checked)">
                </mat-slide-toggle>
                <span class="text-sm font-medium" [ngClass]="element.activo ? 'text-emerald-600' : 'text-slate-400'">
                  {{ element.activo ? 'Activa' : 'Inactiva' }}
                </span>
              </div>
            </td>
          </ng-container>

          <!-- Acciones Column -->
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef class="font-semibold text-slate-600 bg-slate-50/50 text-right pr-6"> Acciones </th>
            <td mat-cell *matCellDef="let element" class="text-right pr-6">
              <button
                mat-icon-button
                [disabled]="resendingId() === element.id"
                (click)="reenviarInvitacion(element)"
                matTooltip="Reenviar invitación por correo"
                class="!text-violet-600">
                <mat-icon>{{ resendingId() === element.id ? 'hourglass_empty' : 'mail' }}</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-slate-50/50 transition-colors"></tr>
        </table>
        
        <div *ngIf="usuarios().length > 0 && filteredUsuarios().length === 0" class="p-8 text-center text-slate-500">
          No se encontraron resultados para "{{ searchQuery() }}".
        </div>
        
        <div *ngIf="usuarios().length === 0" class="p-8 text-center text-slate-500">
          No hay usuarios registrados.
        </div>
      </div>
    </div>
  `
})
export class AdminUsuariosComponent implements OnInit {
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  public usuarios = signal<Usuario[]>([]);
  public searchQuery = signal<string>('');
  
  public filteredUsuarios = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.usuarios();
    
    return this.usuarios().filter(u => 
      u.nombre.toLowerCase().includes(query) || 
      u.email.toLowerCase().includes(query) ||
      u.rol.toLowerCase().includes(query)
    );
  });

  public displayedColumns: string[] = ['nombre', 'email', 'rol', 'activo', 'acciones'];
  public isToggling = signal<boolean>(false);
  public resendingId = signal<string | null>(null);

  ngOnInit() {
    this.loadUsuarios();
  }

  loadUsuarios() {
    this.adminService.getUsuarios().subscribe({
      next: (data) => this.usuarios.set(data),
      error: (err) => {
        this.snackBar.open('Error cargando usuarios', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openNuevoUsuarioModal() {
    const dialogRef = this.dialog.open(NuevoUsuarioDialogComponent, {
      width: '450px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsuarios();
      }
    });
  }

  toggleStatus(id: string, newStatus: boolean) {
    this.isToggling.set(true);
    this.adminService.toggleUserStatus(id).subscribe({
      next: (res) => {

        this.usuarios.update(users => users.map(u => u.id === id ? res.usuario : u));
        this.snackBar.open(res.mensaje, 'Cerrar', { duration: 3000 });
        this.isToggling.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error al cambiar estado', 'Cerrar', { duration: 3000 });
        this.isToggling.set(false);
        this.loadUsuarios(); // Reload to reset toggle
      }
    });
  }

  reenviarInvitacion(usuario: Usuario) {
    this.resendingId.set(usuario.id);
    this.adminService.reenviarInvitacion(usuario.id).subscribe({
      next: (res) => {
        this.snackBar.open(
          res.message || `Invitación reenviada a ${usuario.email}`,
          'Cerrar',
          { duration: 4000 },
        );
        this.resendingId.set(null);
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || 'Error al reenviar la invitación',
          'Cerrar',
          { duration: 4000 },
        );
        this.resendingId.set(null);
      },
    });
  }
}

@Component({
  selector: 'app-nuevo-usuario-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatButtonModule, 
    MatIconModule, 
    MatFormFieldModule, 
    MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title class="!font-bold !text-xl !text-slate-800 flex items-center">
      <mat-icon class="mr-2 text-violet-600">person_add</mat-icon>
      Crear Nuevo Contador
    </h2>
    <mat-dialog-content class="!pt-4">
      <p class="text-slate-500 mb-6 text-sm">
        Ingresa los datos del nuevo contador. El sistema le enviará un correo de invitación para que configure su contraseña de acceso de forma segura.
      </p>

      <form [formGroup]="userForm" class="flex flex-col gap-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre Completo</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej. Juan Pérez">
          <mat-error *ngIf="userForm.get('nombre')?.hasError('required')">El nombre es obligatorio</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Correo Electrónico</mat-label>
          <input matInput type="email" formControlName="email" placeholder="ejemplo@correo.com">
          <mat-error *ngIf="userForm.get('email')?.hasError('required')">El correo es obligatorio</mat-error>
          <mat-error *ngIf="userForm.get('email')?.hasError('email')">Ingresa un correo válido</mat-error>
        </mat-form-field>
      </form>

      <div *ngIf="errorMessage" class="p-3 bg-red-50 text-red-600 rounded-lg text-sm mt-4 border border-red-100 flex items-start">
        <mat-icon class="mr-2 text-sm mt-0.5">error_outline</mat-icon>
        <span>{{ errorMessage }}</span>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!px-6 !pb-6">
      <button mat-button mat-dialog-close [disabled]="isLoading">Cancelar</button>
      <button mat-flat-button class="!bg-violet-600 !text-white" 
              [disabled]="userForm.invalid || isLoading" 
              (click)="onSubmit()">
        <mat-spinner *ngIf="isLoading" diameter="20" class="mr-2 inline-block"></mat-spinner>
        <span>{{ isLoading ? 'Invitando...' : 'Enviar Invitación' }}</span>
      </button>
    </mat-dialog-actions>
  `
})
export class NuevoUsuarioDialogComponent {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private dialogRef = inject(MatDialogRef<NuevoUsuarioDialogComponent>);
  private snackBar = inject(MatSnackBar);

  public isLoading = false;
  public errorMessage: string | null = null;

  public userForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.userForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = null;

    const payload = this.userForm.value;

    this.adminService.inviteUsuario(payload).subscribe({
      next: (res) => {
        this.snackBar.open(res.message || 'Invitación enviada exitosamente', 'Cerrar', { duration: 4000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Hubo un error al enviar la invitación.';
        this.isLoading = false;
      }
    });
  }
}

