import {
  Component,
  Input,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { jsPDF } from 'jspdf';
import { ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Equipo } from 'src/app/models/equipo.models';
import { QRCodeComponent } from 'angularx-qrcode';
//import { ZebraBrowserPrintService } from 'src/app/services/zebra-print.service';
import { ToastController } from '@ionic/angular';
import {
  CatalogoService,
  TipoEquipo,
  TipoCombustible,
  Operador,
  Unidad,
} from 'src/app/services/catalogo.service';

@Component({
  selector: 'app-equipo-form-modal',
  templateUrl: './equipo-form-modal.component.html',
  styleUrls: ['./equipo-form-modal.component.scss'],
  standalone: false,
})
export class EquipoFormModalComponent implements OnInit {
  @Input() equipo: Equipo | null = null;
  @ViewChild('qrHost', { static: false }) qrHost!: ElementRef<HTMLElement>;

  form!: FormGroup;
  tipos: TipoEquipo[] = [];
  combustibles: TipoCombustible[] = [];
  operadores: Operador[] = [];
  unidades: Unidad[] = [];
  cargando = true;
  errorCarga = '';
  previewUrl: string | null = null;
  qrData = ''; 
  clave  = '';
  imagenBaseUrl = 'https://apicons.ddns.net:8093'; // sin `/api`
  //imagenBaseUrl = 'http://appconstruc.test'; // sin `/api`
  //imagenBaseUrl = 'http://192.168.100.6:8000';
  estados = ['ACTIVO', 'INACTIVO', 'TALLER', 'BAJA'];

  obras = [
    { id: 1, nombre: 'Obra Norte' },
    { id: 2, nombre: 'Obra Sur' },
  ];

  //qrData: string = '';

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private catalogoSvc: CatalogoService,
    //private zebra: ZebraBrowserPrintService,
    private toast: ToastController
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      numeco: [this.equipo?.numeco || '', Validators.required],
      nombre: [this.equipo?.nombre || '', Validators.required],
      tipo: [this.equipo?.tipo || null, Validators.required],
      estado: [this.equipo?.estado || 'ACTIVO', Validators.required],
      placas: [this.equipo?.placas || ''],
      vigenciaplacas: [this.equipo?.vigenciaplacas || ''],
      poliza: [this.equipo?.poliza || ''],
      vigenciapoliza: [this.equipo?.vigenciapoliza || ''],
      noserie: [this.equipo?.noserie || ''],
      peso: [this.equipo?.peso || null],
      combustible: [this.equipo?.combustible || null],
      responsable: [this.equipo?.responsable || ''],
      //operador: [this.equipo?.operador || ''],
      foto: [this.equipo?.foto || ''],
      unidad_rend: [this.equipo?.unidad_rend || null],
      rango_inferior: [this.equipo?.unidad_rend || null],
      rango_superior: [this.equipo?.unidad_rend || null],
      id_operador: [this.equipo?.id_operador || null],
      //obra: [this.equipo?.obra || null],
    });

    if (this.equipo) {
      this.form.patchValue(this.equipo);

      this.generarQR();

      // Si el equipo tiene una imagen previa, úsala como previsualización
      if (this.equipo.foto) {
        this.previewUrl = `${this.imagenBaseUrl}${this.equipo.foto}`;
        console.log(this.previewUrl);
      }
    }

    Promise.all([
      this.catalogoSvc.getTiposEquipo().toPromise(),
      this.catalogoSvc.getCombustibles().toPromise(),
      this.catalogoSvc.getOperadores().toPromise(),
      this.catalogoSvc.getUnidades().toPromise(),
    ])
      .then(([tipos, combs, operadores, unidades]) => {
        // asegúrate de que los IDs sean number
        this.tipos = (tipos ?? []).map((t) => ({
          id: +t.id,
          nombre: t.nombre,
        }));
        this.combustibles = (combs ?? []).map((c) => ({
          id: +c.id,
          nombre: c.nombre,
        }));
        this.operadores = (operadores ?? []).map((o) => ({
          id: +o.id,
          nombre: o.nombre,
        }));
        this.unidades = (unidades ?? []).map((u) => ({
          id: +u.id,
          nombre: u.nombre,
        }));

        // si venía valor como string, conviértelo a number para que haga match
        const vTipo = this.form.get('tipo')?.value;
        const vComb = this.form.get('combustible')?.value;
        const vOper = this.form.get('operador')?.value;
        const vUnid = this.form.get('unidad')?.value;
        if (typeof vTipo === 'string') this.form.patchValue({ tipo: +vTipo });
        if (typeof vComb === 'string')
          this.form.patchValue({ combustible: +vComb });
        if (typeof vOper === 'string')
          this.form.patchValue({ operador: +vOper });
        if (typeof vUnid === 'string') this.form.patchValue({ unidad: +vUnid });
      })
      .catch((err) => {
        console.error(err);
        this.errorCarga = 'No se pudieron cargar los catálogos';
      })
      .finally(() => (this.cargando = false));
  }

  // útil si el backend devuelve strings y el form guarda number
  compareById = (a: any, b: any) => (+a || a) === (+b || b);

  guardar() {
    if (this.form.valid) {
      const data: Equipo = { ...this.equipo, ...this.form.value };
      this.modalCtrl.dismiss(data);
    } else {
      this.form.markAllAsTouched();
    }
  }

  cancelar() {
    this.modalCtrl.dismiss(null);
  }

  subirFoto(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validación de tipo y tamaño
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!tiposPermitidos.includes(file.type)) {
        return alert('Solo se permiten imágenes JPG o PNG');
      }

      if (file.size > 2 * 1024 * 1024) {
        return alert('El archivo no puede superar los 2MB');
      }

      this.previewUrl = URL.createObjectURL(file);

      this.catalogoSvc.uploadFoto(file).subscribe({
        next: (res) => {
          this.form.patchValue({ foto: res.ruta });
        },
        error: () => {
          alert('Error al subir imagen');
        },
      });
    }
  }

  eliminarImagen() {
    this.previewUrl = null;
    this.form.patchValue({ foto: null });
  }

  generarQR() {
    const values = this.form.value;
    console.log(values);

    // puedes generar un JSON
    this.qrData = JSON.stringify({
      numeco: values.numeco,
      descripcion: values.nombre,
      idcombustible: values.combustible,
    });
    this.clave = 'NumEco ' + values.numeco;
  }

  descargarQR() {
    const host = this.qrHost?.nativeElement;
    if (!host) return;

    const qrCanvas: HTMLCanvasElement | null = host.querySelector('canvas');
    if (!qrCanvas) return;

    const size = qrCanvas.width; // cuadrado
    const out = document.createElement('canvas');
    out.width = size;
    out.height = size;
    const ctx = out.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;

    // 1) dibuja el QR
    ctx.drawImage(qrCanvas, 0, 0);

    // 2) dibuja un recuadro blanco y el logo encima (centrado)
    const logo = new Image();
    logo.crossOrigin = 'anonymous';

    logo.src = 'assets/img/logo.png';
    logo.onload = () => {
      const logoRatio = 0.3; // 22% del ancho del QR
      const logoSize = Math.floor(size * logoRatio);

      // fondo blanco redondeado detrás del logo para no “ensuciar” el QR
      const padding = Math.max(4, Math.floor(logoSize * 0.12));
      const boxW = logoSize + padding * 2;
      const boxH = logoSize + padding * 2;
      const boxX = Math.floor((size - boxW) / 2);
      const boxY = Math.floor((size - boxH) / 2);

      // redondeado
      const r = Math.floor(boxW * 0.12);
      ctx.fillStyle = '#ffffff';
      this.roundRect(ctx, boxX, boxY, boxW, boxH, r);
      ctx.fill();

      // logo centrado
      const x = Math.floor((size - logoSize) / 2);
      const y = Math.floor((size - logoSize) / 2);
      ctx.drawImage(logo, x, y, logoSize, logoSize);

      // 3) descarga
      const a = document.createElement('a');
      a.download = `qr_${this.equipo?.numeco || 'equipo'}.png`;
      //a.download = `qr_actual.png`;
      a.href = out.toDataURL('image/png');
      a.click();
    };
  }

  async descargarPDF() {
    // === Medidas del PDF (mm) ===
    const pageW = 76;
    const pageH = 50;

    // === Layout interno (mm) ===
    const margin = 3;
    const qrSize = 35; // lado del QR dentro del PDF
    const gap = 4; // separación QR ↔ texto

    // 1) Obtener el canvas del QR
    const qrCanvas = this.qrHost?.nativeElement.querySelector(
      'canvas'
    ) as HTMLCanvasElement | null;
    if (!qrCanvas) {
      console.error('No se encontró el canvas del QR.');
      return;
    }

    // 2) Componer QR + logo en un canvas temporal para “hornearlo” en una sola imagen
    const composedDataUrl = await this.componerQrConLogo(qrCanvas);
    if (!composedDataUrl) {
      console.error('No se pudo componer el QR con el logo.');
      return;
    }

    // 3) Crear el PDF exacto 76x50 mm
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [pageW, pageH],
      compress: true, // <- usar 'compress' (no 'compressPdf')
    });

    // 4) Dibujar el QR a la izquierda, centrado verticalmente
    const qrX = margin;
    const qrY = (pageH - qrSize) / 2;
    pdf.addImage(composedDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    // 5) Preparar el texto en dos líneas
    //    Si la clave viene "NumEco 03", la partimos en ["NumEco", "03"].
    //    Si ya viene con salto de línea, lo respetamos.
    const raw = (this.clave ?? '').trim();
    let line1 = '',
      line2 = '';
    if (raw.includes('\n')) {
      const [a, b = ''] = raw.split('\n');
      line1 = a.trim();
      line2 = b.trim();
    } else {
      const parts = raw.split(/\s+/);
      if (parts.length >= 2) {
        line1 = parts.slice(0, -1).join(' ');
        line2 = parts.slice(-1)[0];
      } else {
        line1 = raw; // si no hay segunda parte, se imprime una sola línea
      }
    }

    // 6) Área disponible para el texto
    const textX = qrX + qrSize + gap;
    const textMaxW = pageW - textX - margin;

    // 7) Tipografías y ajuste a ancho
    pdf.setFont('helvetica', 'bold');

    // Tamaños base (ajústalos a tu gusto)
    let fs1 = 20; // para la línea 1 (ej. "NumEco")
    let fs2 = 28; // para la línea 2 (ej. "03")

    const shrinkToFit = (txt: string, fsInit: number) => {
      let fs = fsInit;
      if (!txt) return fs;
      pdf.setFontSize(fs);
      while (pdf.getTextWidth(txt) > textMaxW && fs > 8) {
        fs -= 1;
        pdf.setFontSize(fs);
      }
      return fs;
    };

    fs1 = shrinkToFit(line1, fs1);
    fs2 = shrinkToFit(line2, fs2);

    // 8) Calcular posición vertical para centrar el bloque de dos líneas
    //    Aproximamos la "altura visual" de una línea como 0.7 * fontSize (en mm)
    const lineGap = 3; // separación entre líneas en mm
    const h1 = line1 ? fs1 * 0.7 : 0;
    const h2 = line2 ? fs2 * 0.7 : 0;
    const totalH = h1 + h2 + (line1 && line2 ? lineGap : 0);

    const centerY = pageH / 2;
    // Baseline 'middle': colocamos cada línea en el centro de su caja
    const y1 = line1 ? centerY - totalH / 2 + h1 / 2 : centerY;
    const y2 = line2 ? (line1 ? y1 + h1 / 2 + lineGap + h2 / 2 : centerY) : 0;

    // 9) Pintar texto
    if (line1) {
      pdf.setFontSize(fs1);
      pdf.text(line1, textX, y1, { baseline: 'middle' });
    }
    if (line2) {
      pdf.setFontSize(fs2);
      pdf.text(line2, textX, y2, { baseline: 'middle' });
    }

    // 10) Descargar
    pdf.save(`Etiqueta-${raw.replace(/\s+/g, '_')}.pdf`);
  }

  /**
   * Compone el QR (canvas) y el logo centrado en un canvas temporal.
   * Devuelve dataURL PNG listo para insertar en el PDF.
   * Nota: usa un logo dentro de /assets para evitar CORS.
   */
  private async componerQrConLogo(
    qrCanvas: HTMLCanvasElement
  ): Promise<string | null> {
    const logoImg = this.qrHost?.nativeElement.querySelector(
      'img.qr-logo'
    ) as HTMLImageElement | null;

    const tmp = document.createElement('canvas');
    tmp.width = qrCanvas.width;
    tmp.height = qrCanvas.height;
    const ctx = tmp.getContext('2d');
    if (!ctx) return null;

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tmp.width, tmp.height);

    // QR original
    ctx.drawImage(qrCanvas, 0, 0);

    // Logo centrado (si existe y está cargado)
    if (logoImg && logoImg.complete) {
      const factor = 0.22; // 22% del lado del QR
      const lw = tmp.width * factor;
      const lh = tmp.height * factor;
      const lx = (tmp.width - lw) / 2;
      const ly = (tmp.height - lh) / 2;
      try {
        ctx.drawImage(logoImg, lx, ly, lw, lh);
      } catch {
        console.warn(
          'No se pudo dibujar el logo (posible CORS). Continúo solo con el QR.'
        );
      }
    }

    return tmp.toDataURL('image/png');
  }

  // helper para rectángulos redondeados
  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  /*
  async imprimirQR() {
    try {
      if (!this.qrData) {
        const v = this.form.value;
        this.qrData = JSON.stringify({
          numeco: v.numeco,
          descripcion: v.desc_equipo,
          idcombustible: v.id_combustible,
        });
      }
      const numeco = this.form.get('numeco')?.value?.toString()?.trim() || '';
      await this.zebra.printQr(this.qrData, numeco);
      (await this.toast.create({ message: 'Impresión enviada', duration: 1500, color: 'success' })).present();
    } catch (e: any) {
      (await this.toast.create({ message: e?.message || 'No se pudo imprimir', duration: 2500, color: 'danger' })).present();
    }
  }
  */
}
