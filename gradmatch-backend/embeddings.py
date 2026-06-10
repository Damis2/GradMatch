import sqlite3
import os
import numpy as np
from sentence_transformers import SentenceTransformer
from database import get_connection, DB_PATH

MODEL_NAME = 'all-mpnet-base-v2'

def generate_embeddings():
    print("Loading SBERT model...")
    model = SentenceTransformer(MODEL_NAME)

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT programme_id, programme_description_text FROM programmes')
    programmes = cursor.fetchall()
    print(f"Generating embeddings for {len(programmes)} programmes...")

    cursor.execute('DELETE FROM embeddings')
    conn.commit()

    batch_size = 32
    total = len(programmes)

    for i in range(0, total, batch_size):
        batch = programmes[i:i + batch_size]
        ids = [p['programme_id'] for p in batch]
        texts = [p['programme_description_text'] or '' for p in batch]

        embeddings = model.encode(texts, show_progress_bar=False)

        for prog_id, embedding in zip(ids, embeddings):
            embedding_blob = embedding.astype(np.float32).tobytes()
            cursor.execute(
                'INSERT INTO embeddings (programme_id, embedding_vector) VALUES (?, ?)',
                (prog_id, embedding_blob)
            )

        conn.commit()
        print(f"Embedded {min(i + batch_size, total)}/{total} programmes")

    conn.close()
    print("Embeddings generated and stored successfully.")

if __name__ == '__main__':
    generate_embeddings()