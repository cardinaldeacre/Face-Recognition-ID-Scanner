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

# --- INISIALISASI MODEL ---
print("⏳ Loading Model MTCNN & Keras-FaceNet...")
try:
    face_detector = mtcnn.MTCNN()
    face_encoder = FaceNet() # Gunakan Keras-FaceNet
    print("✅ Model Loaded.")
except Exception as e:
    print(f"❌ Gagal memuat model AI: {e}")
    exit()

def generate_encodings_to_db():
    conn = None
    try:
        config = get_db_config()
        conn = psycopg2.connect(**config)
        cursor = conn.cursor()
        print("✅ Terhubung ke Database Cloud.")
    except Exception as e:
        print(f"❌ Gagal connect database: {e}")
        return

    if not os.path.exists(PEOPLE_DIR):
        print(f"❌ Folder {PEOPLE_DIR} tidak ditemukan.")
        if conn: conn.close()
        return

    folders = [d for d in os.listdir(PEOPLE_DIR) if os.path.isdir(os.path.join(PEOPLE_DIR, d))]
    
    for nim in folders:
        person_dir = os.path.join(PEOPLE_DIR, nim)
        print(f"\n🔍 Memproses wajah untuk NIM: {nim}...")
        encodes = []

        for img_name in os.listdir(person_dir):
            img_path = os.path.join(person_dir, img_name)
            try:
                img = cv2.imread(img_path)
                if img is None: continue

                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                results = face_detector.detect_faces(img_rgb)

                if results:
                    res = max(results, key=lambda x: x['confidence'])
                    if res['confidence'] < 0.90:
                        continue

                    face, _, _ = get_face(img_rgb, res['box'])
                    
                    # Gunakan FaceNet embeddings (128 dim)
                    encode = face_encoder.embeddings(np.expand_dims(face, axis=0))[0]
                    encodes.append(encode)
            except Exception as e:
                print(f"   ⚠️ Gagal memproses {img_name}: {e}")

        if encodes:
            encode_mean = np.mean(encodes, axis=0)
            final_embedding = l2_normalizer.transform(np.expand_dims(encode_mean, axis=0))[0]
            embedding_json = json.dumps(final_embedding.tolist())

            try:
                cursor.execute(
                    "UPDATE users SET face_embedding = %s WHERE nim = %s",
                    (embedding_json, nim)
                )
                if cursor.rowcount > 0:
                    print(f"✅ SUKSES: Data wajah {nim} diperbarui ke 128-dim.")
                else:
                    print(f"⚠️ SKIP: NIM {nim} tidak ada di database.")
                conn.commit()
            except Exception as e:
                conn.rollback()
                print(f"❌ Gagal menyimpan NIM {nim}: {e}")

    cursor.close()
    conn.close()
    print("\n🎉 Sinkronisasi 128-dim selesai.")

if __name__ == '__main__':
    generate_encodings_to_db()