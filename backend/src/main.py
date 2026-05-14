from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import os
from constants import MAHALLE_MAP, ISITMA_MAP, OTOPARK_MAP, BINA_YAS_MAP, KAT_MAP

app = FastAPI(title="Antalya House Rent Prediction API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.json")
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Please run train_model.py first.")

from xgboost import XGBRegressor
model = XGBRegressor()
model.load_model(MODEL_PATH)

class PredictionInput(BaseModel):
    mahalle: str
    isitma_turu: str
    otopark: str
    esya_durumu: int # 0 or 1
    sahibi: int # 0 or 1
    balkon: int # 0 or 1
    asansor: int # 0 or 1
    site_icinde: int # 0 or 1
    dairenin_bulundugu_kat: int
    oda_sayisi2: float
    salon_sayisi: float
    depozito: float
    banyo_sayisi: float
    bina_kat_sayisi: float
    bina_yas: float # Numerical age
    net_brut_orani: float

@app.get("/")
def read_root():
    return {"message": "Antalya House Rent Prediction API is running"}

@app.get("/metadata")
def get_metadata():
    return {
        "mahalleler": list(MAHALLE_MAP.keys()),
        "isitmalar": list(ISITMA_MAP.keys()),
        "otoparklar": list(OTOPARK_MAP.keys())
    }

@app.post("/predict")
def predict(data: PredictionInput):
    try:
        # Map categorical inputs to numeric
        mahalle_num = MAHALLE_MAP.get(data.mahalle, 30)
        isitma_num = ISITMA_MAP.get(data.isitma_turu, 0)
        otopark_num = OTOPARK_MAP.get(data.otopark, 0)
        
        # Prepare feature vector (matches order in training)
        features = [
            mahalle_num, isitma_num, otopark_num, data.esya_durumu, data.sahibi,
            data.balkon, data.asansor, data.site_icinde, data.dairenin_bulundugu_kat,
            data.oda_sayisi2, data.salon_sayisi, data.depozito, data.banyo_sayisi,
            data.bina_kat_sayisi, data.bina_yas, data.net_brut_orani
        ]
        
        # Predict
        df_input = pd.DataFrame([features], columns=[
            'mahalle_num', 'isitma_turu_num', 'otopark_num', 'esya_durumu', 'sahibi', 'balkon', 'asansor', 'site_icinde',
            'dairenin_bulundugu_kat_num', 'oda_sayisi2', 'salon_sayisi', 'depozito', 'banyo_sayisi', 
            'bina_kat_sayisi', 'bina_yas_num', 'net_brut_orani'
        ])
        
        prediction = model.predict(df_input)[0]
        
        return {"prediction": int(max(0, prediction))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
