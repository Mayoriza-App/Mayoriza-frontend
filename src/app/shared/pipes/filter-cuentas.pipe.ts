import { Pipe, PipeTransform } from '@angular/core';
import { CuentaContable } from '../../core/interfaces/contabilidad.interface';

@Pipe({
  name: 'filterCuentas',
  standalone: true
})
export class FilterCuentasPipe implements PipeTransform {
  transform(cuentas: CuentaContable[], searchText: any): CuentaContable[] {
    if (!cuentas) return [];
    if (!searchText || typeof searchText !== 'string') return cuentas;
    
    searchText = searchText.toLowerCase();
    
    return cuentas.filter(c => {
      const displayStr = `${c.codigo} - ${c.nombre}`.toLowerCase();
      return displayStr.includes(searchText);
    });
  }
}
