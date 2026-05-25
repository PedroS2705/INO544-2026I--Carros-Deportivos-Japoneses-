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
            'Honda NSX': {
                'brand': 'Honda',
                'year': '1990-2005',
                'engine': '3.0L / 3.2L V6 VTEC (C30A/C32B)',
                'details': 'Motor central, tracción trasera, chasis completo de aluminio. Un ícono del rendimiento japonés.'
            },
            'Mazda RX-7': {
                'brand': 'Mazda',
                'year': '1992-2002 (Generación FD)',
                'engine': '1.3L Twin-Turbo Rotativo (13B-REW)',
                'details': 'Motor rotativo Wankel, diseño atemporal, distribución de peso perfecta 50/50.'
            },
            'Mitsubishi Lancer Evo': {
                'brand': 'Mitsubishi',
                'year': '1992-2016',
                'engine': '2.0L Turbo I4 (4G63T / 4B11T)',
                'details': 'Leyenda del rally, sistema de tracción integral avanzado (S-AWC), rendimiento explosivo.'
            },
            'Nissan GT-R': {
                'brand': 'Nissan',
                'year': '1989-presente',
                'engine': '2.6L I6 / 3.8L V6 Twin-Turbo (RB26DETT / VR38DETT)',
                'details': 'Conocido como "Godzilla". Tracción integral ATTESA E-TS, dominador absoluto de circuitos.'
            },
            'Subaru WRX STI': {
                'brand': 'Subaru',
                'year': '1994-presente',
                'engine': '2.0L / 2.5L Turbo Boxer-4 (EJ20/EJ25)',
                'details': 'Motor tipo Boxer con sonido característico, tracción integral simétrica, herencia innegable del WRC.'
            },
            'Toyota Supra': {
                'brand': 'Toyota',
                'year': '1993-2002 (Generación A80)',
                'engine': '3.0L Twin-Turbo I6 (2JZ-GTE)',
                'details': 'Famoso por su motor 2JZ altamente modificable, estrella de la cultura tuning.'
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
        
        return {
            'prediction': predicted_class,
            'confidence': float(confidence),
            'probabilities': probs_dict,
            'specs': self.car_specs.get(predicted_class, {})
        }
