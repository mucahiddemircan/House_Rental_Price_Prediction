import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Home, MapPin, Wind, Car, Sofa, User, Square, Layers, Bath, Building, Calendar, Percent, CheckCircle2, Coins, Flower2, ArrowUp, ShieldCheck, Armchair, RotateCcw } from 'lucide-react';
import './App.css';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [metadata, setMetadata] = useState({ mahalleler: [], isitmalar: [], otoparklar: [] });
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const initialFormState = {
    mahalle: '',
    isitma_turu: '',
    otopark: '',
    esya_durumu: 0,
    sahibi: 0,
    balkon: 0,
    asansor: 0,
    site_icinde: 0,
    dairenin_bulundugu_kat: '',
    oda_sayisi2: '',
    salon_sayisi: '',
    depozito: '',
    banyo_sayisi: '',
    bina_kat_sayisi: '',
    bina_yas: '',
    net_brut_orani: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/metadata`)
      .then(res => {
        setMetadata(res.data);
        if (res.data.mahalleler.length > 0) {
          setFormData(prev => ({
            ...prev,
            mahalle: res.data.mahalleler[0],
            isitma_turu: res.data.isitmalar[0],
            otopark: res.data.otoparklar[0]
          }));
        }
      })
      .catch(err => console.error("Could not fetch metadata", err));
  }, []);

  const handleReset = () => {
    setFormData({
      ...initialFormState,
      mahalle: metadata.mahalleler[0] || '',
      isitma_turu: metadata.isitmalar[0] || '',
      otopark: metadata.isitmalar[0] || ''
    });
    setPrediction(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) :
        (type === 'number' ? parseFloat(value) : value)
    }));
  };

  const isFormValid = () => {
    const requiredFields = [
      'mahalle', 'isitma_turu', 'otopark', 'dairenin_bulundugu_kat',
      'oda_sayisi2', 'salon_sayisi', 'depozito', 'banyo_sayisi',
      'bina_kat_sayisi', 'bina_yas', 'net_brut_orani'
    ];
    return requiredFields.every(field => formData[field] !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);

    // Convert empty strings to default numbers to avoid API error
    const cleanedData = {
      ...formData,
      dairenin_bulundugu_kat: Number(formData.dairenin_bulundugu_kat) || 1,
      oda_sayisi2: Number(formData.oda_sayisi2) || 2,
      salon_sayisi: Number(formData.salon_sayisi) || 1,
      depozito: Number(formData.depozito) || 0,
      banyo_sayisi: Number(formData.banyo_sayisi) || 1,
      bina_kat_sayisi: Number(formData.bina_kat_sayisi) || 5,
      bina_yas: Number(formData.bina_yas) || 5,
      net_brut_orani: Number(formData.net_brut_orani) || 0.85
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, cleanedData);
      setPrediction(response.data.prediction);
    } catch (error) {
      alert("Tahmin sırasında bir hata oluştu. Lütfen tüm alanları kontrol edin.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Antalya Muratpaşa Kira Tahmini</h1>
        <p>Evinizin özelliklerini girin, piyasa değerini saniyeler içinde öğrenin.</p>
      </header>

      <main className="main-card">
        <form onSubmit={handleSubmit}>
          <div className="grid">
            {/* Mahalle */}
            <div className="form-group">
              <label><MapPin size={20} /> Mahalle</label>
              <select name="mahalle" value={formData.mahalle} onChange={handleChange}>
                {metadata.mahalleler.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Isıtma */}
            <div className="form-group">
              <label><Wind size={20} /> Isıtma Türü</label>
              <select name="isitma_turu" value={formData.isitma_turu} onChange={handleChange}>
                {metadata.isitmalar.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            {/* Otopark */}
            <div className="form-group">
              <label><Car size={20} /> Otopark</label>
              <select name="otopark" value={formData.otopark} onChange={handleChange}>
                {metadata.otoparklar.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Daire Katı */}
            <div className="form-group">
              <label><Layers size={20} /> Dairenin Katı</label>
              <input type="number" name="dairenin_bulundugu_kat" value={formData.dairenin_bulundugu_kat} onChange={handleChange} min="-1" max="50" />
            </div>

            {/* Oda Sayısı */}
            <div className="form-group">
              <label><Home size={20} /> Oda Sayısı</label>
              <input type="number" name="oda_sayisi2" value={formData.oda_sayisi2} onChange={handleChange} min="1" max="10" />
            </div>

            {/* Salon Sayısı */}
            <div className="form-group">
              <label><Armchair size={20} /> Salon Sayısı</label>
              <input type="number" name="salon_sayisi" value={formData.salon_sayisi} onChange={handleChange} min="0" max="5" />
            </div>

            {/* Banyo Sayısı */}
            <div className="form-group">
              <label><Bath size={20} /> Banyo Sayısı</label>
              <input type="number" name="banyo_sayisi" value={formData.banyo_sayisi} onChange={handleChange} min="1" max="5" />
            </div>

            {/* Bina Kat Sayısı */}
            <div className="form-group">
              <label><Building size={20} /> Bina Kat Sayısı</label>
              <input type="number" name="bina_kat_sayisi" value={formData.bina_kat_sayisi} onChange={handleChange} min="1" max="100" />
            </div>

            {/* Bina Yaşı */}
            <div className="form-group">
              <label><Calendar size={20} /> Bina Yaşı</label>
              <input type="number" name="bina_yas" value={formData.bina_yas} onChange={handleChange} min="0" max="100" />
            </div>

            {/* Depozito */}
            <div className="form-group">
              <label><Coins size={20} /> Depozito (TL)</label>
              <input type="number" name="depozito" value={formData.depozito} onChange={handleChange} />
            </div>

            {/* Net/Brüt Oranı */}
            <div className="form-group">
              <label><Percent size={20} /> Alan Verimliliği (Net/Brüt)</label>
              <input type="number" name="net_brut_orani" value={formData.net_brut_orani} onChange={handleChange} step="0.01" min="0" max="1" />
            </div>
          </div>

          <div className="checkbox-grid">
            <div className="checkbox-group">
              <input type="checkbox" id="esya_durumu" name="esya_durumu" checked={formData.esya_durumu === 1} onChange={handleChange} />
              <label htmlFor="esya_durumu"><Sofa size={20} /> Eşyalı</label>
            </div>
            <div className="checkbox-group">
              <input type="checkbox" id="sahibi" name="sahibi" checked={formData.sahibi === 1} onChange={handleChange} />
              <label htmlFor="sahibi"><User size={20} /> Emlakçıdan</label>
            </div>
            <div className="checkbox-group">
              <input type="checkbox" id="balkon" name="balkon" checked={formData.balkon === 1} onChange={handleChange} />
              <label htmlFor="balkon"><Flower2 size={20} /> Balkon Var</label>
            </div>
            <div className="checkbox-group">
              <input type="checkbox" id="asansor" name="asansor" checked={formData.asansor === 1} onChange={handleChange} />
              <label htmlFor="asansor"><ArrowUp size={20} /> Asansör Var</label>
            </div>
            <div className="checkbox-group">
              <input type="checkbox" id="site_icinde" name="site_icinde" checked={formData.site_icinde === 1} onChange={handleChange} />
              <label htmlFor="site_icinde"><ShieldCheck size={20} /> Site İçinde</label>
            </div>
          </div>

          <div className="actions">
            <button type="button" className="reset-button" onClick={handleReset}>
              <RotateCcw size={18} /> Sıfırla
            </button>
            <button type="submit" className="predict-button" disabled={!isFormValid() || loading}>
              {loading ? 'Hesaplanıyor...' : 'Kira Tahmini Yap'}
            </button>
          </div>
        </form>

        {prediction !== null && (
          <div className="result-section">
            <p>Tahmini Aylık Kira Bedeli</p>
            <span className="result-value">{prediction.toLocaleString('tr-TR')} TL</span>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
