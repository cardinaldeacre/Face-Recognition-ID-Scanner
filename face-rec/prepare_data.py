import os
import cv2
import numpy as np
import psycopg2
import mtcnn
import json
from keras.models import load_model
from utils import get_face, normalize, get_db_config, l2_normalizer

# --- KONFIGURASI ---
PEOPLE_DIR = "data/Faces"
MODEL_PATH = "facenet_keras.h5"
REQUIRED_SIZE = (160, 160)

# --- INISIALISASI MODEL ---
print("⏳ Loading Model MTCNN & FaceNet...")
face_detector = mtcnn.MTCNN()
face_encoder = load_model(MODEL_PATH)
print("✅ Model Loaded.")

def generate_encodings_to_db():
    # 1. Buka Koneksi ke Database Cloud
    try:
        config = get_db_config()
        conn = psycopg2.connect(**config)
        cursor = conn.cursor()
        print("✅ Terhubung ke Database Cloud.")
    except Exception as e:
        print(f"❌ Gagal connect database: {e}")
        return

    # 2. Loop Folder Foto
    if not os.path.exists(PEOPLE_DIR):
        print(f"❌ Folder {PEOPLE_DIR} tidak ditemukan.")
        return

    for nim in os.listdir(PEOPLE_DIR):
        person_dir = os.path.join(PEOPLE_DIR, nim)
        
        # Lewati jika bukan folder
        if not os.path.isdir(person_dir):
            continue

        print(f"\n🔍 Memproses wajah untuk NIM: {nim}...")
        encodes = []

        # 3. Proses Setiap Foto dalam Folder NIM
        for img_name in os.listdir(person_dir):
            img_path = os.path.join(person_dir, img_name)
            
            try:
                img = cv2.imread(img_path)
                if img is None: continue

                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                results = face_detector.detect_faces(img_rgb)

                if results:
                    # Ambil wajah terbesar
                    res = max(results, key=lambda b: b['box'][2] * b['box'][3])
                    face, _, _ = get_face(img_rgb, res['box'])

                    # Normalisasi & Encode
                    face = normalize(face)
                    face = cv2.resize(face, REQUIRED_SIZE)
                    
                    # Prediksi Vector (Embedding)
                    encode = face_encoder.predict(np.expand_dims(face, axis=0), verbose=0)[0]
                    encodes.append(encode)
            except Exception as e:
                print(f"   ⚠️ Gagal memproses {img_name}: {e}")

        # 4. Hitung Rata-rata & Simpan ke DB
        if encodes:
            # Rata-rata vektor dari semua foto user ini
            encode_mean = np.sum(encodes, axis=0)
            # L2 Normalize hasil rata-rata
            final_embedding = l2_normalizer.transform(np.expand_dims(encode_mean, axis=0))[0]
            
            # Convert ke JSON List agar bisa disimpan di kolom TEXT/JSONB postgres
            embedding_json = json.dumps(final_embedding.tolist())

            try:
                # Update kolom face_embedding di tabel users
                cursor.execute(
                    "UPDATE users SET face_embedding = %s WHERE nim = %s",
                    (embedding_json, nim)
                )
                
                if cursor.rowcount > 0:
                    print(f"✅ SUKSES: Data wajah {nim} tersimpan di Database Cloud.")
                else:
                    print(f"⚠️ SKIP: NIM {nim} tidak ditemukan di tabel 'users'. Buat user dulu di website/admin.")
                
                conn.commit() # Commit per user
            except Exception as e:
                conn.rollback()
                print(f"❌ Gagal menyimpan DB untuk {nim}: {e}")
        else:
            print(f"⚠️ Tidak ada wajah valid ditemukan untuk {nim}")

    # 5. Tutup Koneksi
    cursor.close()
    conn.close()
    print("\n🎉 Selesai memproses semua data wajah.")

if __name__ == '__main__':
    generate_encodings_to_db()