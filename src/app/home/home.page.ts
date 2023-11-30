import { Component } from '@angular/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
//import { CameraPreviewOptions, CameraPreview, CameraPreviewPictureOptions } from '@capacitor-community/camera-preview';
import { Category, DrawingUtils, FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  devicesList:any;
  listDevices:boolean = false;
  listToggle: boolean = false;
  BluetoothOn:boolean = false;
  bluetoothConected:boolean = false;
  cameraActive:boolean=false;
  faceLandmarker!: FaceLandmarker;
  wasmUrl: string = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
  modelAssetPath: string = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
  video!: HTMLVideoElement;
  canvasElement!: HTMLCanvasElement;
  canvasCtx!: CanvasRenderingContext2D;
  showingPreview: boolean = false;
  tracking: boolean = false;
  espectativ:boolean = false;


  constructor(private bluetoothSerial: BluetoothSerial) {
    this.bluetoothActivo();
  }

  async ngOnInit(): Promise<void> {
    this.faceLandmarker = await FaceLandmarker.createFromOptions(await FilesetResolver.forVisionTasks(this.wasmUrl), {
      baseOptions: { modelAssetPath: this.modelAssetPath, delegate: "GPU" },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
    });
  }

  async ngAfterViewInit(): Promise<void> {
    this.video = document.getElementById("user-video") as HTMLVideoElement;
    this.canvasElement = document.getElementById("user-canvas") as HTMLCanvasElement;
    this.canvasCtx = this.canvasElement.getContext("2d") as CanvasRenderingContext2D;
  }

  toggleTracking = () => (this.tracking = !this.tracking, this.tracking ? this.startTracking() : this.stopTracking());

  startTracking() {
    (!(!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) || !this.faceLandmarker) && (console.warn("user media or ml model is not available"), false);
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => (this.video.srcObject = stream, this.video.addEventListener("loadeddata", predictWebcam)));
    let lastVideoTime = -1; let results: any = undefined; const drawingUtils = new DrawingUtils(this.canvasCtx!);
    
    let predictWebcam = async () => {
      this.canvasElement.width = this.video.videoWidth; this.canvasElement.height = this.video.videoHeight;
      lastVideoTime !== this.video.currentTime && (lastVideoTime = this.video.currentTime, results = this.faceLandmarker.detectForVideo(this.video, Date.now()));
      if (results.faceLandmarks) for (const landmarks of results.faceLandmarks) {
        [FaceLandmarker.FACE_LANDMARKS_TESSELATION, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE]
          .every((type, i) => drawingUtils.drawConnectors(landmarks, type, { color: "#C0C0C070", lineWidth: i == 0 ? 1 : 4 }))
      };
      //console.log(results);
      if(results.faceLandmarks && results.faceBlendshapes && results.faceBlendshapes[0]){
        if(!this.espectativ){
          this. espectativa();
          this.espectativ = true;
        }
        if(results.faceBlendshapes![0].categories?.find((shape: Category) => shape?.categoryName == "mouthSmileLeft")?.score > 0.4 &&
        results.faceBlendshapes![0].categories?.find((shape: Category) => shape?.categoryName == "mouthSmileRight")?.score > 0.4 ) (this.sendData(),this.sonrisa(),setTimeout(()=>this.espectativ=false,500))
      } else {
        this.espectativ = false;
        this.normal();
      }
      

      
  
      this.tracking == true && window.requestAnimationFrame(predictWebcam);
    }
  }
  
  stopTracking() { // Stop and clear the video & canvas
    this.tracking = false; (this.video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    this.video.srcObject = null; this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
  }

/*
  async initCamera(){
    const cameraPreviewOptions: CameraPreviewOptions = {
      width: 300,
      height: 500,
      toBack: true,
      position: 'front',
      parent:'cameraPreviewp',
      className:'cameraPreview'
    };
    CameraPreview.start(cameraPreviewOptions)
    .then(r=> {
      alert("camara Iniciada")
    },error => {
      alert(error);
    });
    this.cameraActive=true;   
    this.sendData();

    setInterval(()=> { this.analisis() },1000);
    
  }

  async analisis(){

  }
*/
  bluetoothActivo(){
    this.bluetoothSerial.isEnabled()
    .then(
      response => {
        this.showDevices();
        this.BluetoothOn = true;
      },
      error => {
        alert("Bluetooth no esta Activo");
        this.BluetoothOn = true;
        alert(error);
      }
    );
  }

  showDevices(){
    this.bluetoothSerial.list()
    .then(
      response => {
        this.devicesList = response;
        this.listDevices = true;
      },
      error => {
        this.listDevices = false;
        alert(error);
      }
    );
  }

  connectBluetooth(address:any){
    alert("Conectando...");
    this.bluetoothSerial.connect(address).subscribe(response => {
      alert("Dispositivo Conectado Exitosamente");
      //this.initCamera();
      this.toggleTracking();
      this.bluetoothSerial.subscribe('/n').subscribe(succes => alert(succes));
    }, error => {
      alert("Error Conectando con el dispositivo "+error);
    });
    
    this.listDevices = false;
  }

  sendData(){
    this.bluetoothSerial.write("a").then(response=>{
      
    },error=>{
      alert("error Enviando "+error);
    })
  }

  disconectedB(){
    this.bluetoothSerial.disconnect()
    alert("Dispositivo Desconectado");
    this.bluetoothConected = false;
  }

  espectativa() {
    var element:any = document.getElementById("cara");
    element.classList.add("bocas");

    var element:any = document.getElementById("ojo2");
    element.classList.remove("d1");
 }


 sonrisa() {
    var element:any = document.getElementById("cara");
    element.classList.remove("bocas");
    element.classList.add("boca1");

    var element:any = document.getElementById("ojo1");
    element.classList.add("grin");

    var element:any = document.getElementById("ojo2");
    element.classList.add("grin");
 }


  normal() {
    var element:any = document.getElementById("cara");
    element.classList.remove("bocas");
    element.classList.remove("boca1");

    var element:any = document.getElementById("ojo1");
    element.classList.remove("grin");

    var element:any = document.getElementById("ojo2");
    element.classList.remove("grin");

    var element:any = document.getElementById("ojo2");
    element.classList.add("d1");
 }
}
