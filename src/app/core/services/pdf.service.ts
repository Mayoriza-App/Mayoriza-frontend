import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Comprobante } from '../interfaces/comprobante.interface';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { LibroMayorCompletoResponse } from './reporte.service';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private datePipe = new DatePipe('es-CL');
  private currencyPipe = new CurrencyPipe('es-CL');

  constructor() {}

  /**
   * Genera y descarga el PDF de un Comprobante Contable
   * @param comprobante Los datos del comprobante a exportar
   * @param empresaInfo Objeto con RUT y Razón Social de la Empresa para la cabecera
   */
  exportarComprobante(comprobante: Comprobante, empresaInfo: { rut: string, razonSocial: string }) {

    const doc = new jsPDF('p', 'mm', 'letter');

    const primaryColor: [number, number, number] = [124, 58, 237]; // bg-violet-600
    const textColor: [number, number, number] = [51, 65, 85];     // text-slate-700
    const lightGray: [number, number, number] = [241, 245, 249];  // bg-slate-100

    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(empresaInfo.razonSocial.toUpperCase(), 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(`RUT: ${empresaInfo.rut}`, 14, 26);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`COMPROBANTE DE ${comprobante.tipo}`, 200, 20, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setTextColor(225, 29, 72); // rose-600 for Folio
    const folioId = comprobante.id ? comprobante.id.toString() : 'BORRADOR';
    doc.text(`N° ${folioId}`, 200, 28, { align: 'right' });

    doc.setDrawColor(226, 232, 240); // border-slate-200
    doc.setLineWidth(0.5);
    doc.line(14, 32, 200, 32);

    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', 14, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(this.datePipe.transform(comprobante.fecha, 'dd/MM/yyyy') || '', 30, 42);

    doc.setFont('helvetica', 'bold');
    doc.text('Glosa General:', 14, 48);
    doc.setFont('helvetica', 'normal');

    const glosaLines = doc.splitTextToSize(comprobante.glosaGeneral, 150);
    doc.text(glosaLines, 45, 48);

    const tableStartY = 48 + (glosaLines.length * 5) + 5;

    let totalDebe = 0;
    let totalHaber = 0;

    const tableRows = comprobante.movimientos.map(mov => {
      totalDebe += Number(mov.debe);
      totalHaber += Number(mov.haber);
      
      const glosa = mov.glosaLinea || '';
      const tercero = mov.terceroRut ? `RUT: ${mov.terceroRut}` : '-';

      return [
        mov.cuentaCodigo,
        '', // Sin nombre de cuenta por ahora en este DTO
        glosa,
        tercero,
        mov.debe > 0 ? this.currencyPipe.transform(mov.debe, 'CLP', '', '1.0-0') : '-',
        mov.haber > 0 ? this.currencyPipe.transform(mov.haber, 'CLP', '', '1.0-0') : '-'
      ];
    });

    tableRows.push([
      '', 
      '', 
      '', 
      'TOTALES', 
      this.currencyPipe.transform(totalDebe, 'CLP', '', '1.0-0')!, 
      this.currencyPipe.transform(totalHaber, 'CLP', '', '1.0-0')!
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['Código', 'Cuenta', 'Detalle', 'Tercero', 'Debe', 'Haber']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' }, // Código
        1: { cellWidth: 40 }, // Cuenta
        2: { cellWidth: 45 }, // Glosa
        3: { cellWidth: 25, halign: 'center' }, // Tercero
        4: { cellWidth: 25, halign: 'right' }, // Debe
        5: { cellWidth: 25, halign: 'right' }  // Haber
      },
      styles: {
        fontSize: 8,
        textColor: textColor,
        lineColor: [226, 232, 240]
      },
      alternateRowStyles: {
        fillColor: lightGray
      },
      didParseCell: function(data) {

        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.textColor = primaryColor;
          
          if (data.column.index >= 4) {
             data.cell.styles.halign = 'right';
          } else if (data.column.index === 3) {
             data.cell.styles.halign = 'right';
          }
        }
      }
    });


    const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 50;

    if (finalY > 230) {
      doc.addPage();
    }

    const firmY = finalY > 230 ? 50 : finalY + 40;

    doc.setDrawColor(textColor[0], textColor[1], textColor[2]);
    doc.setLineWidth(0.5);

    doc.line(30, firmY, 80, firmY);
    doc.setFontSize(8);
    doc.text('Preparado por', 55, firmY + 5, { align: 'center' });

    doc.line(135, firmY, 185, firmY);
    doc.text('Revisado / Aprobado por', 160, firmY + 5, { align: 'center' });

    const fileName = `Comprobante_${comprobante.tipo}_${comprobante.id}.pdf`;
    doc.save(fileName);
  }

  /**
   * Genera y descarga el PDF del Libro Mayor, organizando los asientos contables por cuenta.
   * Calcula subtotales por cuenta e imprime en formato clásico de columnas financieras.
   * 
   * @param data - Datos completos del Libro Mayor (cuentas, líneas, y saldos iniciales)
   * @param empresaInfo - Información de la empresa para la cabecera (rut y razón social)
   */
  exportarLibroMayorCompleto(data: LibroMayorCompletoResponse, empresaInfo: { rut: string, razonSocial: string }) {
    const doc = new jsPDF('p', 'mm', 'letter');
    
    const primaryColor: [number, number, number] = [0, 0, 0]; // Black
    const textColor: [number, number, number] = [0, 0, 0];    // Black
    const lightGray: [number, number, number] = [255, 255, 255]; // White (No fill)

    const mesNombre = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    let periodoTexto = '';
    if (data.periodoMes && data.periodoAnio) {
      periodoTexto = `${mesNombre[data.periodoMes - 1]} de ${data.periodoAnio}`;
    } else if (data.periodoAnio) {
      periodoTexto = `Año ${data.periodoAnio}`;
    } else {
      periodoTexto = 'Histórico Completo';
    }

    const drawHeader = (hookData: any) => {
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('courier', 'bold');
      doc.text(empresaInfo.razonSocial.toUpperCase(), 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('courier', 'normal');
      doc.text(`RUT: ${empresaInfo.rut}`, 14, 26);
      
      doc.setFontSize(16);
      doc.setFont('courier', 'bold');
      doc.text('LIBRO MAYOR', 200, 20, { align: 'right' });
      
      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('courier', 'normal');
      doc.text(`Período: ${periodoTexto}`, 200, 26, { align: 'right' });
      
      doc.setDrawColor(0, 0, 0); // Black line
      doc.setLineWidth(0.2);
      doc.line(14, 30, 200, 30);

      const pageText = `Pág. ${hookData.pageNumber}`;
      doc.setFontSize(8);
      doc.text(pageText, 200, 10, { align: 'right' });
    };

    const formatCurrency = (val: number) => this.currencyPipe.transform(val, 'CLP', '', '1.0-0') || '0';

    const body: any[] = [];
    
    data.cuentas.forEach(cuenta => {

      body.push([
        { 
          content: `Cuenta : ${cuenta.cuentaCodigo}           ${cuenta.cuentaNombre.toUpperCase()}`, 
          colSpan: 6, 
          styles: { fillColor: lightGray, fontStyle: 'bold', textColor: primaryColor, cellPadding: {top: 5, bottom: 2, left: 2, right: 2} } 
        }
      ]);

      if (cuenta.saldoInicial !== undefined) {
        let saldoInicialStr = formatCurrency(Math.abs(cuenta.saldoInicial));
        if ((cuenta.esDeudor && cuenta.saldoInicial < 0) || (!cuenta.esDeudor && cuenta.saldoInicial > 0)) saldoInicialStr += 'CR';

        const inicialDebe = (cuenta.esDeudor && cuenta.saldoInicial > 0) || (!cuenta.esDeudor && cuenta.saldoInicial < 0) ? formatCurrency(Math.abs(cuenta.saldoInicial)) : '0';
        const inicialHaber = (!cuenta.esDeudor && cuenta.saldoInicial > 0) || (cuenta.esDeudor && cuenta.saldoInicial < 0) ? formatCurrency(Math.abs(cuenta.saldoInicial)) : '0';

        body.push([
          '',
          '',
          'Acumulaciones meses anteriores :',
          inicialDebe,
          inicialHaber,
          saldoInicialStr
        ]);
      }

      cuenta.lineas.forEach(l => {
        let saldoStr = formatCurrency(Math.abs(l.saldoAcumulado));
        if ((cuenta.esDeudor && l.saldoAcumulado < 0) || (!cuenta.esDeudor && l.saldoAcumulado > 0)) saldoStr += 'CR';

        body.push([
          this.datePipe.transform(l.fecha, 'dd/MM/yyyy') || '',
          `${l.comprobanteTipo.substring(0,3).toUpperCase()} ${String(l.comprobanteId)}`,
          (l.glosaLinea || '').substring(0, 45),
          l.debe > 0 ? formatCurrency(l.debe) : '0',
          l.haber > 0 ? formatCurrency(l.haber) : '0',
          saldoStr
        ]);
      });
      
      if (cuenta.lineas.length === 0 && !cuenta.saldoInicial) {
        body.push([{ content: 'Sin movimientos registrados', colSpan: 6, styles: { fontStyle: 'italic', textColor: 150, halign: 'center' } }]);
      }

      let totalSaldoStr = formatCurrency(Math.abs(cuenta.saldoFinal));
      if ((cuenta.esDeudor && cuenta.saldoFinal < 0) || (!cuenta.esDeudor && cuenta.saldoFinal > 0)) totalSaldoStr += 'CR';

      body.push([
        { content: `Total Cuenta: ${cuenta.cuentaNombre.toUpperCase()}`, colSpan: 3, styles: { fontStyle: 'bold', halign: 'left', fillColor: lightGray } },
        { content: formatCurrency(cuenta.totalDebe), styles: { fontStyle: 'bold', halign: 'right', fillColor: lightGray } },
        { content: formatCurrency(cuenta.totalHaber), styles: { fontStyle: 'bold', halign: 'right', fillColor: lightGray } },
        { content: totalSaldoStr, styles: { fontStyle: 'bold', halign: 'right', fillColor: lightGray } }
      ]);

      body.push([
        { content: '', colSpan: 6, styles: { fillColor: [255, 255, 255], cellPadding: 2, lineWidth: 0 } }
      ]);
    });

    autoTable(doc, {
      startY: 35,
      theme: 'plain',
      styles: {
        font: 'courier',
        fontSize: 8,
        textColor: textColor,
        cellPadding: 1,
      },
      headStyles: {
        fillColor: lightGray,
        textColor: textColor,
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: { bottom: 0.2 },
        lineColor: [0, 0, 0]
      },
      head: [[
        'Fecha', 'Comprobante', 'Glosa', 'Debe', 'Haber', 'Saldo'
      ]],
      body: body,
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 65 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
      },
      didDrawPage: drawHeader,
      margin: { top: 35, bottom: 20, left: 14, right: 14 }
    });

    const fileName = `Libro_Mayor_${empresaInfo.rut}_${periodoTexto.replace(/ /g, '_')}.pdf`;
    doc.save(fileName);
  }
}
