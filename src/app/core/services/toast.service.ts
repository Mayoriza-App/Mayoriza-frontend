import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastComponent, ToastData } from '../../shared/components/toast/toast.component';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private snackBar = inject(MatSnackBar);

  success(message: string, duration: number = 3000) {
    this.show('success', message, duration);
  }

  error(message: string, duration: number = 5000) {
    this.show('error', message, duration);
  }

  warning(message: string, duration: number = 4000) {
    this.show('warning', message, duration);
  }

  info(message: string, duration: number = 3000) {
    this.show('info', message, duration);
  }

  private show(type: ToastData['type'], message: string, duration: number) {
    this.snackBar.openFromComponent(ToastComponent, {
      data: { type, message },
      duration: duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['custom-toast-panel']
    });
  }
}
