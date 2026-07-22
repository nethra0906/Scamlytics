import os
import logging

logger = logging.getLogger(__name__)

# Try importing torch and torchvision, but don't fail if not present
# as this is an optional ensemble model.
try:
    import torch
    import torch.nn as nn
    from torchvision import transforms, models
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logger.warning("PyTorch not installed. CNN ensemble signal will be disabled.")

class CurrencyCNN:
    """
    MobileNetV2 Transfer Learning Architecture for Counterfeit Currency Detection.
    
    This architecture is designed to classify genuine vs. counterfeit notes
    based on micro-printing, security thread patterns, and watermark features.
    
    NOTE: Currently untrained pending a robust dataset of genuine/counterfeit notes.
    The predict method gracefully falls back to a neutral signal if no weights are found.
    """
    def __init__(self, weights_path="backend/app/ml/weights/currency_mobilenet_v2.pth"):
        self.weights_path = weights_path
        self.is_ready = False
        self.model = None
        self.device = None
        self.transform = None

        # Lazy build: only construct MobileNetV2 when trained weights actually
        # exist on disk. Building it unconditionally would download ImageNet
        # weights over the network at import time for a model that otherwise
        # sits unused in fallback mode (breaking offline/air-gapped startup).
        if TORCH_AVAILABLE and os.path.exists(self.weights_path):
            self._build_model()
            self._load_weights()
        elif TORCH_AVAILABLE:
            logger.info(
                "CurrencyCNN weights not found at %s — CNN disabled, using OpenCV heuristics only.",
                self.weights_path,
            )

    def _build_model(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Build MobileNetV2 architecture with random init. We reach this path
        # only when a fine-tuned state_dict exists (loaded below), so the base
        # ImageNet weights would be overwritten anyway — avoid the download.
        # (weights=None replaces the deprecated pretrained=False argument.)
        self.model = models.mobilenet_v2(weights=None)

        # Freeze early layers
        for param in self.model.features[:-4].parameters():
            param.requires_grad = False

        # Replace classifier for binary classification (Genuine vs Counterfeit)
        num_features = self.model.classifier[1].in_features
        self.model.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 1),
            nn.Sigmoid()
        )
        self.model.to(self.device)
        
        # Standard ImageNet transforms for MobileNetV2
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def _load_weights(self):
        if os.path.exists(self.weights_path):
            try:
                self.model.load_state_dict(torch.load(self.weights_path, map_location=self.device))
                self.model.eval()
                self.is_ready = True
                logger.info(f"Loaded CurrencyCNN weights from {self.weights_path}")
            except Exception as e:
                logger.error(f"Failed to load CNN weights: {e}")
        else:
            logger.info("CurrencyCNN weights not found. Model will operate in mock/fallback mode.")

    def get_augmentation_pipeline(self):
        """
        Data augmentation pipeline for training to handle orientation and lighting variations.
        """
        if not TORCH_AVAILABLE:
            return None
            
        return transforms.Compose([
            transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
            transforms.RandomRotation(15),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def predict(self, image_path: str) -> dict:
        """
        Predicts if a note is counterfeit.
        Returns a dictionary with prediction score.
        If the model is not trained/loaded, returns a neutral score of 0.5.
        """
        if not self.is_ready or not TORCH_AVAILABLE:
            # Graceful fallback: return a neutral signal that won't override the OpenCV heuristics
            return {
                "cnn_score": 0.5,
                "cnn_confidence": 0.0,
                "status": "fallback_mode_untrained"
            }
            
        try:
            from PIL import Image
            img = Image.open(image_path).convert("RGB")
            tensor = self.transform(img).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                output = self.model(tensor)
                score = output.item()
                
            return {
                "cnn_score": score,
                "cnn_confidence": abs(score - 0.5) * 2, # Scale to 0-1 confidence
                "status": "success"
            }
        except Exception as e:
            logger.error(f"CNN prediction error: {e}")
            return {
                "cnn_score": 0.5,
                "cnn_confidence": 0.0,
                "status": "error"
            }

# Singleton instance
cnn_detector = CurrencyCNN()
