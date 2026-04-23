import { useState } from 'react';
import FamilyForm from './components/FamilyForm';
import GenealogyTree from './components/GenealogyTree';
import ShinsoKarte from './components/ShinsoKarte';
import CirculationDiagram from './components/CirculationDiagram';
import LuckRhythm from './components/LuckRhythm';
import CompatibilityCheck from './components/CompatibilityCheck';
import CoverPage from './components/CoverPage';
import { type FamilyData, INITIAL_FAMILY_DATA } from './lib/shinso';
import { LayoutDashboard, Network, FileText, RefreshCw, TrendingUp, Heart, Printer } from 'lucide-react';
import ShinsoDNAModel from './components/ShinsoDNAModel';
import DataLoaderModal from './components/DataLoaderModal';
import './App.css';

type Tab = 'input' | 'tree' | 'karte' | 'circulation' | 'luck' | 'compatibility';

function App() {
  const [data, setData] = useState<FamilyData>(INITIAL_FAMILY_DATA);
  const [activeTab, setActiveTab] = useState<Tab>('input');
  
  // 家系図の「◯◯家」状態を引き上げ
  const [familyName, setFamilyName] = useState<string>('');

  const [isDataLoaderOpen, setIsDataLoaderOpen] = useState(false);

  // 相性鑑定の「相手」の入力状態を引き上げ（一括印刷時にリセットされないようにするため）
  const [compatibilityPartner, setCompatibilityPartner] = useState<any>({
    name: '',
    gender: 'female',
    birthDate: '',
    manualShinso: ''
  });

  // 鑑定メモ（自由記入欄）の永続化
  const [memos, setMemos] = useState<Record<string, string>>({});
  const updateMemo = (key: string, text: string) => {
    setMemos(prev => ({ ...prev, [key]: text }));
  };

  const [isBatchPrinting, setIsBatchPrinting] = useState<boolean>(false);

  const handleBatchPrint = () => {
    setIsBatchPrinting(true);
    setTimeout(() => {
      window.print();
      // ブラウザの印刷ダイアログ表示後に元の画面に戻す
      setIsBatchPrinting(false);
    }, 500);
  };

  if (isBatchPrinting) {
    return (
      <div className="batch-print-container">
        <div className="batch-page-portrait-bleed">
          <CoverPage familyName={familyName} />
        </div>

        {/* 2. 家系図 (GenealogyTree) */}
        <div className="batch-page-landscape-bleed">
          <GenealogyTree data={data} memo={memos["tree"] || ""} onMemoChange={(m) => updateMemo("tree", m)} familyName={familyName} onFamilyNameChange={setFamilyName} isBatchPrinting={true} />
        </div>

        {/* 3. 個人カルテ (ShinsoKarte) */}
        <div className="batch-page-portrait">
          <ShinsoKarte name={data.self.name} birthDate={data.self.birthDate} manualShinso={data.self.manualShinso} relationship="本人" memo={memos["karte_self"] || ""} onMemoChange={(m) => updateMemo("karte_self", m)} isBatchPrinting={true} />
        </div>
        
        {(data.spouse.birthDate || data.spouse.manualShinso) && (
          <div className="batch-page-portrait">
            <ShinsoKarte name={data.spouse.name} birthDate={data.spouse.birthDate} manualShinso={data.spouse.manualShinso} relationship="配偶者" memo={memos["karte_spouse"] || ""} onMemoChange={(m) => updateMemo("karte_spouse", m)} isBatchPrinting={true} />
          </div>
        )}

        {data.children.filter((c: any) => c.birthDate || c.manualShinso).map((c: any, i: number) => (
          <div className="batch-page-portrait" key={`batch-child-${i}`}>
            <ShinsoKarte name={c.name} birthDate={c.birthDate} manualShinso={c.manualShinso} relationship={`子供 ${i+1}`} memo={memos[`karte_child_${i}`] || ""} onMemoChange={(m) => updateMemo(`karte_child_${i}`, m)} isBatchPrinting={true} />
          </div>
        ))}

        {(data.father.birthDate || data.father.manualShinso) && (
          <div className="batch-page-portrait">
            <ShinsoKarte name={data.father.name} birthDate={data.father.birthDate} manualShinso={data.father.manualShinso} relationship="父" memo={memos["karte_father"] || ""} onMemoChange={(m) => updateMemo("karte_father", m)} isBatchPrinting={true} />
          </div>
        )}
        
        {(data.mother.birthDate || data.mother.manualShinso) && (
          <div className="batch-page-portrait">
            <ShinsoKarte name={data.mother.name} birthDate={data.mother.birthDate} manualShinso={data.mother.manualShinso} relationship="母" memo={memos["karte_mother"] || ""} onMemoChange={(m) => updateMemo("karte_mother", m)} isBatchPrinting={true} />
          </div>
        )}

        {/* 4. 循環図 (CirculationDiagram) */}
        <div className="batch-page-portrait">
          <CirculationDiagram data={data} memo={memos["circulation"] || ""} onMemoChange={(m) => updateMemo("circulation", m)} isBatchPrinting={true} />
        </div>

        {/* 5. 運気リズム 9年サイクル (LuckRhythm cycle) */}
        <div className="batch-page-landscape">
          <LuckRhythm data={data} memo={memos["luck"] || ""} onMemoChange={(m) => updateMemo("luck", m)} isBatchPrinting={true} batchTab="cycle" />
        </div>

        {/* 6. 自分年表 (LuckRhythm timeline) - タイムラインも横向きが最適 */}
        <div className="batch-page-landscape">
          <LuckRhythm data={data} memo="" onMemoChange={undefined} isBatchPrinting={true} batchTab="timeline" />
        </div>

        {/* 7. 相性鑑定 (CompatibilityCheck) */}
        <div className="batch-page-portrait">
          <CompatibilityCheck 
            selfData={data.self} 
            onSelfChange={(val: any) => setData({...data, self: val})} 
            partnerData={compatibilityPartner}
            onPartnerChange={setCompatibilityPartner}
            memo={memos["compatibility"] || ""} 
            onMemoChange={(m) => updateMemo("compatibility", m)} 
            isBatchPrinting={true} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar print-hide">
        <div className="logo">
          Mental Life<br/>Producer
        </div>
        
        <nav className="nav-links">
          <button 
            className={`nav-button ${activeTab === 'input' ? 'active' : ''}`}
            onClick={() => setActiveTab('input')}
          >
            <LayoutDashboard size={22} />
            <span>データ入力</span>
          </button>
          
          <button 
            className={`nav-button ${activeTab === 'tree' ? 'active' : ''}`}
            onClick={() => setActiveTab('tree')}
          >
            <Network size={22} />
            <span>家系図ビュー</span>
          </button>
          
          <button 
            className={`nav-button ${activeTab === 'karte' ? 'active' : ''}`}
            onClick={() => setActiveTab('karte')}
          >
            <FileText size={22} />
            <span>個人カルテ</span>
          </button>

          <button 
            className={`nav-button ${activeTab === 'circulation' ? 'active' : ''}`}
            onClick={() => setActiveTab('circulation')}
          >
            <RefreshCw size={22} />
            <span>循環図ビュー</span>
          </button>

          <button 
            className={`nav-button ${activeTab === 'luck' ? 'active' : ''}`}
            onClick={() => setActiveTab('luck')}
          >
            <TrendingUp size={22} />
            <span>運気リズム</span>
          </button>

          <button 
            className={`nav-button ${activeTab === 'compatibility' ? 'active' : ''}`}
            onClick={() => setActiveTab('compatibility')}
            style={{ color: activeTab === 'compatibility' ? '#ef4444' : undefined }}
          >
            <Heart size={22} className={activeTab === 'compatibility' ? 'active-icon' : ''} />
            <span>相性鑑定</span>
          </button>
        </nav>

        <div className="nav-footer" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={handleBatchPrint}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.8rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Printer size={18} />
            一括印刷（全ページ綜合）
          </button>
          <ShinsoDNAModel />
        </div>
      </aside>

      <main className="main-content">
        <div className="content-inner">
          {activeTab === 'input' && (
            <div>
               <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }} className="print-hide">
                 <button 
                   onClick={() => setIsDataLoaderOpen(true)} 
                   style={{ background: '#059669', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                 >
                    LP申込データ読込
                 </button>
               </div>
               <DataLoaderModal 
                  isOpen={isDataLoaderOpen} 
                  onClose={() => setIsDataLoaderOpen(false)} 
                  onLoad={(fname, fdata) => { 
                    if(fname) setFamilyName(fname); 
                    if(fdata) {
                      setData({...data, ...fdata});
                      // 気になる人が入力されている場合、相性判定の「相手」に反映
                      const validPartner = fdata.interestedPeople?.find((p: any) => p.name || p.birthDate);
                      if (validPartner) {
                        setCompatibilityPartner({
                          name: validPartner.name || '',
                          gender: validPartner.gender || 'female',
                          birthDate: validPartner.birthDate || '',
                          manualShinso: validPartner.manualShinso || ''
                        });
                      }
                      // データ読み込み後、すぐに個人カルテ画面（出力結果）へ遷移
                      setActiveTab('karte');
                    }
                  }} 
               />
               <FamilyForm data={data} onChange={setData} />
            </div>
          )}

          {activeTab === 'tree' && (
            <div id="genealogy-tree" style={{ maxWidth: 'none', width: '100%' }}>
              <GenealogyTree data={data} memo={memos["tree"] || ""} onMemoChange={(m) => updateMemo("tree", m)} familyName={familyName} onFamilyNameChange={setFamilyName} />
            </div>
          )}

          {activeTab === 'karte' && (
            <div id="shinso-karte-container">
              {/* 印刷・PDF出力ボタン */}
              <div className="gt-actions print-hide" style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                <button 
                  onClick={() => window.print()} 
                  style={{ padding: '0.6rem 1.2rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                  A4縦で印刷・PDF出力
                </button>
              </div>

              <div id="shinso-karte" className="karte-gallery">
                {/* 印刷時には各カルテが1ページになるよう page-break-after をCSSで付与 */}
                {/* 自分 */}
                <ShinsoKarte name={data.self.name} birthDate={data.self.birthDate} manualShinso={data.self.manualShinso} relationship="本人" memo={memos["karte_self"] || ""} onMemoChange={(m) => updateMemo("karte_self", m)} />
                
                {/* 配偶者 */}
                {(data.spouse.birthDate || data.spouse.manualShinso) && (
                  <ShinsoKarte name={data.spouse.name} birthDate={data.spouse.birthDate} manualShinso={data.spouse.manualShinso} relationship="配偶者" memo={memos["karte_spouse"] || ""} onMemoChange={(m) => updateMemo("karte_spouse", m)} />
                )}

                {/* 子供 */}
                {data.children.filter((c: any) => c.birthDate || c.manualShinso).map((c: any, i: number) => (
                  <ShinsoKarte key={`child-${i}`} name={c.name} birthDate={c.birthDate} manualShinso={c.manualShinso} relationship={`子供 ${i+1}`} memo={memos[`karte_child_${i}`] || ""} onMemoChange={(m) => updateMemo(`karte_child_${i}`, m)} />
                ))}

                {(data.father.birthDate || data.father.manualShinso) && (
                  <ShinsoKarte name={data.father.name} birthDate={data.father.birthDate} manualShinso={data.father.manualShinso} relationship="父" memo={memos["karte_father"] || ""} onMemoChange={(m) => updateMemo("karte_father", m)} />
                )}

                {(data.mother.birthDate || data.mother.manualShinso) && (
                  <ShinsoKarte name={data.mother.name} birthDate={data.mother.birthDate} manualShinso={data.mother.manualShinso} relationship="母" memo={memos["karte_mother"] || ""} onMemoChange={(m) => updateMemo("karte_mother", m)} />
                )}

                {(data.spouseFather.birthDate || data.spouseFather.manualShinso) && (
                  <ShinsoKarte name={data.spouseFather.name} birthDate={data.spouseFather.birthDate} manualShinso={data.spouseFather.manualShinso} relationship="義父" memo={memos["karte_spouseFather"] || ""} onMemoChange={(m) => updateMemo("karte_spouseFather", m)} />
                )}

                {(data.spouseMother.birthDate || data.spouseMother.manualShinso) && (
                  <ShinsoKarte name={data.spouseMother.name} birthDate={data.spouseMother.birthDate} manualShinso={data.spouseMother.manualShinso} relationship="義母" memo={memos["karte_spouseMother"] || ""} onMemoChange={(m) => updateMemo("karte_spouseMother", m)} />
                )}

                {(data.paternalGrandfather.birthDate || data.paternalGrandfather.manualShinso) && (
                  <ShinsoKarte name={data.paternalGrandfather.name} birthDate={data.paternalGrandfather.birthDate} manualShinso={data.paternalGrandfather.manualShinso} relationship="父方祖父" memo={memos["karte_pGF"] || ""} onMemoChange={(m) => updateMemo("karte_pGF", m)} />
                )}

                {(data.paternalGrandmother.birthDate || data.paternalGrandmother.manualShinso) && (
                  <ShinsoKarte name={data.paternalGrandmother.name} birthDate={data.paternalGrandmother.birthDate} manualShinso={data.paternalGrandmother.manualShinso} relationship="父方祖母" memo={memos["karte_pGM"] || ""} onMemoChange={(m) => updateMemo("karte_pGM", m)} />
                )}

                {(data.maternalGrandfather.birthDate || data.maternalGrandfather.manualShinso) && (
                  <ShinsoKarte name={data.maternalGrandfather.name} birthDate={data.maternalGrandfather.birthDate} manualShinso={data.maternalGrandfather.manualShinso} relationship="母方祖父" memo={memos["karte_mGF"] || ""} onMemoChange={(m) => updateMemo("karte_mGF", m)} />
                )}

                {(data.maternalGrandmother.birthDate || data.maternalGrandmother.manualShinso) && (
                  <ShinsoKarte name={data.maternalGrandmother.name} birthDate={data.maternalGrandmother.birthDate} manualShinso={data.maternalGrandmother.manualShinso} relationship="母方祖母" memo={memos["karte_mGM"] || ""} onMemoChange={(m) => updateMemo("karte_mGM", m)} />
                )}

                {data.siblings.filter((s: any) => s.birthDate || s.manualShinso).map((s: any, i: number) => (
                  <ShinsoKarte key={`sibling-${i}`} name={s.name} birthDate={s.birthDate} manualShinso={s.manualShinso} relationship={`兄弟姉妹 ${i+1}`} memo={memos[`karte_sib_${i}`] || ""} onMemoChange={(m) => updateMemo(`karte_sib_${i}`, m)} />
                ))}

                {data.interestedPeople.filter((p: any) => p.birthDate || p.manualShinso).map((p: any, i: number) => (
                  <ShinsoKarte key={`interested-${i}`} name={p.name} birthDate={p.birthDate} manualShinso={p.manualShinso} relationship={`気になる人 ${i+1}`} memo={memos[`karte_int_${i}`] || ""} onMemoChange={(m) => updateMemo(`karte_int_${i}`, m)} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'circulation' && (
            <div id="circulation-diagram">
              <CirculationDiagram data={data} memo={memos["circulation"] || ""} onMemoChange={(m) => updateMemo("circulation", m)} />
            </div>
          )}

          {activeTab === 'luck' && (
            <div id="luck-rhythm-view">
              <LuckRhythm data={data} memo={memos["luck"] || ""} onMemoChange={(m) => updateMemo("luck", m)} />
            </div>
          )}
        </div>
        
        {activeTab === 'compatibility' && (
          <div id="compatibility-check-view">
            <CompatibilityCheck 
              selfData={data.self} 
              onSelfChange={(newSelf) => setData({ ...data, self: newSelf })}
              partnerData={compatibilityPartner}
              onPartnerChange={setCompatibilityPartner}
              memo={memos["compatibility"] || ""} 
              onMemoChange={(m) => updateMemo("compatibility", m)} 
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
