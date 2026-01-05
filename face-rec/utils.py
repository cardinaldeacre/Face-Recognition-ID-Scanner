import numpy as np
import cv2
import psycopg2
import json
from sklearn.preprocessing import Normalizer
import os
from dotenv import load_dotenv

# Load env dari file .env (hanya untuk penggunaan lokal)
env_path = os.path.join(os.path.dirname(__file__), 'config', '.env')
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)

def get_db_config():
    """
    Mengambil konfigurasi database.
    Prioritas: DATABASE_URL (Cloud) -> Environment Variables terpisah (Lokal)
    """
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        # PENTING: Neon memerlukan sslmode=require untuk koneksi cloud
        if "sslmode" not in db_url:
            separator = "&" if "?" in db_url else "?"
            db_url += f"{separator}sslmode=require"
        return {"dsn": db_url}
    
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "database": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASS"),
        "port": os.getenv("DB_PORT", 5432)
    }

def get_face(img, box):
    """
    Memotong wajah dari gambar berdasarkan bounding box MTCNN
    """
    x1, y1, width, height = box
    # Proteksi agar koordinat tidak negatif (sering bikin crash OpenCV)
    x1, y1 = max(0, abs(x1)), max(0, abs(y1))
    x2, y2 = x1 + width, y1 + height
    face = img[y1:y2, x1:x2]
    return face, (x1, y1), (x2, y2)

# Normalizer tetap diperlukan untuk membandingkan vektor di app.py
l2_normalizer = Normalizer('l2')

def load_encodings_from_db():
    """
    Mengambil data embedding wajah mahasiswa dari Database Neon
    """
    config = get_db_config()
    print("⏳ Menghubungkan ke database untuk mengambil data wajah...")
    try:
        with psycopg2.connect(**config) as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT nim, face_embedding FROM users WHERE face_embedding IS NOT NULL")
                rows = cursor.fetchall()

                encoding_dict = {}
                for nim, embedding in rows:            
                    try:
                        if isinstance(embedding, str):
                            emb_list = json.loads(embedding)
                        else:
                            emb_list = embedding 
                        
                        encoding_dict[nim] = np.array(emb_list, dtype=np.float32)
                    except Exception as parse_err:
                        print(f"⚠️ Gagal memproses embedding untuk NIM {nim}: {parse_err}")
                        continue

                print(f"✅ Berhasil memuat {len(encoding_dict)} identitas wajah.")
                return encoding_dict

    except Exception as e:
        print(f"❌ Gagal memuat data dari database: {e}")
        return {}