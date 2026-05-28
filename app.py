from fastapi import FastAPI, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import uvicorn
import os
import base64
import sys
# Asegurar que el directorio actual (paquete) esté en sys.path
sys.path.insert(0, os.path.dirname(__file__))
from datetime import datetime
from utils import JDMClassifier
from database.connection import get_connection, JDMDatabase
import base64
from fastapi import FastAPI
from pydantic import BaseModel
from pathlib import Path
# Aquí van tus otros imports (como JDMClassifier, etc.)

# 2. SEGUNDO: Crear la variable 'app' e inicializar el clasificador
app = FastAPI()  # <-- ESTA LÍNEA DEBE ESTAR ANTES DE CUALQUIER @app

MODEL_PATH = "modelo_jdm_v2.pt"  # Pon la ruta real de tu modelo entrenado
classifier = JDMClassifier(MODEL_PATH)

# 3. TERCERO: Definir los modelos de datos de Pydantic
class CameraFrame(BaseModel):
    image: str

# 4. CUARTO: Tus rutas (las que usan @app)
@app.get("/")
async def root():
    return {"message": "Servidor JDM Vision Corriendo"}

@app.post("/predict_frame")
async def predict_frame(data: CameraFrame):
    try:
        header, encoded = data.image.split(",", 1) if "," in data.image else ("", data.image)
        image_bytes = base64.b64decode(encoded)
        res = classifier.predict_image(image_bytes)
        return {"success": True, "result": res}
    except Exception as e:
        return {"success": False, "error": str(e)}

class CameraFrame(BaseModel):
    image: str

@app.post("/predict_frame")
async def predict_frame(data: CameraFrame):
    try:
        # 1. Limpiar el encabezado del texto Base64 que manda la cámara
        header, encoded = data.image.split(",", 1) if "," in data.image else ("", data.image)
        
        # 2. Convertir ese texto de nuevo a bytes reales
        image_bytes = base64.b64decode(encoded)
        
        # 3. Pasarle los bytes a tu clasificador en utils.py
        res = classifier.predict_image(image_bytes)
        
        return {"success": True, "result": res}
    except Exception as e:
        return {"success": False, "error": str(e)}

app = FastAPI(title="JDM Classifier API")

# Asegurar directorios
os.makedirs("static", exist_ok=True)
os.makedirs("database/images", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

MODEL_PATH = "modelo_jdm_v2.pt"  # Asegúrate de que este modelo exista después de entrenar tu IA
classifier = JDMClassifier(MODEL_PATH)
db = JDMDatabase()

@app.get("/", response_class=HTMLResponse)
async def read_index():
    if os.path.exists("static/index.html"):
        with open("static/index.html", "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Archivo index.html no encontrado en carpeta static</h1>"

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = classifier.predict_image(contents)
        print(f"[DEBUG] /predict endpoint returning result: {result}")
        specs = result.get("specs", {})
        
        # Uso de la clase db centralizada
        db.guardar_imagen_en_disco(
            datos_imagen=contents,
            marca=specs.get("brand", "Desconocido"),
            modelo=result.get("prediction", "Desconocido"),
            anio=0,
            prob=result.get("confidence", 0.0)
        )
        return {"success": True, "result": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/add_reference")
async def add_reference(
    file: UploadFile = File(...),
    brand: str = Form(...),
    year: str = Form(...),      # Lo ponemos como str por si el HTML envía texto
    engine: str = Form(...),    # Volvemos a 'engine' porque así está en tu HTML
    details: str = Form(...)    # Volvemos a 'details'
):
    try:
        print(f"📥 Recibiendo datos: {brand}, {year}, {engine}") # Esto saldrá en tu consola
        contents = await file.read()
        
        # Guardamos la imagen usando tu clase JDMDatabase
        # Pasamos 'engine' al campo 'modelo' de la base de datos para que no falle
        ruta = db.guardar_imagen_en_disco(
            datos_imagen=contents,
            marca=brand,
            modelo=engine, # Usamos lo que viene en 'engine' como modelo
            anio=int(year) if year.isdigit() else 0,
            prob=1.0
        )
        
        if ruta:
            return {"success": True, "message": "✅ Referencia JDM guardada correctamente"}
        else:
            return {"success": False, "error": "No se pudo guardar en la base de datos"}

    except Exception as e:
        print(f"❌ Error interno: {e}")
        return {"success": False, "error": str(e)}

# ---------------------------------------------------------------------------
# Endpoint para cámara en vivo (frame base64)
# ---------------------------------------------------------------------------
class FramePayload(BaseModel):
    image: str  # Base64 JPEG sin prefijo

@app.post("/predict_frame")
async def predict_frame(payload: FramePayload):
    """Recibe un frame de cámara en base64 y devuelve la predicción JDM."""
    try:
        # Decodificar base64 → bytes
        img_data = payload.image
        # Quitar prefijo data:image/...;base64, si viene incluido
        if "," in img_data:
            img_data = img_data.split(",", 1)[1]
        contents = base64.b64decode(img_data)
        result = classifier.predict_image(contents)
        print(f"[DEBUG] /predict_frame endpoint returning result: {result}")
        return {"success": True, "result": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ---------------------------------------------------------------------------
# Punto de entrada
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Pasar la instancia `app` directamente evita reimportar el módulo
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)