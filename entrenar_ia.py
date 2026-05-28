import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader
import os

# 1. CONFIGURACIÓN Y DATA AUGMENTATION
# Aquí deforma ligeramente las imágenes para que la IA aprenda mejor
transformaciones = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(), # Voltea la imagen como espejo
    transforms.RandomRotation(15),     # Rota la imagen 15 grados
    transforms.ColorJitter(brightness=0.2, contrast=0.2), # Cambia luz y contraste
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# 2. CARGAR LAS IMÁGENES
ruta_dataset = "dataset" # ¡Cambia esto por tu ruta real!
dataset = datasets.ImageFolder(ruta_dataset, transform=transformaciones)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)

numero_de_clases = len(dataset.classes)
print(f"Clases detectadas: {dataset.classes}")

# 3. CREAR EL MODELO (Transfer Learning con ResNet18)
# Descargamos un modelo pre-entrenado profesional
modelo = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# Congelamos las capas base para no dañar lo que ya sabe
for param in modelo.parameters():
    param.requires_grad = False

# Reemplazamos la última capa para que coincida con tus clases (Supra, R34, RX7, No_JDM...)
num_ftrs = modelo.fc.in_features
modelo.fc = nn.Linear(num_ftrs, numero_de_clases)

# Configurar el dispositivo (Usa tarjeta gráfica si hay, si no, usa el procesador)
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
modelo = modelo.to(device)

# Función de error y optimizador
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(modelo.fc.parameters(), lr=0.001)

# 4. BUCLE DE ENTRENAMIENTO
epocas = 20 # Cuántas veces repasará todas las fotos

print("Iniciando entrenamiento...")
for epoca in range(epocas):
    modelo.train()
    loss_acumulado = 0.0
    correctos = 0
    total = 0
    
    for inputs, labels in dataloader:
        inputs, labels = inputs.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = modelo(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        loss_acumulado += loss.item()
        _, predicciones = torch.max(outputs, 1)
        total += labels.size(0)
        correctos += (predicciones == labels).sum().item()
        
    precision = 100 * correctos / total
    print(f"Época {epoca+1}/{epocas} | Pérdida: {loss_acumulado/len(dataloader):.4f} | Precisión: {precision:.2f}%")

# 5. GUARDAR EL CEREBRO FINAL
torch.save(modelo.state_dict(), "modelo_jdm_v2.pt")
print("¡Entrenamiento finalizado! Modelo guardado como 'modelo_jdm_v2.pt'")