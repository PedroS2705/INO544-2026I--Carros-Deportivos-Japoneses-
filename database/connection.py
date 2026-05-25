import os
import json
from datetime import datetime

RECORDS_FILE = os.path.join(os.path.dirname(__file__), 'records.json')
IMAGES_DIR = os.path.join(os.path.dirname(__file__), 'images')

os.makedirs(IMAGES_DIR, exist_ok=True)


def get_connection():
    """Placeholder for DB connection if needed later."""
    return None


class JDMDatabase:
    def __init__(self):
        # Ensure records file exists
        if not os.path.exists(RECORDS_FILE):
            with open(RECORDS_FILE, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)

    def guardar_imagen_en_disco(self, datos_imagen: bytes, marca: str = '', modelo: str = '', anio: int = 0, prob: float = 0.0) -> str:
        try:
            timestamp = datetime.utcnow().strftime('%Y%m%dT%H%M%S%f')
            filename = f"img_{timestamp}.jpg"
            ruta = os.path.join(IMAGES_DIR, filename)
            with open(ruta, 'wb') as f:
                f.write(datos_imagen)

            # Append record
            with open(RECORDS_FILE, 'r+', encoding='utf-8') as f:
                try:
                    records = json.load(f)
                except json.JSONDecodeError:
                    records = []
                record = {
                    'path': ruta,
                    'marca': marca,
                    'modelo': modelo,
                    'anio': anio,
                    'prob': prob,
                    'timestamp': timestamp
                }
                records.append(record)
                f.seek(0)
                json.dump(records, f, ensure_ascii=False, indent=2)
                f.truncate()

            return ruta
        except Exception:
            return ''
