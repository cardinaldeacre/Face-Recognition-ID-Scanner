import os
import cv2
import numpy as np
import psycopg2
import mtcnn
import json
from keras_facenet import FaceNet # Ubah ini
from utils import get_face, get_db_config, l2_normalizer

# --- KONFIGURASI ---
PEOPLE_DIR = "data/Faces"
# REQUIRED_SIZE tidak lagi diperlukan manual karena ditangani library

# --- INISIALISASI ---
try:
    DB_CONFIG = get_db_config()
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    face_detector = mtcnn.MTCNN()
    face_encoder = FaceNet() # Gunakan Keras-FaceNet
    print("✅ Model & Database Ready (128-bit Mode).")
except Exception as e:
    print(f"❌ Initialization Error: {e}")
    exit()

encoding_dict = {}

if not os.path.exists(PEOPLE_DIR):
    print(f"❌ Folder {PEOPLE_DIR} tidak ditemukan!")
    exit()

for nim in os.listdir(PEOPLE_DIR):
    person_dir = os.path.join(PEOPLE_DIR, nim)
    if not os.path.isdir(person_dir):
        continue

    vectors = []
    print(f"🔍 Memproses NIM: {nim}")

    for img_name in os.listdir(person_dir):
        try:
            img_path = os.path.join(person_dir, img_name)
            img = cv2.imread(img_path)
            if img is None: continue

            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = face_detector.detect_faces(img_rgb)
            if not results: continue

            res = max(results, key=lambda b: b['box'][2] * b['box'][3])
            face, _, _ = get_face(img_rgb, res['box'])

            # Gunakan fungsi internal FaceNet untuk mendapatkan embedding (128 dim)
            vector = face_encoder.embeddings(np.expand_dims(face, axis=0))[0]
            vectors.append(vector)
        except Exception as e:
            print(f"  ⚠️ Gagal memproses foto {img_name}: {e}")

    if len(vectors) == 0:
        print(f"  ❌ Tidak ada wajah valid untuk NIM {nim}")
        continue

    vector_mean = np.mean(vectors, axis=0)
    vector_final = l2_normalizer.transform(np.expand_dims(vector_mean, axis=0))[0]
    encoding_dict[nim] = vector_final

print("\n🚀 Menyimpan hasil ke database Neon (Menimpa data lama)...")
for nim, vector in encoding_dict.items():
    try:
        embedding_json = json.dumps(vector.tolist())
        cursor.execute(
            "UPDATE users SET face_embedding = %s WHERE nim = %s;",
            (embedding_json, nim)
        )
        
        if cursor.rowcount == 0:
            print(f"  ⚠️ NIM {nim} tidak ditemukan di database.")
        else:
            print(f"  ✅ Sukses update embedding: {nim} (Size: 128)")
            
    except Exception as e:
        print(f"  ❌ Gagal simpan NIM {nim}: {e}")

conn.commit()
cursor.close()
conn.close()
print("\n🎉 Proses sinkronisasi selesai.")