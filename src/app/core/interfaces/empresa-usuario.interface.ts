export interface Empresa {
  rut: string;
  razonSocial: string;
  giro: string;
  direccion?: string;
  comuna?: string;
  ciudad?: string;
  telefono?: string;
  correo?: string;
  representanteNombre?: string;
  representanteRut?: string;
  activa?: boolean;
  transferenciaHabilitada?: boolean;
  transferenciaDestinoEmail?: string | null;
  duenoActual?: { nombre: string; email: string; id: string } | null;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'CONTADOR' | 'ADMIN';
  activo: boolean;
}
