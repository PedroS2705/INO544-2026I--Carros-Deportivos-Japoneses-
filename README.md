# DO YOU TENSORFLOW? — Ves lo que veo 👁️🤖
## IUJO — Feria de Haceres Período I-2026
### Unidad Curricular: INO-544 (Investigación de Operaciones)

---

## 👥 Integrantes y Roles
* **Integrante 1:** [Pedro Alejandro Santaella Aguilar] - [31408110] - *Rol: Ingeniero de Datos (Dataset y Preprocesamiento)*
* **Integrante 2:** [Jesus Andres Hernandez Cardozo] - [31479440] - *Rol: Arquitecto de IA (Modelado y Entrenamiento)*
* **Integrante 3:** [Adrian David Tablante Silva] - [30356327] - *Rol: Ingeniero de Despliegue (Exportación ONNX y Pruebas)*

---

## 🎯 1. Clase/Tema Seleccionado
* **Tema asignado:** [Carros Deportivos Japoneses]
* **Descripción del Objeto:** Breve explicación de qué características visuales definen al objeto seleccionado para este modelo.

---

## 📊 2. Gestión del Dataset (Ingeniería de Datos)
* **Cantidad de imágenes originales recopiladas:** [600 imagenes]
* **Estrategia de Data Augmentation aplicada:**
    * *Rotación:* [Rango de grados]
    * *Zoom:* [Porcentaje]
    * *Cambios de Brillo:* [Rango]
    * *Otras transformaciones:* [Explicar brevemente]
* **Total de imágenes generadas para el entrenamiento:** [Número total después de la aumentación]
* **Resolución y formato estandarizado:** 224x224 píxeles, JPG, canales RGB (Formato Tensor: `[1, 224, 224, 3]`).

---

## 🧠 3. Arquitectura del Modelo y Entrenamiento
* **Framework utilizado:** [PyTorch]
* **Descripción de la Red (CNN):** [Explicar brevemente cuántas capas convolucionales, de pooling y densas se utilizaron].
* **Hiperparámetros óptimos seleccionados:**
    * *Función de pérdida (Loss):* [Ej. Binary Crossentropy]
    * *Optimizador:* [Ej. Adam / SGD]
    * *Tasa de Aprendizaje (Learning Rate):* [Ej. 0.001]
    * *Épocas (Epochs):* [Número]
    * *Tamaño de lote (Batch Size):* [Número]

### 💡 Justificación Crítica (Control de Autoría)
*Explique detalladamente por qué el equipo eligió esa Tasa de Aprendizaje (Learning Rate) específica y el impacto que tuvo en las gráficas de pérdida durante el laboratorio:*
> [Escribir aquí la respuesta analítica del equipo. Evite respuestas genéricas generadas por IA].

---

## 📈 4. Métricas de Rendimiento (Testing - 20%)
* **Precisión final (Accuracy) en la data de test:** [Ej. 92.4%]
* **Pérdida final (Loss) en la data de test:** [Ej. 0.15]

*(Inserte aquí abajo la captura de pantalla de la gráfica de entrenamiento Accuracy/Loss de su modelo)*
![Gráfica de Entrenamiento](src/grafica_rendimiento.png)

---

## ⚙️ 5. Especificación de Exportación ONNX
El modelo se ha homologado bajo los estándares requeridos por la interfaz centralizada:
* **Nombre del archivo:** `model/nombre_equipo.onnx`
* **Tensor de Entrada (Input Shape):** `[1, 224, 224, 3]` (Tipo: `float32`)
* **Tensor de Salida (Output Shape):** `[1, 1]` (Tipo: `float32`)
* **Función de activación final:** Sigmoide (Rango de salida de 0.0 a 1.0 para conversión a porcentaje).

---

## 🚀 6. Instrucciones de Ejecución Local
Para replicar el preprocesamiento y el entrenamiento del modelo:

1. Clonar el repositorio:
   ```bash
   git clone [[https://github.com/](https://github.com/PedroS2705/INO544-2026I--Carros-Deportivos-Japoneses-.git)](https://github.com/PedroS2705/INO544-2026I--Carros-Deportivos-Japoneses-.git)
