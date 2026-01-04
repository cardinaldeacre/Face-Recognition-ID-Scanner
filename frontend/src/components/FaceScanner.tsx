import { useEffect, useRef, useState } from 'react';
import { verifyAttendance } from '../services/permission';

export default function FaceScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isScanning, _setIsScanning] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Mencari wajah...");
  const [statusType, setStatusType] = useState<"neutral" | "success" | "error">("neutral");

  // Interval ID untuk membersihkan timer saat komponen ditutup
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    startCamera();

    // Setup interval untuk mengambil foto setiap 3 detik
    intervalRef.current = window.setInterval(() => {
        if (isScanning) {
            captureAndSend();
        }
    }, 3000); 

    return () => {
      stopCamera();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Gagal akses kamera:", err);
      setStatusMessage("Gagal mengakses kamera. Pastikan izin diberikan.");
      setStatusType("error");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  const captureAndSend = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set ukuran canvas sama dengan video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Gambar frame video ke canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Ubah canvas menjadi Blob (File gambar)
    canvas.toBlob(async (blob) => {
      if (blob) {
        setStatusMessage("Memproses...");
        try {
          // Panggil service yang kita buat di Langkah 1
          const result = await verifyAttendance(blob);

          if (result.status === "success") {
             // Wajah dikenali!
             const name = result.data.name;
             const dist = result.data.distance;
             
             if (name !== "unknown") {
                 setStatusMessage(`✅ Halo, ${name}! (${dist.toFixed(2)})`);
                 setStatusType("success");
                 // Opsional: Hentikan scanning setelah berhasil
                 // setIsScanning(false); 
             } else {
                 setStatusMessage("❌ Wajah tidak dikenali.");
                 setStatusType("error");
             }
          } else {
             setStatusMessage("⚠️ Tidak ada wajah terdeteksi.");
             setStatusType("neutral");
          }
        } catch (error) {
          console.error(error);
          // setStatusMessage("Error koneksi server.");
        }
      }
    }, 'image/jpeg', 0.8); // Kualitas JPG 80%
  };

  return (
    <div className="face-scanner-container" style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '8px' }}>
      {/* Element Video (Tampilan Kamera) */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        style={{ width: '100%', borderRadius: '8px', border: statusType === 'success' ? '4px solid green' : '2px solid #ccc' }} 
      />
      
      {/* Element Canvas (Tersembunyi, hanya untuk capture) */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Overlay Status */}
      <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: statusType === 'success' ? '#e8f5e9' : statusType === 'error' ? '#ffebee' : '#f5f5f5',
          color: statusType === 'success' ? '#2e7d32' : statusType === 'error' ? '#c62828' : '#333',
          borderRadius: '4px',
          fontWeight: 'bold'
      }}>
          {statusMessage}
      </div>
    </div>
  );
}