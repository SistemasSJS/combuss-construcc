// src/app/pages/nueva-carga/nueva-carga.page.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import imageCompression from 'browser-image-compression';

import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';
import { CatalogoService, Obras } from 'src/app/services/catalogo.service';
import { CargasService } from '../../services/cargas.service';
import { ModalController, NavParams } from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
  CapacitorBarcodeScannerCameraDirection,
} from '@capacitor/barcode-scanner';

@Component({
  selector: 'app-nueva-carga',
  templateUrl: './nueva-carga.page.html',
  standalone: false,
})
export class NuevaCargaPage implements OnInit {
  readonly serieFija = 'CA'; // <- tu serie fija
  //obras: Array<{ id: number; nombre: string }> = [];
  scanMsg: string = '';
  // tu JSON del QR
  //form: any;   // tu form reactivo

  //previewTicket?: string;
  //previewHoro?: string;
  blobTicket?: Blob;
  blobHoro?: Blob;
  cargando = false;
  cargandoTicket = false;
  cargandoHoro = false;
  previewTicket: string | null = null;
  previewHoro: string | null = null;
  scannerOpen = false;
  devices: MediaDeviceInfo[] = [];
  currentDevice?: MediaDeviceInfo;
  torchOn = false;
  torchAvailable = false;
  errorCarga = '';
  obras: Obras[] = [];

  openScanner() {
    this.scannerOpen = true;
  }
  closeScanner() {
    this.scannerOpen = false;
    this.torchOn = false;
  }

  form = this.fb.group({
    serie: [this.serieFija, Validators.required],
    folio: [this.fb.control<number | null>(null), Validators.required],

    fecha: [new Date().toISOString().substring(0, 10), Validators.required],
    mes: [new Date().toISOString().substring(0, 7), Validators.required], // ej: 2025-08
    hora: [new Date().toTimeString().substring(0, 8)],

    // Captura de número económico y derivaciones
    numeco: this.fb.control<string | null>(null, {
      validators: Validators.required,
    }),
    id_equipo: this.fb.control<number | null>(null, {
      validators: Validators.required,
    }),
    desc_equipo: this.fb.control<string | null>(null, {
      validators: Validators.required,
    }),
    id_combustible: this.fb.control<number | null>(null, {
      validators: Validators.required,
    }),
        noserie: this.fb.control<string | null>(null, {
      validators: Validators.required,
    }),
    peso: this.fb.control<number | null>(null, {
      validators: Validators.required,
    }),
    horometro: [null],
    litros: [null, Validators.required],
    id_obra: this.fb.control<number | null>(null),
    latitud: this.fb.control<number | null>(null),
    longitud: this.fb.control<number | null>(null),
    foto_ticket: this.fb.control<string | null>(null, {
      validators: Validators.required,
    }),
    foto_horometro: this.fb.control<string | null>(null, {
      validators: Validators.required,
    }),
  });

  constructor(
    private fb: FormBuilder,
    private api: CargasService,
    private modalCtrl: ModalController,
    private catalogoSvc: CatalogoService,
    

    navParams: NavParams
  ) {
    const s = navParams.get('serieFija');
    if (s) this.serieFija = s;
  }

  ngOnInit() {
    // pedir consecutivo al cargar
    this.api
      .getNextFolio(this.serieFija)
      .subscribe((r) => this.form.patchValue({ folio: r.nextFolio }));
    this.setGPS();

    // 2) Fecha/hora del dispositivo
    const now = new Date();
    const fecha = this.fmtDate(now); // YYYY-MM-DD
    const hora = this.fmtTime(now); // HH:mm:ss
    this.form.patchValue({
      fecha,
      hora,
      mes: this.buildMesFromFecha(fecha), // YYYYMM
    });

    // 3) Actualiza mes cuando cambie la fecha
    this.form.get('fecha')?.valueChanges.subscribe((v) => {
      const yyyymm = this.buildMesFromFecha(v || '');
      this.form.get('mes')?.setValue(yyyymm, { emitEvent: false });
    });
    
    Promise.all([
      this.catalogoSvc.getObras().toPromise(),
    ])
      .then(([obras]) => {
        // asegúrate de que los IDs sean number
        this.obras = (obras ?? []).map((o) => ({
          id: +o.id,
          nombre: o.nombre,
        }));
        

        // si venía valor como string, conviértelo a number para que haga match
        const vObra = this.form.get('obra')?.value;
        
        if (typeof vObra === 'string') this.form.patchValue({ id_obra: +vObra });
        
      })
      .catch((err) => {
        console.error(err);
        this.errorCarga = 'No se pudieron cargar los catálogos';
      })
      .finally(() => (this.cargando = false));


    // 4) Cargar catálogo de obras
    //this.cargarObras();
  }

  compareById = (a: any, b: any) => (+a || a) === (+b || b); 

  private revokeIfBlob(url?: string | null) {
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
  }

  private parsePayload(content: string): { numeco?: string } {
    try {
      const j = JSON.parse(content);
      if (j?.numeco) return { numeco: String(j.numeco) };
    } catch {}
    try {
      const u = new URL(content);
      const ne = u.searchParams.get('numeco');
      if (ne) return { numeco: ne };
    } catch {}
    return { numeco: content.trim() || undefined };
  }

  onPerm(granted: boolean) {
    if (!granted) alert('Permiso de cámara denegado');
  }

  async scanQR() {
    console.log('esta scaneando');
    this.scanMsg = '';
    // Inicia el escaneo (la UI la da el plugin)
    const res = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.QR_CODE, // o .ALL
      scanInstructions: 'Alinea el código QR',
      scanButton: true,
      scanText: 'Cancelar',
      cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
    });

    const content = res?.ScanResult || ''; // ← viene en esta propiedad (mayúscula)
    if (!content) {
      this.scanMsg = 'No se leyó ningún código.';
      return;
    }

    const { numeco } = this.parsePayload(content);
    if (!numeco) {
      this.scanMsg = 'El QR no contiene "numeco".';
      return;
    }

    this.form.patchValue({ numeco });
    this.scanMsg = `QR leído: numeco=${numeco}`;

    // aquí podrías llamar tu servicio para traer los datos del equipo:
    // const equipo = await firstValueFrom(this.catalogoSvc.getEquipoPorNumeco(numeco));
    // this.form.patchValue({ ...equipo });
  }

  async setGPS() {
    const isWeb = Capacitor.getPlatform() === 'web';

    try {
      // En nativo sí pedimos permisos explícitos
      if (!isWeb) {
        const perm = await Geolocation.requestPermissions();
        // opcional: validar perm.location === 'granted'
      }

      // En web (y también en nativo) obtenemos la posición
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      this.form.patchValue({
        latitud: pos.coords.latitude,
        longitud: pos.coords.longitude,
      });
    } catch (e) {
      console.warn('GPS error', e);

      // Fallback extra para Web usando la API del navegador
      if (isWeb && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (p) => {
            this.form.patchValue({
              latitud: p.coords.latitude,
              longitud: p.coords.longitude,
            });
          },
          (err) => console.warn('navigator.geolocation error', err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    }
  }

  onCameras(devs: MediaDeviceInfo[]) {
    this.devices = devs;
    // intenta cámara trasera
    const back = devs.find((d) => /back|environment/i.test(d.label));
    this.currentDevice = back ?? devs[0];
    // algunos navegadores solo exponen torch en la trasera
    this.torchAvailable = !!back;
  }

  switchCam() {
    if (!this.devices.length) return;
    const idx = this.devices.findIndex(
      (d) => d.deviceId === this.currentDevice?.deviceId
    );
    const next = this.devices[(idx + 1) % this.devices.length];
    this.currentDevice = next;
  }

  toggleTorch() {
    this.torchOn = !this.torchOn;
  }
  
  onScanSuccess(content: string) {
    const raw = (content || '').trim();
    let numeco = raw;
    // si tus QR a veces traen JSON {"numeco":"..."}
    try {
      const o = JSON.parse(raw);
      if (o?.numeco) numeco = String(o.numeco);
    } catch {}

    // parchea el form y dispara tu búsqueda
    this.form.patchValue({ numeco });
    this.buscarEquipoPorNumero?.();

    // cierra y libera cámara
    this.closeScanner();
  }

  async compressImage(file: File): Promise<File> {
    const options = {
      maxSizeMB: 0.5, // por ejemplo, 0.5 MB
      maxWidthOrHeight: 1024, // redimensiona si es muy grande
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      console.log(`Tamaño original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Tamaño comprimido: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      return compressedFile;
    } catch (error) {
      console.error('Error al comprimir la imagen:', error);
      return file;
    }
  }

  async tomarFoto(tipo: 'ticket' | 'horometro') {
    try {
      const img = await Camera.getPhoto({
        source: CameraSource.Camera, // o Camera
        resultType: CameraResultType.Uri,
        quality: 70,
        allowEditing: false,
        // opcional: labels personalizados
        promptLabelHeader: 'Selecciona origen',
        promptLabelPhoto: 'Desde galería',
        promptLabelPicture: 'Tomar foto',
        promptLabelCancel: 'Cancelar',
      });
      
      
      // 1) Photo -> File
      const file = await this.photoToFile(
        img,
        `foto_${tipo}_${Date.now()}.jpg`
      );
      const compressedFile = await this.compressImage(file);
      
      // 2) Preview inmediato
      const objectUrl = URL.createObjectURL(compressedFile);
      if (tipo === 'ticket') {
        this.revokeIfBlob(this.previewTicket);
        this.previewTicket = objectUrl;
        this.subirYGuardar('ticket', compressedFile);
      } else {
        this.revokeIfBlob(this.previewHoro);
        this.previewHoro = objectUrl;
        this.subirYGuardar('horometro', compressedFile);
      }
    } catch (e) {
      console.error('tomarFoto error:', e);
      alert('No se pudo tomar la foto.');
    }
  }

  private subirYGuardar(tipo: 'ticket' | 'horometro', file: File) {
    const campoRuta = tipo === 'ticket' ? 'foto_ticket' : 'foto_horometro';
    if (tipo === 'ticket') this.cargandoTicket = true;
    else this.cargandoHoro = true;

    this.catalogoSvc
      .uploadFoto(file)
      .pipe(
        finalize(() => {
          if (tipo === 'ticket') this.cargandoTicket = false;
          else this.cargandoHoro = false;
        })
      )
      .subscribe({
        next: (res: { ruta: string }) => {
          // 3) Guardar la ruta devuelta por el servidor en el form
          this.form.patchValue({ [campoRuta]: res.ruta });
          // opcional: tostadita
          // this.toast('Imagen subida');
        },
        error: () => {
          alert('Error al subir imagen');
          // Si quieres, limpia el preview al fallar:
          if (tipo === 'ticket') {
            this.revokeIfBlob(this.previewTicket);
            this.previewTicket = null;
          } else {
            this.revokeIfBlob(this.previewHoro);
            this.previewHoro = null;
          }
        },
      });
  }

  private async photoToFile(photo: Photo, fileName: string): Promise<File> {
    if (photo.webPath) {
      const resp = await fetch(photo.webPath);
      const blob = await resp.blob();
      const type = blob.type || 'image/jpeg';
      return new File([blob], fileName, { type });
    }
    if (photo.base64String) {
      const byteString = atob(photo.base64String);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++)
        ia[i] = byteString.charCodeAt(i);
      return new File([ab], fileName, { type: 'image/jpeg' });
    }
    throw new Error('No image data');
  }
  enviar() {
    console.log('[enviar] click'); // <-- ¿se ve en consola?
    if (this.form.invalid) {
      console.log('[enviar] form inválido');
      console.log(this.form); // <-- ¿se ve esto?
      this.form.markAllAsTouched(); // muestra errores en UI
      return;
    }

    this.cargando = true; // <-- importante si usas [disabled]
    const fd = new FormData();
    // Rellena los campos:
    const v = this.form.value;

    fd.append('serie', v.serie ?? '');
    fd.append('folio', String(v.folio ?? ''));
    fd.append('fecha', String(v.fecha ?? ''));
    fd.append('mes', String(v.mes ?? ''));
    fd.append('hora', String(v.hora ?? ''));
    fd.append('numeco', String(v.numeco ?? ''));
    fd.append('id_equipo', String(v.id_equipo ?? ''));
    fd.append('desc_equipo', String(v.desc_equipo ?? ''));
    fd.append('id_combustible', String(v.id_combustible ?? ''));
    fd.append('id_obra', String(v.id_obra ?? ''));
    fd.append('litros', String(v.litros ?? ''));
    fd.append('horometro', String(v.horometro ?? ''));
    fd.append('latitud', String(v.latitud ?? ''));
    fd.append('longitud', String(v.longitud ?? ''));
    fd.append('foto_ticket', String(v.foto_ticket ?? ''));
    fd.append('foto_horometro', String(v.foto_horometro ?? ''));

    console.log('[enviar] FormData listo', fd);

    this.api
      .crearCarga(fd)
      .pipe(
        finalize(() => (this.cargando = false)) // <-- asegura reactivar el botón
      )
      .subscribe({
        next: () => {
          console.log('[enviar] éxito');
          // Si NO estás en modal, protege este llamado:
          this.modalCtrl?.dismiss?.(null, 'saved');
        },
        error: (err) => {
          console.error('[enviar] error', err);
          alert('Error: ' + (err?.error?.message || 'verifica datos'));
        },
      });
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  // ===== Helpers de formato =====
  private pad(n: number) {
    return n.toString().padStart(2, '0');
  }

  private fmtDate(d: Date) {
    const y = d.getFullYear();
    const m = this.pad(d.getMonth() + 1);
    const day = this.pad(d.getDate());
    return `${y}-${m}-${day}`;
  }

  private fmtTime(d: Date) {
    const hh = this.pad(d.getHours());
    const mm = this.pad(d.getMinutes());
    const ss = this.pad(d.getSeconds());
    return `${hh}:${mm}:${ss}`;
  }

  private buildMesFromFecha(fecha: string): string {
    // fecha 'YYYY-MM-DD' -> 'YYYYMM'
    if (!fecha || fecha.length < 7) return '';
    const [y, m] = fecha.split('-');
    return `${y}${m}`;
  }

  buscarEquipoPorNumero() {
    const numero = this.form.get('numeco')?.value;
    if (!numero) return;
    console.log(numero);
    this.cargando = true;
    this.api
      .buscarEquipoPorNumero(numero)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (eq) => {
          if (!eq) {
            alert('No se encontró equipo con ese número económico');
            // Limpia campos derivados
            this.form.patchValue({
              id_equipo: null,
              desc_equipo: '',
              id_combustible: null,
              noserie: '',
              peso: null,
            });
            return;
          }
          // Ajusta nombres de propiedades según tu API
          this.form.patchValue({
            id_equipo: eq.id,
            desc_equipo: eq.desc_equipo || '',
            id_combustible: eq.id_combustible ?? null,
            noserie: eq.noserie ?? null,
            peso: eq.peso ?? null,
          });
        },
        error: (e) => {
          console.error('[equipo] error', e);
          alert('Error consultando equipo');
        },
      });
  }
      
}
