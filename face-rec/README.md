# Face Recognition Project
Face recognition merupakan teknologi yang digunakan untuk melakukan identifikasi atau verifikasi identitas seseorang berdasarkan fitur wajahnya. Sistem ini bekerja dengan cara mendeteksi wajah, mengekstraksi ciri-ciri unik (seperti bentuk mata, hidung, jarak antar fitur, dan kontur wajah), lalu membandingkannya dengan data wajah yang sudah tersimpan sebelumnya.
Proyek ini menyajikan implementasi pipeline pemrosesan wajah yang terstruktur dan modular menggunakan Keras-Facenet, mulai dari ekstraksi fitur, pembuatan embedding, hingga eksekusi pipeline inferensi.
Seluruh komponen disusun agar mudah direproduksi, ringan dijalankan, serta kompatibel dengan workflow pengembangan berbasis Python.


## Persiapan Lingkungan

1. Pastikan Anda berada di path proyek yang benar

  Sebelum memulai, buka terminal dan arahkan ke folder proyek ini:
  ```
  cd path/ke/proyek-anda
  ```


2. Gunakan Python versi yang sesuai
  
Proyek ini menggunakan versi berikut:
```
Python 3.7.16
```


3. Pastikan environment Anda sesuai, atau buat virtual environment baru:
```
python3.7 -m venv venv

source venv/bin/activate     # Mac / Linux

venv\Scripts\activate        # Windows
```

jika pakai conda:
```
conda create --name face-rec python=3.7 
```

```
conda activate face-rec
```

4. Install Dependencies

Download seluruh dependencies yang sudah disediakan pada file requirements.txt:
```
pip install -r requirements.txt
```

## Download Model & Dataset

silahkan download model:

Link : https://drive.google.com/file/d/1v2XQXSTJjjSOm6ElAP3ZUGOaE3CJBdJ0/view?usp=drive_link


silahkan download dataset:

Link : https://drive.google.com/drive/folders/1mIN-v7M3Rnem0J6zDhKMFUQO_IwNlknL?usp=drive_link


## Cara Menjalankan Proyek

Setelah seluruh persiapan selesai, jalankan langkah-langkah berikut:

1.Menjalankan utils.py
   ```
   utils.py
   ```

Untuk memuat fungsi pendukung seperti normalisasi, ekstraksi wajah, dan preprocessing.

python utils.py

2.Menjalankan encoding.py
   ```
   encoding.py
   ```

Script ini membuat encodings.pkl dari setiap wajah dalam dataset.

python encoding.py

3.Menjalankan prepare_data.py
  ```
  prepare_data.py
  ```

Dipakai untuk mempersiapkan data tambahan, struktur folder, atau proses lain sebelum training/prediksi.

python prepare_data.py

4.Menjalankan face_recognition.py
  ```
  face_recognition.py
  ```
Script utama untuk mendeteksi wajah, menghasilkan encoding, dan melakukan prediksi identitas.
  ```
  python face_recognizer.py
  ```
## Struktur Folder
```
  project/
  │
  ├── keras-facenet.h5
  ├── encodings/
  │   └── encodings.pkl
  ├── data/
  │   └── faces/
  │       └── person_name/
  │            └── *.jpg
  │
  ├── utils.py
  ├── encoding.py
  ├── prepare_data.py
  ├── face_recognition.py
  ├── requirements.txt
  └── README.md
```

