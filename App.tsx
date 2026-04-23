import { useState } from 'react';
import FamilyForm from './src/components/FamilyForm';
import GenealogyTree from './src/components/GenealogyTree';
import ShinsoKarte from './src/components/ShinsoKarte';
import { type FamilyData, INITIAL_FAMILY_DATA } from './src/lib/shinso';
import { LayoutDashboard, Network, FileText, Download } from 'lucide-react';
import { generatePDF } from './src/lib/pdf';
import './App.css';

type Tab = 'input' | 'tree' | 'karte';

function App() {
  const [data, setData] = useState<FamilyData>(INITIAL_FAMILY_DATA);
  const [activeTab, setActiveTab] = useState<Tab>('input');

  const handleExportPDF = async () => {
    const elementId = activeTab === 'tree' ? 'genealogy-tree' : 'shinso-karte';
    const filename = activeTab === 'tree' ? '心相科学_家系図.pdf' : `心相科学_診断書_${data.self.name || '本人'}.pdf`;
    await generatePDF(elementId, filename);
  };

  return (
    <div className="app-container">
      <nav className="side-nav">
        <div className="logo-area">
          <div className="logo-icon">M</div>
          <span className="logo-text">Mental Life<br/>Producer</span>
        </div>
        
        <div className="nav-items">
          <button 
            className={`nav-item ${activeTab === 'input' ? 'active' : ''}`}
            onClick={() => setActiveTab('input')}
          >
            <LayoutDashboard size={20} />
            <span>データ入力</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'tree' ? 'active' : ''}`}
            onClick={() => setActiveTab('tree')}
          >
            <Network size={20} />
            <span>家系図ビュー</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'karte' ? 'active' : ''}`}
            onClick={() => setActiveTab('karte')}
          >
            <FileText size={20} />
            <span>個人カルテ</span>
          </button>
        </div>

        <div className="nav-footer">
          {activeTab !== 'input' && (
            <button className="export-btn" onClick={handleExportPDF}>
              <Download size={18} />
              <span>PDF保存</span>
            </button>
          )}
        </div>
      </nav>

      <main className="main-content">
        <div className="content-inner">
          {activeTab === 'input' && (
            <FamilyForm data={data} onChange={setData} />
          )}

          {activeTab === 'tree' && (
            <div id="genealogy-tree">
              <GenealogyTree data={data} />
            </div>
          )}

          {activeTab === 'karte' && (
            <div id="shinso-karte" className="karte-gallery">
              <ShinsoKarte 
                name={data.self.name} 
                birthDate={data.self.birthDate} 
                relationship="本人" 
              />
              {data.spouse.birthDate && (
                 <ShinsoKarte 
                    name={data.spouse.name} 
                    birthDate={data.spouse.birthDate} 
                    relationship="配偶者" 
                  />
              )}
              {data.children.filter(c => c.birthDate).map((c, i) => (
                <ShinsoKarte 
                  key={i}
                  name={c.name} 
                  birthDate={c.birthDate} 
                  relationship={`子供 ${i+1}`} 
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
