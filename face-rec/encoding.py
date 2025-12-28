import os
import cv2
import numpy as np
import psycopg2
import mtcnn
import json
from keras.models import load_model
from utils import get_face, normalize, get_db_config, load_encodings_from_db, l2_normalizer

PEOPLE_DIR = "data/Faces"
MODEL_PATH = "facenet_keras.h5"
REQUIRED_SIZE = (160, 160)

DB_CONFIG = get_db_config()
conn = psycopg2.connect(**DB_CONFIG)

face_detector = mtcnn.MTCNN()
face_encoder = load_model(MODEL_PATH)

conn = psycopg2.connect(**DB_CONFIG)
cursor = conn.cursor()

encoding_dict = {}

for nim in os.listdir(PEOPLE_DIR):
    person_dir = os.path.join(PEOPLE_DIR, nim)
    if not os.path.isdir(person_dir):
        continue

    vectors = []

    for img_name in os.listdir(person_dir):
        img_path = os.path.join(person_dir, img_name)
        img = cv2.imread(img_path)
        if img is None:
            continue

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = face_detector.detect_faces(img_rgb)
        if not results:
            continue

        res = max(results, key=lambda b: b['box'][2] * b['box'][3])
        face, _, _ = get_face(img_rgb, res['box'])

        face = normalize(face)
        face = cv2.resize(face, REQUIRED_SIZE)

        vector = face_encoder.predict(
            np.expand_dims(face, axis=0),
            verbose=0
        )[0]

        vectors.append(vector)

    if len(vectors) == 0:
        print(f"Tidak ada wajah valid untuk NIM {nim}")
        continue

    vector = np.mean(vectors, axis=0)
    vector = l2_normalizer.transform(
        np.expand_dims(vector, axis=0)
    )[0]

    encoding_dict[nim] = vector

print("\nMenyimpan ke database...")
for nim, vector in encoding_dict.items():
    try:
        embedding_json = json.dumps(vector.tolist())

        cursor.execute(
            """
            UPDATE users 
            SET face_embedding = %s 
            WHERE nim = %s;
            """,
            (embedding_json, nim)
        )
        
        if cursor.rowcount == 0:
            print(f"Peringatan: NIM {nim} tidak ditemukan di tabel users. Pastikan user sudah terdaftar.")
        else:
            print(f"Sukses update embedding untuk NIM: {nim}")
            
    except Exception as e:
        print(f"Gagal menyimpan untuk NIM {nim}: {e}")
        
conn.commit()
cursor.close()
conn.close()

print("Semua encoding berhasil disimpan ke PostgreSQL")
