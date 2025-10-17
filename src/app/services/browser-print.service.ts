import { Injectable } from '@angular/core';

declare const BrowserPrint: any;
declare global { interface Window { BrowserPrint?: any; } }

@Injectable({ providedIn: 'root' })
export class BrowserPrintService {
  private loadPromise?: Promise<void>;
  private isReady = false;

  /** Carga BrowserPrint.js del agente local (primero HTTPS 9101 y fallback a HTTP 9100) */
  private loadScript(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise<void>((resolve, reject) => {
      const inject = (src: string, onload: () => void, onerror: () => void) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = onload;
        s.onerror = onerror;
        document.head.appendChild(s);
      };

      const https = 'https://127.0.0.1:9101/BrowserPrint.js';
      const http  = 'http://127.0.0.1:9100/BrowserPrint.js';

      inject(
        https,
        () => { this.isReady = true; resolve(); },
        () => {
          // Fallback a HTTP si HTTPS falla
          inject(
            http,
            () => { this.isReady = true; resolve(); },
            () => reject(new Error('No se pudo cargar BrowserPrint.js (HTTPS ni HTTP). ¿Agente corriendo?'))
          );
        }
      );
    });

    return this.loadPromise;
  }

  /** Asegura que window.BrowserPrint esté disponible */
  async ensureReady(): Promise<void> {
    await this.loadScript();
    if (!window.BrowserPrint) {
      throw new Error('BrowserPrint no disponible. Revisa certificado HTTPS y allowed_origins del agente.');
    }
  }

  /** Obtiene la impresora por defecto */
  async getDefaultPrinter(): Promise<any> {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      BrowserPrint.getDefaultDevice('printer', resolve, reject);
    });
  }

  /** Lista impresoras disponibles (útil para elegir una específica) */
  async getPrinters(): Promise<any[]> {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      BrowserPrint.getLocalDevices((devices: any[]) => {
        const printers = devices.filter(d => d && d.deviceType === 'printer');
        resolve(printers);
      }, reject, 'printer');
    });
  }

  /** Envía ZPL a la impresora (por defecto o una pasada) */
  async printZPL(zpl: string, printer?: any): Promise<void> {
    const dev = printer ?? await this.getDefaultPrinter();
    if (!dev) throw new Error('No se encontró impresora por defecto.');
    return new Promise<void>((resolve, reject) => {
      dev.send(zpl, () => resolve(), (err: any) => reject(err || new Error('Fallo al imprimir')));
    });
  }

  /** Construye ZPL de un QR con texto visible debajo */
  buildZplQR(
    data: string,
    opts?: {
      model?: 1 | 2;    // Modelo QR
      mag?: number;     // Magnificación (tamaño)
      ec?: 'L' | 'M' | 'Q' | 'H';  // Corrección de error
      w?: number;       // ancho etiqueta
      h?: number;       // alto etiqueta
      x?: number;       // X del QR
      y?: number;       // Y del QR
      textX?: number;   // X del texto
      textY?: number;   // Y del texto
      fontSize?: number;// Tamaño fuente del texto
    }
  ): string {
    const {
      model = 2,
      mag = 6,
      ec = 'M',
      w = 400,
      h = 300,
      x = 50,
      y = 50,
      textX = 50,
      textY = 200,
      fontSize = 30,
    } = opts || {};

    return (
`^XA
^PW${w}
^LL${h}
^FO${x},${y}^BQN,${model},${mag}
^FDLA,${data}^FS
^FO${textX},${textY}^A0N,${fontSize},${fontSize}^FD${data}^FS
^XZ`
    ).trim();
  }
}
