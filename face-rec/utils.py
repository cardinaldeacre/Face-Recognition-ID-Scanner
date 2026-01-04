import numpy as np
import cv2
import psycopg2
import json
from sklearn.preprocessing import Normalizer
import os
from dotenv import load_dotenv

# Load env dari file .env (hanya berguna saat jalan di laptop)
env_path = os.path.join(os.path.dirname(__file__), 'config', '.env')
load_dotenv(dotenv_path=env_path)

def get_db_config():
    """
    Mengambil konfigurasi database.
    Prioritas: DATABASE_URL (Cloud) -> Environment Variables terpisah (Lokal)
    """
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        return {"dsn": db_url}
    
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "database": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASS"),
        "port": os.getenv("DB_PORT", 5432)
    }

def get_encode(face_encoder, face, size):
    face = normalize(face)
    face = cv2.resize(face, size)
    encode = face_encoder.predict(
        np.expand_dims(face, axis=0),
        verbose=0
    )[0]
    return encode

def get_face(img, box):
    x1, y1, width, height = box
    x1, y1 = abs(x1), abs(y1)
    x2, y2 = x1 + width, y1 + height
    face = img[y1:y2, x1:x2]
    return face, (x1, y1), (x2, y2)

l2_normalizer = Normalizer('l2')

def normalize(img):
    mean, std = img.mean(), img.std()
    return (img - mean) / (std + 1e-8)

def load_encodings_from_db():
    config = get_db_config()
    print("⏳ Menghubungkan ke database untuk mengambil data wajah...")
    try:
        conn = psycopg2.connect(**config)
        cursor = conn.cursor()
        
        # Ambil user yang sudah punya face_embedding
        cursor.execute("SELECT nim, face_embedding FROM users WHERE face_embedding IS NOT NULL")
        rows = cursor.fetchall()

        encoding_dict = {}
        for nim, embedding in rows:            
            if isinstance(embedding, str):
                emb_list = json.loads(embedding)
            else:
                emb_list = embedding 
            
            encoding_dict[nim] = np.array(emb_list, dtype=np.float32)

        cursor.close()
        conn.close()

        print(f"✅ Berhasil memuat {len(encoding_dict)} identitas wajah.")
        return encoding_dict

    except Exception as e:
        print(f"❌ Gagal memuat data dari database: {e}")
        return {}

# Fungsi plt_show dan read_vc DIHAPUS karena server tidak punya layar.