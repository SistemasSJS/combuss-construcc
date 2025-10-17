// src/app/services/zebra-browser-print.service.ts
import { Injectable } from '@angular/core';


declare global {
  interface Window {
    ZebraBrowserPrint?: any; // wrapper UMD (si lo usas)
    BrowserPrint?: any;      // librería oficial del agente
  }
}

@Injectable({ providedIn: 'root' })

export class ZebraBrowserPrintService {
  private device: any | null = null;

  private getApi() {
    return window.ZebraBrowserPrint?.BrowserPrint || window.BrowserPrint;
  }

  private escapeZpl(s: string) { return s.replace(/[~^]/g, ' '); }

  private buildZpl(qrContent: string, labelText?: string) {
    const safe = this.escapeZpl(qrContent);
    const text = labelText ? this.escapeZpl(labelText) : '';
    return '^XA^PW600^LL400^CI28' +
           '^FO60,60^BQN,2,6^FDMA,' + safe + '^FS' +
           (text ? '^FO60,260^A0N,30,30^FD' + (text.length>28?text.slice(0,27)+'…':text) + '^FS' : '') +
           '^XZ';
  }

  private async ensureDevice() {
    const api = this.getApi();
    if (!api) throw new Error('Browser Print no está disponible (carga https://localhost:9101/BrowserPrint.js y acepta el certificado)');
    if (this.device) return this.device;
    const dev = await api.getDefaultDevice('printer');
    if (!dev) throw new Error('No hay impresora por defecto en Browser Print');
    this.device = dev;
    return dev;
  }

  async printQr(qrContent: string, labelText?: string) {
    const api = this.getApi();
    const dev = await this.ensureDevice();
    const zpl = this.buildZpl(qrContent, labelText);
    await new Promise<void>((res, rej) => dev.send(zpl, () => res(), (e: any) => rej(e)));
  }

  async listPrinters(): Promise<any[]> {
    const api = this.getApi();
    if (!api) throw new Error('Browser Print no disponible');
    return new Promise((res, rej) => api.getLocalDevices(res, rej, 'printer'));
  }

}
