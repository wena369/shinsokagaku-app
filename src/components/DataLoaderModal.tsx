import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Download, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (familyName: string, familyData: any) => void;
}

export default function DataLoaderModal({ isOpen, onClose, onLoad }: Props) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSubmissions();
    }
  }, [isOpen]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('id, created_at, form_data')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const filtered = (data || []).filter((dbRow: any) => {
         const d = dbRow.form_data;
         return d && d.type === 'shinsokagaku' && d.formType === 'appraisal' && d.familyData;
      });
      
      setSubmissions(filtered);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>LPからの申込データ読み込み</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        
        {loading ? (
           <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>読み込み中...</div>
        ) : submissions.length === 0 ? (
           <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>申込データが見つかりません。</div>
        ) : (
           <div style={{ overflowY: 'auto', flex: 1 }}>
              {submissions.map((sub: any) => {
                const fd = sub.form_data;
                const d = new Date(sub.created_at);
                const dateStr = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
                
                // 氏名から苗字を抽出 (「家」は付与しない)
                const nameParts = fd.applicantName ? fd.applicantName.split(/[\s　]+/) : [''];
                const inferredFamilyName = nameParts[0] ? nameParts[0] : '';

                return (
                  <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{fd.applicantName} 様</div>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                        申込日時: {dateStr} | 選択メニュー: {fd.selections?.map((s:any)=>s.name).join(', ')}
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        onLoad(inferredFamilyName, fd.familyData);
                        onClose();
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      <Download size={16} /> 即時出力
                    </button>
                  </div>
                )
              })}
           </div>
        )}
      </div>
    </div>
  );
}
