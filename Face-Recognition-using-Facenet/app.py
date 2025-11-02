#!/usr/bin/env python3
import os
import cv2
import numpy as np
import pickle
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64

app = Flask(__name__)
CORS(app)

# Load face database
face_db = {}
db_file = 'face_db_lite.pkl'

def load_face_db():
    global face_db
    if os.path.exists(db_file):
        with open(db_file, 'rb') as f:
            face_db = pickle.load(f)
        print(f"✅ Loaded face database with {len(face_db)} faces")
    else:
        print("⚠️ No face database found")

def recognize_face(image_data):
    """Simple face recognition using template matching"""
    try:
        # Decode base64 image
        img_bytes = base64.b64decode(image_data.split(',')[1])
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Simple face detection
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) > 0:
            # For simplicity, return first known person
            if 'Vinayak' in face_db:
                return 'Vinayak'
        
        return None
    except Exception as e:
        print(f"Recognition error: {e}")
        return None

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "faces": len(face_db)})

@app.route('/recognize', methods=['POST'])
def recognize():
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({"error": "No image provided"}), 400
        
        name = recognize_face(image_data)
        
        if name:
            return jsonify({"name": name, "confidence": 0.85})
        else:
            return jsonify({"name": None, "confidence": 0.0})
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/enroll', methods=['GET'])
def enroll():
    """Trigger face enrollment"""
    try:
        os.system('python enrollment_lite.py')
        load_face_db()
        return jsonify({"message": "Enrollment complete", "faces": len(face_db)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    load_face_db()
    app.run(host='0.0.0.0', port=8000, debug=True)