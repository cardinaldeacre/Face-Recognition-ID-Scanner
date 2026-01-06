import os
import cv2
import mtcnn
import numpy as np
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from keras_facenet import FaceNet
from scipy.spatial.distance import cosine
from utils import load_encodings_from_db, get_face, l2_normalizer

app = Flask(__name__)
CORS(app) 

# --- KONFIGURASI JEMBATAN ---
# GANTI URL DI BAWAH DENGAN UNIQUE URL DARI TRIGGER PIPEDREAM KAMU (https://eo....pipedream.net)
PIPEDREAM_URL = "https://eopltq4bdci5qjr.m.pipedream.net"

face_detector = None
face_encoder = None
encoding_dict = {}

# --- LOAD MODELS ---
print("⏳ Loading AI Models via Keras-FaceNet...")
try:
    face_detector = mtcnn.MTCNN()
    face_encoder = FaceNet() 
    encoding_dict = load_encodings_from_db() 
    if not encoding_dict:
        print("⚠️ Warning: Database wajah kosong.")
    else:
        print(f"✅ Models & Database Loaded! ({len(encoding_dict)} identitas)")
except Exception as e:
    print(f"❌ Critical Error Loading Models: {e}")

def recognize_process(img_array, recognition_t=0.5):
    img_rgb = cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB)
    results = face_detector.detect_faces(img_rgb)
    if not results: return None 

    res = max(results, key=lambda x: x['confidence'])
    if res['confidence'] < 0.90: return None 

    face_img, _, _ = get_face(img_rgb, res['box'])
    detections = face_encoder.embeddings(np.expand_dims(face_img, axis=0))
    encode = detections[0]
    encode = l2_normalizer.transform(encode.reshape(1, -1))[0]

    name = 'unknown'
    distance = 1.0 

    for db_name, db_encode in encoding_dict.items():
        db_vec = np.array(db_encode).flatten()
        if db_vec.shape != encode.shape: continue
            
        dist = cosine(db_vec, encode)
        if dist < recognition_t and (name == 'unknown' or dist < distance):
            name = db_name
            distance = float(dist)
    return {"name": name, "distance": distance}

@app.route('/', methods=['GET'])
def index():
    return "Face Recognition API is Running via Pipedream Bridge!"

@app.route('/scan', methods=['POST'])
def scan():
    if face_encoder is None:
        return jsonify({"error": "Model not loaded"}), 500
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files['image']
    npimg = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    try:
        result = recognize_process(img)
        if not result:
            return jsonify({"status": "failed", "data": {"name": "unknown", "distance": 1.0}}), 200

        if result['name'] != 'unknown':
            # --- PENGIRIMAN VIA JEMBATAN (SOLUSI DNS) ---
            try:
                payload = {"nim_detected": result['name']}
                
                print(f"📡 Mengirim NIM {result['name']} ke Jembatan Pipedream...")
                
                # Menggunakan rute Pipedream yang pasti bisa diakses Hugging Face
                resp = requests.post(PIPEDREAM_URL, json=payload, timeout=10)
                
                if resp.status_code < 300:
                    print(f"🚀 SUKSES: NIM {result['name']} diteruskan oleh Jembatan!")
                else:
                    print(f"⚠️ Jembatan merespons status: {resp.status_code}")
                    
            except Exception as bridge_err:
                print(f"❌ Masalah pada Jembatan: {bridge_err}")

        return jsonify({"status": "success", "data": result})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/reload', methods=['POST'])
def reload():
    global encoding_dict
    try:
        encoding_dict = load_encodings_from_db()
        return jsonify({"message": "Database reloaded", "count": len(encoding_dict)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 7860))
    app.run(host='0.0.0.0', port=port)