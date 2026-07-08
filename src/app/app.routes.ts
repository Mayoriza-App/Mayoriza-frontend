import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./features/auth/auth-callback.component').then(m => m.AuthCallbackComponent)
  },
  {
    path: 'auth/set-password',
    loadComponent: () => import('./features/auth/set-password.component').then(m => m.SetPasswordComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'comprobantes/nuevo',
        loadComponent: () => import('./features/comprobantes/nuevo-asiento.component').then(m => m.NuevoAsientoComponent)
      },
      {
        path: 'comprobantes/editar/:id',
        loadComponent: () => import('./features/comprobantes/nuevo-asiento.component').then(m => m.NuevoAsientoComponent)
      },
      {
        path: 'comprobantes',
        loadComponent: () => import('./features/comprobantes/lista-comprobantes.component').then(m => m.ListaComprobantesComponent)
      },
      {
        path: 'reportes/libro-diario',
        loadComponent: () => import('./features/reportes/libro-diario.component').then(m => m.LibroDiarioComponent)
      },
      {
        path: 'reportes/balance',
        loadComponent: () => import('./features/reportes/balance-ocho-columnas.component').then(m => m.BalanceOchoColumnasComponent)
      },
      {
        path: 'reportes/libro-mayor',
        loadComponent: () => import('./features/reportes/libro-mayor.component').then(m => m.LibroMayorComponent)
      },
      {
        path: 'reportes/balance-clasificado',
        loadComponent: () => import('./features/reportes/balance-clasificado.component').then(m => m.BalanceClasificadoComponent)
      },
      {
        path: 'reportes/estado-resultados',
        loadComponent: () => import('./features/reportes/estado-resultados.component').then(m => m.EstadoResultadosComponent)
      },
      {
        path: 'procesos',
        loadComponent: () => import('./features/procesos/procesos.component').then(m => m.ProcesosComponent)
      },
      {
        path: 'configuracion/plan-cuentas',
        loadComponent: () => import('./features/configuracion/plan-cuentas.component').then(m => m.PlanCuentasComponent)
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./features/configuracion/configuracion.component').then(m => m.ConfiguracionComponent)
      },
      {
        path: 'admin/dashboard',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'admin/empresas',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/admin-empresas.component').then(m => m.AdminEmpresasComponent)
      },
      {
        path: 'admin/usuarios',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/admin-usuarios.component').then(m => m.AdminUsuariosComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
