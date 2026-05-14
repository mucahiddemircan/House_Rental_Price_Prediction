import pandas as pd
import joblib
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
import os
from constants import MAHALLE_MAP, ISITMA_MAP, OTOPARK_MAP, BINA_YAS_MAP, KAT_MAP

def train():
    # Load data
    data_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'antalya_kiralik_ev.csv')
    df = pd.read_csv(data_path)
    
    if 'Unnamed: 0' in df.columns:
        df.drop("Unnamed: 0", axis=1, inplace=True)
    
    df.drop_duplicates(inplace=True)
    
    # Preprocessing
    df['fiyat'] = df['fiyat'] + df['aidat']
    
    # Outlier removal (99.1% as per original)
    q_limit = df['fiyat'].quantile(0.991)
    df = df[df['fiyat'] < q_limit].copy()
    
    # Feature Engineering
    # Bina Yaşı
    df['bina_yas_num'] = df['bina_yas'].map(BINA_YAS_MAP).fillna(5).astype(float)
    
    # Oda Sayısı Split
    df['oda_temp'] = df['oda_sayisi'].replace('Stüdyo (1+0)', '1+0')
    df[['oda_sayisi2', 'salon_sayisi']] = df['oda_temp'].str.split('+', expand=True).astype(float)
    
    # Net/Brüt Oranı
    df['net_brut_orani'] = df['net_alan_m2'] / df['brut_alan_m2']
    
    # Kat mapping
    df['dairenin_bulundugu_kat_num'] = df['dairenin_bulundugu_kat'].map(KAT_MAP).fillna(1).astype(int)
    
    # Isıtma mapping
    df['isitma_turu_num'] = df['isitma_turu'].map(ISITMA_MAP).fillna(0).astype(int)
    
    # Otopark mapping
    df['otopark_num'] = df['otopark'].map(OTOPARK_MAP).fillna(0).astype(int)
    
    # Mahalle mapping (using the hardcoded map for consistency)
    # Removing ' Mh.' or ' Mah.' if present for better matching
    df['mahalle_clean'] = df['mahalle'].str.replace(' Mh.', '', regex=False).str.replace(' Mah.', '', regex=False).str.replace(' Mah', '', regex=False).str.strip()
    df['mahalle_num'] = df['mahalle_clean'].map(MAHALLE_MAP).fillna(30) # Default to Muratpaşa
    
    # Binary/Boolean features (Balkon, Asansör, Site, Eşya, Sahibi)
    # In original: balkon (0/1), asansor (0/1), site_icinde (0/1), esya_durumu (0/1), sahibi (0/1)
    
    # Selection of features matching the model in original
    # Original order: 'mahalle', 'isitma_turu', 'otopark', 'esya_durumu', 'sahibi', 'balkon', 'asansor', 'site_icinde',
    # 'dairenin_bulundugu_kat', 'oda_sayisi2', 'salon_sayisi', 'depozito', 'banyo_sayisi', 
    # 'bina_kat_sayisi', 'bina_yas', 'net_brut_orani'
    
    X = df[[
        'mahalle_num', 'isitma_turu_num', 'otopark_num', 'esya_durumu', 'sahibi', 'balkon', 'asansor', 'site_icinde',
        'dairenin_bulundugu_kat_num', 'oda_sayisi2', 'salon_sayisi', 'depozito', 'banyo_sayisi', 
        'bina_kat_sayisi', 'bina_yas_num', 'net_brut_orani'
    ]]
    y = df['fiyat']
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=144)
    
    # Model
    model = XGBRegressor(colsample_bytree = 0.5, learning_rate = 0.09, max_depth = 4, n_estimators = 2000)
    model.fit(X_train, y_train)
    
    # Save
    model_path = os.path.join(os.path.dirname(__file__), 'model.json')
    model.save_model(model_path)
    print(f"Model trained and saved to {model_path}")
    
    # Evaluate briefly
    print(f"Train Score: {model.score(X_train, y_train)}")
    print(f"Test Score: {model.score(X_test, y_test)}")

if __name__ == "__main__":
    train()
