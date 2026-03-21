import insightface
from insightface.app import FaceAnalysis
import numpy as np
import cv2
from typing import List, Optional

class FaceService:
    def __init__(self):
        self.app = None  # ❗ Don't load model here

    def load_model(self):
        if self.app is None:
            print("Loading face model...")
            self.app = FaceAnalysis(name='buffalo_l')
            self.app.prepare(ctx_id=-1, det_size=(640, 640))
            print("Model loaded successfully")

    def get_embedding(self, image_bytes: bytes) -> Optional[List[float]]:
        try:
            # ✅ Load model only when needed
            self.load_model()

            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                return None

            faces = self.app.get(img)
            if not faces:
                return None

            faces = sorted(
                faces,
                key=lambda x: (x.bbox[2]-x.bbox[0]) * (x.bbox[3]-x.bbox[1]),
                reverse=True
            )

            return faces[0].embedding.tolist()

        except Exception as e:
            print(f"Error in face detection: {e}")
            return None

    def compare_faces(self, embedding1: List[float], embedding2: List[float], threshold: float = 0.5) -> bool:
        emb1 = np.array(embedding1)
        emb2 = np.array(embedding2)

        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)

        if norm1 == 0 or norm2 == 0:
            return False

        sim = np.dot(emb1, emb2) / (norm1 * norm2)
        return bool(sim > threshold)


# ✅ Lazy instance (safe now)
face_service = FaceService()
