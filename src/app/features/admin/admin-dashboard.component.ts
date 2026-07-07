import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AdminService, EmpresaConDueño } from '../../core/services/admin.service';
import { Usuario } from '../../core/interfaces/empresa-usuario.interface';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-6 animate-fade-in p-8">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard General</h1>
        <p class="text-slate-500 mt-1">Visión global de la plataforma Mayoriza.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Contadores Activos -->
        <div class="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center">
          <div class="bg-emerald-100 text-emerald-600 p-4 rounded-xl mr-5">
            <mat-icon class="text-4xl h-[40px] w-[40px]">verified_user</mat-icon>
          </div>
          <div>
            <p class="text-slate-500 font-medium mb-1 leading-tight">Contadores<br>Activos</p>
            <h2 class="text-4xl font-black text-slate-800">{{ contadoresActivos() }}</h2>
          </div>
        </div>

        <!-- Contadores Inactivos -->
        <div class="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center">
          <div class="bg-rose-100 text-rose-600 p-4 rounded-xl mr-5">
            <mat-icon class="text-4xl h-[40px] w-[40px]">block</mat-icon>
          </div>
          <div>
            <p class="text-slate-500 font-medium mb-1 leading-tight">Contadores<br>Inactivos</p>
            <h2 class="text-4xl font-black text-slate-800">{{ contadoresInactivos() }}</h2>
          </div>
        </div>

        <!-- Empresas -->
        <div class="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center">
          <div class="bg-indigo-100 text-indigo-600 p-4 rounded-xl mr-5">
            <mat-icon class="text-4xl h-[40px] w-[40px]">domain</mat-icon>
          </div>
          <div>
            <p class="text-slate-500 font-medium mb-1 leading-tight">Empresas<br>Registradas</p>
            <h2 class="text-4xl font-black text-slate-800">{{ empresas().length || 0 }}</h2>
          </div>
        </div>

        <!-- Admins -->
        <div class="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center">
          <div class="bg-amber-100 text-amber-600 p-4 rounded-xl mr-5">
            <mat-icon class="text-4xl h-[40px] w-[40px]">admin_panel_settings</mat-icon>
          </div>
          <div>
            <p class="text-slate-500 font-medium mb-1 leading-tight">Admins<br>Totales</p>
            <h2 class="text-4xl font-black text-slate-800">{{ admins() }}</h2>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent {
  private adminService = inject(AdminService);
  
  public usuarios = toSignal(this.adminService.getUsuarios(), { initialValue: [] as Usuario[] });
  public empresas = toSignal(this.adminService.getEmpresas(), { initialValue: [] as EmpresaConDueño[] });

  public contadoresActivos = computed(() => this.usuarios().filter(u => u.rol === 'CONTADOR' && u.activo).length);
  public contadoresInactivos = computed(() => this.usuarios().filter(u => u.rol === 'CONTADOR' && !u.activo).length);
  public admins = computed(() => this.usuarios().filter(u => u.rol === 'ADMIN').length);
}
