# pyrefly: ignore [missing-import]
import torch
# pyrefly: ignore [missing-import]
import torch.nn as nn
# pyrefly: ignore [missing-import]
import torchvision.models as models
# pyrefly: ignore [missing-import]
import torchvision.transforms as transforms
# pyrefly: ignore [missing-import]
from PIL import Image
# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
from pathlib import Path
import io

def create_model(num_classes=7):
    # 1. Cambiamos resnet50 por resnet18
    model = models.resnet18(weights=None) 
    
    # 2. Creamos una capa final simple que coincida con tu entrenamiento
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, num_classes)
        
    return model
    
    
    for param in model.fc.parameters():
        param.requires_grad = True
        
    return model

class JDMClassifier:
    def __init__(self, model_path=None):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
        self.classes = ['Mazda Miata', 'Nissan Skyline R34', 'Nissan Silvia',
                        'Nissan GTR R35', 'No JDM',  'Toyota Supra Mk4']
        
        self.car_specs = {
            'Mazda Miata': {
                'brand': 'Mazda',
                'year': '1989-presente (NA-ND)',
                'engine': '1.6L / 1.8L I4 (B6/BP-ZE, BP-VE)',
                'details': 'Roadster JDM icónico, tracción trasera y diseño ligero; famoso por su manejo preciso, chasis equilibrado y generaciones NA, NB, NC, ND.'
            },
            'Nissan Skyline R34': {
                'brand': 'Nissan',
                'year': '1999-2002',
                'engine': '2.6L I6 Twin-Turbo (RB26DETT)',
                'details': 'GT-R R34 con tracción integral ATTESA E-TS Pro, diferenciales activos y dinámica de conducción de alto rendimiento en carretera y pista.'
            },
            'Nissan Silvia': {
                'brand': 'Nissan',
                'year': '1999-2002 (S15)',
                'engine': '2.0L I4 Turbo (SR20DET)',
                'details': 'Silvia S15, favorito del drift y tuning, con motor Turbo SR20DET, suspensión independiente y balance ideal para maniobras de alta velocidad.'
            },
            'Nissan GTR R35': {
                'brand': 'Nissan',
                'year': '2007-presente',
                'engine': '3.8L V6 Twin-Turbo (VR38DETT)',
                'details': 'GTR R35: superdeportivo con tracción integral ATTESA E-TS, control vectorial de torque, chasis reforzado y aceleración 0-100 km/h en menos de 3 segundos en versiones Premium.'
            },
            'Toyota Supra Mk4': {
                'brand': 'Toyota',
                'year': '1993-2002 (A80)',
                'engine': '3.0L Twin-Turbo I6 (2JZ-GTE)',
                'details': 'Supra Mk4 A80, leyenda JDM del tuning y drag, con motor 2JZ-GTE, chasis robusto y enorme potencial para modificaciones de alto rendimiento.'
            },
            'No JDM': {
                'brand': 'N/A',
                'year': 'N/A',
                'engine': 'N/A',
                'details': 'El vehículo detectado no parece ser uno de los deportivos JDM clasificados.'
            }
        }
        
        if model_path and Path(model_path).exists():
            self.model = create_model(num_classes=len(self.classes)).to(self.device)
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
            self.model.eval()
        else:
            self.model = None
            print(f"[ADVERTENCIA] No se encontró modelo en {model_path}. Generando uno aleatorio para demostración...")
            self.model = create_model(num_classes=len(self.classes)).to(self.device)
            self.model.eval()
    
    def predict_image(self, image):
        if isinstance(image, bytes):
            image = Image.open(io.BytesIO(image)).convert('RGB')
        elif not isinstance(image, Image.Image):
            image = Image.open(image).convert('RGB')
            
        image_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
            confidence, predicted = torch.max(probabilities, 0)

        probs_dict = {self.classes[i]: float(p) for i, p in enumerate(probabilities)}

        predicted_class = self.classes[predicted.item()]
        specs = self.car_specs.get(predicted_class, {})

        # Debug logs -- useful para ver en la consola del servidor
        try:
            print(f"[DEBUG] Predicted class: {predicted_class}, confidence: {float(confidence):.4f}")
            print(f"[DEBUG] Specs returned for class: {specs}")
        except Exception:
            pass

        return {
            'prediction': predicted_class,
            'confidence': float(confidence),
            'probabilities': probs_dict,
            'specs': specs
        }
