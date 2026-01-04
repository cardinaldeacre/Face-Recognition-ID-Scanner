import os
import cv2
import mtcnn
import numpy as np
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from keras.models import load_model
from scipy.spatial.distance import cosine
from utils import load_encodings_from_db, get_face, get_encode, l2_normalizer

app = Flask(__name__)
CORS(app) # Izinkan akses dari Frontend React

# --- KONFIGURASI ---
# URL Backend Node.js untuk pelaporan log
# Saat deploy, set env NODE_BACKEND_URL ke URL Render Node.js Anda
NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:3000/api/gate/screen")

# --- LOAD MODELS SAAT SERVER START ---
print("⏳ Loading AI Models...")
try:
    # Pastikan file .h5 ada di folder yang sama
    encoder_model = 'facenet_keras.h5'
    face_detector = mtcnn.MTCNN()
    face_encoder = load_model(encoder_model)
    encoding_dict = load_encodings_from_db() # Load database wajah dari Cloud
    print("✅ Models & Database Loaded!")
except Exception as e:
    print(f"❌ Critical Error Loading Models: {e}")
# -------------------------------------

def recognize_process(img_array, recognition_t=0.5):
    """
    Fungsi murni untuk memproses gambar:
    Deteksi -> Crop -> Encode -> Bandingkan
    """
    # 1. Convert ke RGB
    img_rgb = cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB)
    
    # 2. Deteksi Wajah
    results = face_detector.detect_faces(img_rgb)
    if not results:
        return None # Tidak ada wajah

    # Ambil wajah dengan confidence tertinggi (paling jelas)
    res = max(results, key=lambda x: x['confidence'])
    if res['confidence'] < 0.90:
        return None # Wajah kurang jelas

    # 3. Crop & Encode
    face, _, _ = get_face(img_rgb, res['box'])
    encode = get_encode(face_encoder, face, (160, 160)) # Ukuran input FaceNet
    encode = l2_normalizer.transform(encode.reshape(1, -1))[0]

    # 4. Bandingkan dengan Database (Cosine Similarity)
    name = 'unknown'
    distance = float("inf")

    for db_name, db_encode in encoding_dict.items():
        db_vec = np.array(db_encode).flatten()
        dist = cosine(db_vec, encode)
        
        # Semakin kecil distance, semakin mirip
        if dist < recognition_t and dist < distance:
            name = db_name
            distance = dist

    return {"name": name, "distance": distance}

@app.route('/', methods=['GET'])
def index():
    return "Face Recognition API is Running!"

@app.route('/scan', methods=['POST'])
def scan():
    # 1. Terima File Gambar dari Frontend
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files['image']
    
    # 2. Baca gambar ke format OpenCV
    npimg = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    try:
        # 3. Proses Pengenalan
        result = recognize_process(img)

        if result:
            # Jika wajah dikenali, lapor ke Backend Node.js
            if result['name'] != 'unknown':
                try:
                    payload = {
                        "nim_detected": result['name'] # Kirim NIM saja
                    }
                    # Kirim data ke GateController Node.js
                    requests.post(NODE_BACKEND_URL, json=payload, timeout=3)
                    print(f"🚀 Lapor ke Backend: NIM {result['name']}")
                except Exception as req_err:
                    print(f"⚠️ Gagal lapor backend: {req_err}")

            return jsonify({
                "status": "success",
                "data": result
            })
        else:
            return jsonify({
                "status": "failed",
                "message": "No face detected"
            }), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

# Endpoint untuk reload database tanpa restart server (berguna jika ada mhs baru daftar)
@app.route('/reload', methods=['POST'])
def reload():
    global encoding_dict
    try:
        encoding_dict = load_encodings_from_db()
        return jsonify({"message": "Database reloaded", "count": len(encoding_dict)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Ambil PORT dari environment (penting untuk Render), default 5000
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)