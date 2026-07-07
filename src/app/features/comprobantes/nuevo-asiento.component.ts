import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AppStateService } from '../../core/state/app.state';
import { ComprobanteService } from '../../core/services/comprobante.service';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { TerceroService } from '../../core/services/tercero.service';
import { CentroCostoService } from '../../core/services/centro-costo.service';
import { AuthService } from '../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CrearCuentaDialogComponent } from './components/crear-cuenta-dialog.component';
import { CrearTerceroDialogComponent } from './components/crear-tercero-dialog.component';
import { CrearCentroCostoDialogComponent } from './components/crear-centro-costo-dialog.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FilterCuentasPipe } from '../../shared/pipes/filter-cuentas.pipe';
import { CuentaContable } from '../../core/interfaces/contabilidad.interface';
import { Tercero, CentroCosto } from '../../core/interfaces/tercero.interface';

@Component({
  selector: 'app-nuevo-asiento',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    RouterModule,
    MatAutocompleteModule,
    FilterCuentasPipe
  ],
  templateUrl: './nuevo-asiento.component.html',
})
export class NuevoAsientoComponent {
  private fb = inject(FormBuilder);
  public appState = inject(AppStateService);
  private comprobanteService = inject(ComprobanteService);
  private contabilidadService = inject(ContabilidadService);
  private terceroService = inject(TerceroService);
  private centroCostoService = inject(CentroCostoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  public authService = inject(AuthService);


  public cuentas = signal<CuentaContable[]>([]);
  public terceros = signal<Tercero[]>([]);
  public centrosCosto = signal<CentroCosto[]>([]);

  public editId = signal<number | null>(null);

  public modoAvanzado = signal<boolean>(false);

  constructor() {

    this.contabilidadService.getCuentas(this.appState.empresaRutActiva()!).subscribe(data => this.cuentas.set(data));
    this.terceroService.findAll().subscribe(data => this.terceros.set(data));
    this.centroCostoService.findAll().subscribe(data => this.centrosCosto.set(data));

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editId.set(Number(idParam));
      this.cargarComprobante(this.editId()!);
    } else {

      this.addMovimiento();
      this.addMovimiento();
    }
  }

  private cargarComprobante(id: number) {
    this.comprobanteService.findOne(id).subscribe({
      next: (comprobante) => {

        const [y, m, d] = comprobante.fecha.split('-');
        this.asientoForm.patchValue({
          tipo: comprobante.tipo,
          fecha: new Date(Number(y), Number(m) - 1, Number(d)),
          glosaGeneral: comprobante.glosaGeneral
        });

        comprobante.movimientos?.forEach(m => {
          const movGroup = this.fb.group({
            cuentaCodigo: [m.cuentaCodigo, Validators.required],
            terceroRut: [m.terceroRut],
            centroCostoId: [m.centroCostoId],
            glosaLinea: [m.glosaLinea],
            debe: [m.debe === 0 ? null : m.debe, [Validators.min(0)]],
            haber: [m.haber === 0 ? null : m.haber, [Validators.min(0)]]
          });
          this.movimientos.push(movGroup);
        });
      },
      error: () => this.errorMessage.set('Error al cargar el comprobante para edición')
    });
  }

  public asientoForm = this.fb.group({
    tipo: ['INGRESO', Validators.required],
    fecha: [new Date(), Validators.required],
    glosaGeneral: ['', [Validators.required, Validators.maxLength(255)]],
    movimientos: this.fb.array([])
  });

  public isSubmitting = signal(false);
  public errorMessage = signal<string | null>(null);

  private formChanges = toSignal(this.asientoForm.valueChanges, { initialValue: this.asientoForm.value });

  public totales = computed(() => {
    const formVal = this.formChanges();
    let sumDebe = 0;
    let sumHaber = 0;
    
    formVal.movimientos?.forEach((mov: any) => {
      sumDebe += Number(mov.debe) || 0;
      sumHaber += Number(mov.haber) || 0;
    });

    return {
      debe: sumDebe,
      haber: sumHaber,
      cuadrado: sumDebe === sumHaber && sumDebe > 0,
      diferencia: Math.abs(sumDebe - sumHaber)
    };
  });

  get movimientos() {
    return this.asientoForm.get('movimientos') as FormArray;
  }

  openCrearCuentaDialog(index: number) {
    const dialogRef = this.dialog.open(CrearCuentaDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe((nuevaCuenta: CuentaContable | undefined) => {
      if (nuevaCuenta) {

        this.cuentas.update(list => [...list, nuevaCuenta].sort((a, b) => a.codigo.localeCompare(b.codigo)));

        const control = this.movimientos.at(index).get('cuentaCodigo');
        control?.setValue(nuevaCuenta.codigo);
      }
    });
  }

  openCrearTerceroDialog(index: number) {
    const dialogRef = this.dialog.open(CrearTerceroDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe((nuevoTercero: Tercero | undefined) => {
      if (nuevoTercero) {
        this.terceros.update(list => [...list, nuevoTercero].sort((a, b) => a.razonSocial.localeCompare(b.razonSocial)));
        const control = this.movimientos.at(index).get('terceroRut');
        control?.setValue(nuevoTercero.rut);
      }
    });
  }

  openCrearCentroCostoDialog(index: number) {
    const dialogRef = this.dialog.open(CrearCentroCostoDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe((nuevoCc: CentroCosto | undefined) => {
      if (nuevoCc) {
        this.centrosCosto.update(list => [...list, nuevoCc].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        const control = this.movimientos.at(index).get('centroCostoId');
        control?.setValue(nuevoCc.id);
      }
    });
  }

  addMovimiento() {
    const movGroup = this.fb.group({
      cuentaCodigo: ['', Validators.required],
      terceroRut: [null],
      centroCostoId: [null],
      glosaLinea: [''],
      debe: [null, [Validators.min(0)]],
      haber: [null, [Validators.min(0)]]
    });
    this.movimientos.push(movGroup);
  }

  removeMovimiento(index: number) {
    if (this.movimientos.length > 2) {
      this.movimientos.removeAt(index);
    }
  }

  onSubmit() {
    if (this.asientoForm.invalid || !this.totales().cuadrado) {
      this.asientoForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const val = this.asientoForm.value;
    const fechaObj = val.fecha as Date;

    const payload = {
      empresaRut: this.appState.empresaRutActiva()!,
      tipo: val.tipo as 'INGRESO' | 'EGRESO' | 'TRASPASO',
      fecha: `${fechaObj.getFullYear()}-${String(fechaObj.getMonth() + 1).padStart(2, '0')}-${String(fechaObj.getDate()).padStart(2, '0')}`,
      glosaGeneral: val.glosaGeneral!,
      periodoMes: fechaObj.getMonth() + 1,
      periodoAnio: fechaObj.getFullYear(),
      movimientos: val.movimientos!.map((m: any) => ({
        cuentaCodigo: m.cuentaCodigo ? m.cuentaCodigo.split(' ')[0] : '',
        terceroRut: m.terceroRut && m.terceroRut !== 'null' ? m.terceroRut : undefined,
        centroCostoId: m.centroCostoId && m.centroCostoId !== 'null' ? Number(m.centroCostoId) : undefined,
        debe: m.debe ? Number(m.debe) : 0,
        haber: m.haber ? Number(m.haber) : 0,
        glosaLinea: m.glosaLinea && m.glosaLinea.trim() !== '' ? m.glosaLinea : val.glosaGeneral
      }))
    };

    const isEdit = this.editId() !== null;
    const request$ = isEdit 
      ? this.comprobanteService.update(this.editId()!, payload)
      : this.comprobanteService.create(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/comprobantes']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const backendError = err.error?.message;
        const finalMsg = Array.isArray(backendError) 
          ? backendError.join(', ') 
          : backendError || err.message || 'Error al guardar el comprobante';
        this.errorMessage.set(finalMsg);
      }
    });
  }

  displayCuenta = (codigo: string): string => {
    if (!codigo) return '';
    const cuenta = this.cuentas().find(c => c.codigo === codigo);
    return cuenta ? `${cuenta.codigo} - ${cuenta.nombre}` : codigo;
  };
}
