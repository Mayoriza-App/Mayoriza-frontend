import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AppStateService } from '../../core/state/app.state';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { switchMap, catchError, of, map, BehaviorSubject, combineLatest, concat, startWith } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { EmpresaService } from '../../core/services/empresa.service';
import { Empresa } from '../../core/interfaces/empresa-usuario.interface';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfirmDialogComponent } from '../../shared/components/dialogs/confirm-dialog.component';
import { formatRut, rutValidator } from '../../core/utils/rut.util';
import { EditarEmpresaDialogComponent } from './components/editar-empresa-dialog/editar-empresa-dialog.component';
import { HabilitarTransferenciaDialogComponent } from './components/habilitar-transferencia-dialog/habilitar-transferencia-dialog.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule, 
    MatTabsModule, 
    MatTableModule, 
    MatIconModule, 
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './configuracion.component.html',
})
export class ConfiguracionComponent {
  public appState = inject(AppStateService);
  private contabilidadService = inject(ContabilidadService);
  public authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  public empresaService = inject(EmpresaService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public isAdmin = this.authService.currentUser()?.rol === 'ADMIN';

  public selectedTabIndex = 0;

  private empresaRut$ = this.appState.empresaRutActiva$;

  public perfilForm = this.fb.group({
    nombre: [this.authService.currentUser()?.nombre || '', Validators.required],
    email: [{ value: this.authService.currentUser()?.email || '', disabled: true }],
    rol: [{ value: this.authService.currentUser()?.rol || '', disabled: true }]
  });

  public isSavingProfile = false;
  public profileMessage = '';

  guardarPerfil() {
    const user = this.authService.currentUser();
    if (this.perfilForm.valid && user) {
      this.isSavingProfile = true;
      this.usuarioService.update(user.id, { nombre: this.perfilForm.value.nombre! }).subscribe({
        next: (updatedUser) => {
          this.authService.currentUser.set(updatedUser); // Actualiza el header automáticamente
          this.profileMessage = 'Perfil actualizado exitosamente';
          this.isSavingProfile = false;
        },
        error: () => {
          this.profileMessage = 'Error al actualizar el perfil';
          this.isSavingProfile = false;
        }
      });
    }
  }

  public empresasResource = toSignal(
    this.appState.refreshEmpresas$.pipe(switchMap(() => this.empresaService.findAll())), 
    { initialValue: [] }
  );

  public filtroEmpresas = signal<'activas' | 'inactivas'>('activas');

  public empresasFiltradas = computed(() => {
    const empresas = this.empresasResource() || [];
    if (this.filtroEmpresas() === 'activas') {
      return empresas.filter(e => e.activa !== false);
    } else {
      return empresas.filter(e => e.activa === false);
    }
  });
  
  public empresasColumns = ['rut', 'razonSocial', 'giro', 'acciones'];

  public nuevaEmpresaForm = this.fb.group({
    rut: ['', [Validators.required, rutValidator]],
    razonSocial: ['', Validators.required],
    giro: ['', Validators.required],
    direccion: [''],
    comuna: [''],
    ciudad: [''],
    telefono: [''],
    correo: [''],
    representanteNombre: [''],
    representanteRut: ['', [rutValidator]]
  });

  constructor() {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'empresas') {
        this.selectedTabIndex = 1;
      }
    });

    this.nuevaEmpresaForm.get('rut')?.valueChanges.subscribe(value => {
      if (value) {
        const formatted = formatRut(value);
        if (formatted !== value) {
          this.nuevaEmpresaForm.get('rut')?.setValue(formatted, { emitEvent: false });
        }
      }
    });

    this.nuevaEmpresaForm.get('representanteRut')?.valueChanges.subscribe(value => {
      if (value) {
        const formatted = formatRut(value);
        if (formatted !== value) {
          this.nuevaEmpresaForm.get('representanteRut')?.setValue(formatted, { emitEvent: false });
        }
      }
    });
  }

  public isSavingEmpresa = false;
  public empresaMessage = '';

  seleccionarEmpresa(rut: string) {
    this.appState.setEmpresa(rut);
  }

  editarEmpresa(empresa: Empresa, event: Event) {
    event.stopPropagation(); // Avoid triggering seleccionarEmpresa when clicking the edit button
    const dialogRef = this.dialog.open(EditarEmpresaDialogComponent, {
      width: '600px',
      data: empresa,
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.appState.triggerRefreshEmpresas(); // Actualiza globalmente
      }
    });
  }

  crearEmpresa() {
    if (this.nuevaEmpresaForm.valid) {
      this.isSavingEmpresa = true;
      const formValue = this.nuevaEmpresaForm.value;
      
      const payload: any = {
        rut: formValue.rut!,
        razonSocial: formValue.razonSocial!,
        giro: formValue.giro!
      };

      if (formValue.direccion) payload.direccion = formValue.direccion;
      if (formValue.comuna) payload.comuna = formValue.comuna;
      if (formValue.ciudad) payload.ciudad = formValue.ciudad;
      if (formValue.telefono) payload.telefono = formValue.telefono;
      if (formValue.correo) payload.correo = formValue.correo;
      if (formValue.representanteNombre) payload.representanteNombre = formValue.representanteNombre;
      if (formValue.representanteRut) payload.representanteRut = formValue.representanteRut;

      this.empresaService.create(payload).subscribe({
        next: (empresa) => {
          this.empresaMessage = '';
          this.isSavingEmpresa = false;
          this.nuevaEmpresaForm.reset();
          this.appState.triggerRefreshEmpresas(); // Actualiza globalmente

          this.appState.setEmpresa(empresa.rut);

          const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
              title: 'Empresa Creada',
              message: 'La empresa se ha creado exitosamente. ¿Deseas configurar su plan de cuentas ahora?',
              confirmText: 'Ir a Plan de Cuentas',
              cancelText: 'Más tarde'
            }
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              this.router.navigate(['/configuracion/plan-cuentas']);
            }
          });
        },
        error: (err) => {
          this.empresaMessage = err.error?.message || 'Error al crear la empresa (¿El RUT ya existe?)';
          this.isSavingEmpresa = false;
        }
      });
    }
  }

  habilitarTransferencia(empresa: Empresa, event: Event) {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(HabilitarTransferenciaDialogComponent, {
      width: '500px',
      data: empresa,
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe((targetEmail: string | undefined) => {
      if (targetEmail) {
        this.empresaService.habilitarTransferencia(empresa.rut, targetEmail).subscribe({
          next: () => {
            this.appState.triggerRefreshEmpresas();
            this.toastService.success(`Transferencia habilitada para ${targetEmail}`);
          },
          error: (err) => {
            this.toastService.error(err.error?.message || 'Error al habilitar la transferencia');
            console.error(err);
          }
        });
      }
    });
  }

  toggleActiva(empresa: Empresa, event: Event) {
    event.stopPropagation();
    const nuevoEstado = empresa.activa === false ? true : false;
    
    this.empresaService.cambiarEstadoEmpresa(empresa.rut, nuevoEstado).subscribe({
      next: (res) => {
        this.appState.triggerRefreshEmpresas();
        this.toastService.success(res.message);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Error al cambiar estado');
      }
    });
  }

  public cuentasResource = toSignal(
    this.empresaRut$.pipe(
      switchMap(rut => {
        if (!rut) return of({ loading: false, data: [], error: 'No hay empresa seleccionada' });
        return this.contabilidadService.getCuentas(rut).pipe(
          map(data => ({ loading: false, data, error: null })),
          startWith({ loading: true, data: [], error: null }),
          catchError(err => of({ loading: false, data: [], error: err.message }))
        );
      })
    ),
    { initialValue: { loading: true, data: [], error: null } }
  );

  public tercerosResource = toSignal(
    this.contabilidadService.getTerceros().pipe(
      map(data => ({ loading: false, data, error: null })),
      catchError(err => of({ loading: false, data: [], error: err.message }))
    ),
    { initialValue: { loading: true, data: [], error: null } }
  );

  public centrosCostoResource = toSignal(
    this.empresaRut$.pipe(
      switchMap((rut) => {
        if (!rut) return of({ data: [], loading: false, error: null });
        return this.contabilidadService.getCentrosCosto(rut).pipe(
          map(data => ({ loading: false, data, error: null })),
          startWith({ loading: true, data: [], error: null }),
          catchError(err => of({ loading: false, data: [], error: err.message }))
        );
      })
    ),
    { initialValue: { loading: true, data: [], error: null } }
  );

  public cuentasColumns = ['codigo', 'nombre', 'tipo'];
  public tercerosColumns = ['rut', 'razonSocial', 'giro'];
  public centrosCostoColumns = ['id', 'nombre'];
}
