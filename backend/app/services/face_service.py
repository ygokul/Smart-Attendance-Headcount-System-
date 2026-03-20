import insightface
from insightface.app import FaceAnalysis
import numpy as np
import cv2
from typing import List, Optional

class FaceService:
    def __init__(self):
        # Using buffalo_l model which includes detection and recognition
        # ctx_id=-1 for CPU, 0 for GPU. Using CPU for compatibility by default.
        self.app = FaceAnalysis(name='buffalo_l')
        self.app.prepare(ctx_id=-1, det_size=(640, 640))

    def get_embedding(self, image_bytes: bytes) -> Optional[List[float]]:
        # Convert bytes to numpy array
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                return None

            faces = self.app.get(img)
            if not faces:
                return None
            
            # Return the embedding of the largest face
            # Sort by bounding box area (width * height)
            faces = sorted(faces, key=lambda x: (x.bbox[2]-x.bbox[0]) * (x.bbox[3]-x.bbox[1]), reverse=True)
            
            # embedding is a numpy array, convert to list for JSON serialization
            return faces[0].embedding.tolist()
        except Exception as e:
            print(f"Error in face detection: {e}")
            return None

    def compare_faces(self, embedding1: List[float], embedding2: List[float], threshold: float = 0.5) -> bool:
        # Cosine similarity
        emb1 = np.array(embedding1)
        emb2 = np.array(embedding2)
        
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)
        
        if norm1 == 0 or norm2 == 0:
            return False
            
        sim = np.dot(emb1, emb2) / (norm1 * norm2)
        return bool(sim > threshold)

# Global instance
# We might want to clear this or init on startup to avoid import time cost if it downloads models
# But for simplicity, we instantiate here. 
# WARNING: This might block on first import if models need downloading.
face_service = FaceService()
