import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ImportResult } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { apiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  private readonly api = inject(ApiService);
  selectedFile: File | null = null;
  importResult: ImportResult | null = null;
  errorMessage = '';
  isImporting = false;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    this.importResult = null;
    this.errorMessage = '';
  }

  downloadTemplate(): void {
    this.api.getImportTemplate().subscribe({
      next: (blob) => this.downloadBlob(blob, 'plantilla-importacion-firmeza.xlsx'),
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, 'No se pudo descargar la plantilla.');
      },
    });
  }

  importWorkbook(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Selecciona un archivo .xlsx para importar.';
      return;
    }
    this.isImporting = true;
    this.errorMessage = '';
    this.importResult = null;
    this.api.importFile(this.selectedFile).subscribe({
      next: (result) => {
        this.importResult = result;
        this.isImporting = false;
      },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, 'No se pudo importar el archivo.');
        this.isImporting = false;
      },
    });
  }

  downloadIssues(): void {
    const issues = this.importResult?.issues;
    if (!issues?.length) return;
    const csv = [
      ['Hoja', 'Fila', 'Inconsistencia'],
      ...issues.map((issue) => [issue.worksheet, String(issue.row), issue.message]),
    ]
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';'))
      .join('\r\n');
    this.downloadBlob(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }), 'log-importacion-firmeza.csv');
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
