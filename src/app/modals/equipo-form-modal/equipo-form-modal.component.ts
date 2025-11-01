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
  //imagenBaseUrl = 'https://apicons.ddns.net:8093'; // sin `/api`
  //imagenBaseUrl = 'http://appconstruc.test'; // sin `/api`
  imagenBaseUrl = 'http://192.168.100.5:8000';
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
      const logoRatio = 0.30; // 22% del ancho del QR
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
    // Medidas de la etiqueta en mm
    const pageW = 76;
    const pageH = 50;

    // Layout internos en mm
    const margin = 3;
    const qrSize = 35;   // lado del QR dentro del PDF
    const gap = 4;       // espacio entre QR y texto
    const baseFont = 36; // tamaño base de la clave

    // 1) Obtener canvas del QR
    const qrCanvas = this.qrHost?.nativeElement.querySelector('canvas') as HTMLCanvasElement | null;
    if (!qrCanvas) {
      console.error('No se encontró el canvas del QR.');
      return;
    }

    // 2) Componer QR + logo sobre un canvas temporal
    const composedDataUrl = await this.componerQrConLogo(qrCanvas);
    if (!composedDataUrl) {
      console.error('No se pudo componer el QR con el logo.');
      return;
    }

    // 3) Crear PDF 76x50 mm
    const pdf = new jsPDF({
      orientation: 'landscape',   // 'p' | 'portrait' | 'l' | 'landscape'
      unit: 'mm',                // 'mm' | 'pt' | 'px' | 'in' ...
      format: [pageW, pageH],    // [ancho, alto] en la unidad elegida
      compress: true,            // ✅ no 'compressPdf'
    });

    // Posición del QR: alineado a la izquierda, centrado verticalmente
    const qrX = margin;
    const qrY = (pageH - qrSize) / 2;
    pdf.addImage(composedDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    // 4) Texto (clave) a la derecha
    const textX = qrX + qrSize + gap;
    const textMaxW = pageW - textX - margin;

    pdf.setFont('helvetica', 'bold');
    let fs = baseFont;
    pdf.setFontSize(fs);

    // Si no cabe, reducir fuente
    while (fs > 10 && pdf.getTextWidth(this.clave) > textMaxW) {
      fs -= 2;
      pdf.setFontSize(fs);
    }

    // Centrar verticalmente
    const textY = pageH / 2 + fs * 0.35;
    pdf.text(this.clave, textX, textY, { baseline: 'middle' });

    // 5) Descargar
    pdf.save(`Etiqueta-${this.clave}.pdf`);
  }

  /**
   * Dibuja el canvas del QR y el logo centrado sobre un canvas temporal.
   * Devuelve un dataURL PNG listo para addImage.
   */
  private async componerQrConLogo(qrCanvas: HTMLCanvasElement): Promise<string | null> {
    // Buscar el <img> del logo dentro del host
    const logoImg = this.qrHost?.nativeElement.querySelector('img.qr-logo') as HTMLImageElement | null;

    // Canvas temporal
    const tmp = document.createElement('canvas');
    tmp.width = qrCanvas.width;
    tmp.height = qrCanvas.height;
    const ctx = tmp.getContext('2d');
    if (!ctx) return null;

    // Fondo blanco (por si el logo tiene transparencia)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tmp.width, tmp.height);

    // Dibujar QR original
    ctx.drawImage(qrCanvas, 0, 0);

    // Dibujar logo centrado (si existe)
    if (logoImg && logoImg.complete) {
      // tamaño del logo relativo al QR (ajusta este factor a tu gusto)
      const factor = 0.22; // 22% del lado del QR
      const lw = tmp.width * factor;
      const lh = tmp.height * factor;
      const lx = (tmp.width - lw) / 2;
      const ly = (tmp.height - lh) / 2;

      try {
        // Si el logo viene de otra origin, podría “taint” el canvas.
        // Procura usar assets locales (assets/logo.png) o un dataURL.
        ctx.drawImage(logoImg, lx, ly, lw, lh);
      } catch (_) {
        console.warn('No se pudo dibujar el logo (posible CORS). Continuo con el QR solo.');
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
