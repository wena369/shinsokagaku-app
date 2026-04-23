import { useState } from 'react';
import { Heart } from 'lucide-react';
import { getDetailedShinso, type FamilyData } from '../lib/shinso';
import AppraisalMemo from './AppraisalMemo';
import { generateCompatibilityMemo } from '../lib/memoGenerator';

interface PersonInput {
  name: string;
  gender: 'male' | 'female' | string;
  birthDate: string;
  manualShinso?: string;
}

interface CompatibilityCheckProps {
  selfData: any;
  onSelfChange: (data: any) => void;
  partnerData?: any;
  onPartnerChange?: (data: any) => void;
  memo?: string;
  onMemoChange?: (val: string) => void;
  isBatchPrinting?: boolean;
}

export default function CompatibilityCheck({ selfData, onSelfChange, partnerData, onPartnerChange, memo = "", onMemoChange, isBatchPrinting = false }: CompatibilityCheckProps) {
  // 相手のローカル状態（親から渡されなかった場合のフォールバック）
  const [internalPartner, setInternalPartner] = useState<PersonInput>({
    name: '',
    gender: 'female',
    birthDate: '',
    manualShinso: ''
  });

  const partner = partnerData || internalPartner;
  const setPartner = onPartnerChange || setInternalPartner;

  const handleSelfChange = (field: keyof PersonInput, value: string) => {
    onSelfChange({ ...selfData, [field]: value });
  };

  const handlePartnerChange = (field: keyof PersonInput, value: string) => {
    setPartner({ ...partner, [field]: value });
  };

  // 心相データ計算（日付か手動入力がある場合のみ）
  const getShinsoInfo = (person: PersonInput) => {
    if (!person.birthDate && !person.manualShinso) return null;
    try {
      const [year, month, day] = person.birthDate.split('-').map(Number);
      return getDetailedShinso(year || 2000, month || 1, day || 1, person.manualShinso || undefined);
    } catch {
      return null;
    }
  };

  const selfInfo = getShinsoInfo(selfData);
  const partnerInfo = getShinsoInfo(partner);

  const selfLineColor = selfInfo?.luckColorY || '#e5e7eb';
  const selfBoxBg = selfInfo?.luckColorX ? `${selfInfo.luckColorX}20` : '#f9fafb';

  const partnerLineColor = partnerInfo?.luckColorY || '#e5e7eb';
  const partnerBoxBg = partnerInfo?.luckColorX ? `${partnerInfo.luckColorX}20` : '#f9fafb';

  return (
    <div className="compatibility-container" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {!isBatchPrinting && (
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
            .print-hide { display: none !important; }
            .nav-sidebar { display: none !important; }
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
            body { font-size: 13px !important; }
            .compatibility-container { margin: 0 !important; padding: 0 !important; max-width: none !important; zoom: 0.95; }
            table { page-break-inside: auto; margin-bottom: 5px !important; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            td, th { padding: 8px !important; font-size: 0.9rem !important; }
            h3 { margin-bottom: 10px !important; }
            p { margin-bottom: 10px !important; }
            .print-footer { display: block !important; text-align: center; margin-top: 15px; font-size: 11px; color: #6b7280; }
          }
          @media screen {
            .print-footer { display: none; }
          }
        `}</style>
      )}

      <div className="diagram-header" style={{ position: 'relative', marginBottom: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', color: '#1f2937', margin: 0 }}>
          <Heart color="#ef4444" fill="#ef4444" />
          相性鑑定
        </h2>
        <div className="print-hide" style={{ position: 'absolute', top: 0, right: 0 }}>
          <button 
            onClick={() => window.print()} 
            style={{ padding: '0.6rem 1.2rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            A4縦で印刷・PDF出力
          </button>
        </div>
      </div>

      <div className="print-hide" style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', marginBottom: '40px' }}>
        {/* 左側：自分 */}
        <div style={{ flex: '1', minWidth: '300px', background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ borderBottom: `3px solid ${selfLineColor}`, paddingBottom: '10px', marginBottom: '20px' }}>自分</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#4b5563' }}>お名前</label>
              <input type="text" value={selfData.name} onChange={e => handleSelfChange('name', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} placeholder="名前を入力" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#4b5563' }}>性別</label>
              <select value={selfData.gender} onChange={e => handleSelfChange('gender', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                <option value="">選択してください</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#4b5563' }}>生年月日</label>
              <input type="date" value={selfData.birthDate} onChange={e => handleSelfChange('birthDate', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#4b5563' }}>心相数（基本は未入力で自動計算）</label>
              <input type="text" value={selfData.manualShinso} onChange={e => handleSelfChange('manualShinso', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} placeholder="例: 123" />
            </div>
            {selfInfo && (
              <div style={{ marginTop: '10px', padding: '15px', backgroundColor: selfBoxBg, border: `1px solid ${selfInfo.luckColorX}`, borderRadius: '4px', fontSize: '1.2rem', textAlign: 'center' }}>
                <strong>あなたの心相数: {selfInfo.shinso}</strong>
              </div>
            )}
          </div>
        </div>

        {/* 右側：相手 */}
        <div style={{ flex: '1', minWidth: '300px', background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ borderBottom: `3px solid ${partnerLineColor}`, paddingBottom: '10px', marginBottom: '20px' }}>お相手</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#4b5563' }}>お名前</label>
              <input type="text" value={partner.name} onChange={e => handlePartnerChange('name', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} placeholder="名前を入力" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#4b5563' }}>性別</label>
              <select value={partner.gender} onChange={e => handlePartnerChange('gender', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                <option value="">選択してください</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#4b5563' }}>生年月日</label>
              <input type="date" value={partner.birthDate} onChange={e => handlePartnerChange('birthDate', e.target.value)} min="1900-01-01" max="2100-12-31" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#4b5563' }}>心相数（基本は未入力で自動計算）</label>
              <input type="text" value={partner.manualShinso} onChange={e => handlePartnerChange('manualShinso', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} placeholder="例: 123" />
            </div>
            {partnerInfo && (
              <div style={{ marginTop: '10px', padding: '15px', backgroundColor: partnerBoxBg, border: `1px solid ${partnerInfo.luckColorX}`, borderRadius: '4px', fontSize: '1.2rem', textAlign: 'center' }}>
                <strong>お相手の心相数: {partnerInfo.shinso}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 相性パラメータ比較エリア */}
      <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '20px', textAlign: 'center', color: '#374151' }}>相性パラメータ比較</h3>
        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#6b7280', marginBottom: '30px' }}>
          ※重なる項目が多いほど相性が良いとされます。両者のデータが揃うと表示されます。
        </p>
        
        {selfInfo && partnerInfo ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', width: '30%' }}>判定項目</th>
                <th style={{ padding: '12px', width: '25%' }}>自分</th>
                <th style={{ padding: '12px', width: '20%' }}>判定</th>
                <th style={{ padding: '12px', width: '25%' }}>お相手</th>
              </tr>
            </thead>
            <tbody>
              <ComparisonRow 
                label="表面数（心相数）" 
                val1={selfInfo.shinso} 
                val2={partnerInfo.shinso} 
                matchResult={checkSurfaceNumber(selfInfo.shinso, partnerInfo.shinso)}
              />
              <ComparisonRow 
                label="基本数" 
                val1={selfInfo.basicNumber.toString()} 
                val2={partnerInfo.basicNumber.toString()} 
                matchResult={checkBasicNumber(selfInfo.basicNumber.toString(), partnerInfo.basicNumber.toString())}
              />
              <ComparisonRow 
                label="受胎数（自）" 
                val1={selfInfo.conceptionSelf} 
                val2={partnerInfo.conceptionSelf} 
                matchResult={checkConception(selfInfo.conceptionSelf, partnerInfo.shinso, partnerInfo.conceptionSelf, selfInfo.shinso)}
              />
              <ComparisonRow 
                label="受胎数（他）" 
                val1={selfInfo.conceptionOther} 
                val2={partnerInfo.conceptionOther} 
                matchResult={checkConception(selfInfo.conceptionOther, partnerInfo.shinso, partnerInfo.conceptionOther, selfInfo.shinso)}
              />
              <ComparisonRow 
                label="グループ数" 
                val1={selfInfo.positionGroup.toString()} 
                val2={partnerInfo.positionGroup.toString()} 
                matchResult={checkGroupNumber(selfInfo.positionGroup.toString(), partnerInfo.positionGroup.toString())}
              />
              <ComparisonRow 
                label="運気数" 
                val1={selfInfo.luckRhythmNumber.toString()} 
                val2={partnerInfo.luckRhythmNumber.toString()} 
                matchResult={checkLuckRhythmNumber(selfInfo.luckRhythmNumber, partnerInfo.luckRhythmNumber)}
              />
              <ComparisonRow 
                label="循環数" 
                val1={selfInfo.z.toString()} 
                val2={partnerInfo.z.toString()} 
                matchResult={checkCirculationNumber(selfInfo.z, partnerInfo.z)}
              />
              <ComparisonRow 
                label="八犬伝図" 
                val1="自分からの距離で判定" 
                val2={partnerInfo.shinso} 
                matchResult={checkHakkenden(selfInfo.hakkendenMatrix, partnerInfo.shinso)}
              />
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
            自分とお相手、双方の生年月日（または心相数）を入力してください。
          </div>
        )}

        {onMemoChange && selfInfo && partnerInfo && (
          <AppraisalMemo 
            memo={memo} 
            onMemoChange={onMemoChange} 
            onRegenerate={() => onMemoChange(generateCompatibilityMemo({} as FamilyData))} 
          />
        )}

        <div className="print-footer">
          ©心相科学協会｜Division Miroku Inc.
        </div>
      </div>
    </div>
  );
}

// --- 相性判定ロジック群 ---
interface MatchResult {
  isMatch: boolean;
  score: number;
  label: string;
  description?: string;
}

function checkSurfaceNumber(s1: string, s2: string): MatchResult {
  if (!s1 || !s2 || s1.length !== 3 || s2.length !== 3) return { isMatch: false, score: 0, label: "-" };

  // 〈999完成数（究極のペア）〉
  let is999 = true;
  for (let i = 0; i < 3; i++) {
    const sum = parseInt(s1[i], 10) + parseInt(s2[i], 10);
    // 心相科学では0は9と同じ扱い、あるいは純粋な足し算として9になるかを判定
    if (sum !== 9 && sum !== 18) { // 9+9=18も9扱いの場合を考慮
      is999 = false;
      break;
    }
  }

  if (is999) {
    return { isMatch: true, score: 4, label: "🌟", description: "表面数を足して999（究極のペア・最も深い縁）" };
  }

  const digits1 = s1.split('');
  const digits2 = s2.split('');
  let d2 = [...digits2];
  let commonCount = 0;
  for (const d of digits1) {
    const idx = d2.indexOf(d);
    if (idx !== -1) {
      commonCount++;
      d2.splice(idx, 1);
    }
  }

  // 〈原則〉
  if (commonCount === 3) {
    return { isMatch: true, score: 3, label: "☆", description: "運命の人（3つの数字が共通）" };
  } else if (commonCount === 2) {
    return { isMatch: true, score: 2, label: "◎", description: "2つの数字が共通" };
  } else if (commonCount === 1) {
    return { isMatch: true, score: 1, label: "○", description: "1つの数字が共通" };
  } else {
    // 〈例外〉
    if (s1.includes('5') || s2.includes('5')) {
      return { isMatch: true, score: 1, label: "○ (例外)", description: "5を持つ人は誰でも合う" };
    }
    if (s1.includes('9') || s2.includes('9')) {
      return { isMatch: true, score: 1, label: "○ (例外)", description: "9を持つ人は誰でも合う" };
    }
    // 注：8と9の組み合わせも上記9の例外で網羅されます
  }
  
  return { isMatch: false, score: 0, label: "△", description: "共通数字なし" };
}

function checkBasicNumber(b1: string, b2: string): MatchResult {
  if (!b1 || !b2) return { isMatch: false, score: 0, label: "-" };
  
  if (b1 === b2) {
    return { isMatch: true, score: 3, label: "☆", description: "全く同じ基本数（本質が同じ）" };
  }
  
  const isPair = (a: string, b: string, pair1: string, pair2: string) => {
    return (a === pair1 && b === pair2) || (a === pair2 && b === pair1);
  };

  if (
    isPair(b1, b2, "336", "663") ||
    isPair(b1, b2, "369", "639") ||
    isPair(b1, b2, "933", "966") ||
    isPair(b1, b2, "393", "696")
  ) {
    return { isMatch: true, score: 2, label: "◎", description: "足して999になる関係（同じ区分）" };
  }
  
  return { isMatch: false, score: 0, label: "△", description: "異なる区分の基本数" };
}

function checkConception(conceptionSelf: string, shinsoPartner: string, conceptionPartner: string, shinsoSelf: string): MatchResult {
  if (!conceptionSelf || !shinsoPartner) return { isMatch: false, score: 0, label: "-" };

  const selfToPartner = (conceptionSelf === shinsoPartner);
  const partnerToSelf = (conceptionPartner === shinsoSelf);

  if (selfToPartner && partnerToSelf) {
    return { isMatch: true, score: 3, label: "☆", description: "お互いが受胎数の関係" };
  } else if (selfToPartner) {
    return { isMatch: true, score: 3, label: "☆", description: "お相手はあなたの受胎数（運命）" };
  } else if (partnerToSelf) {
    return { isMatch: true, score: 3, label: "☆", description: "あなたは相手の受胎数（運命）" };
  }

  return { isMatch: false, score: 0, label: "△", description: "受胎数の関係なし" };
}

function checkGroupNumber(g1: string, g2: string): MatchResult {
  if (!g1 || !g2) return { isMatch: false, score: 0, label: "-" };

  if (g1 === g2) {
    return { isMatch: true, score: 3, label: "☆", description: "同じグループ（同じ役割・相性良）" };
  }
  
  return { isMatch: false, score: 0, label: "△", description: "異なるグループ" };
}

function checkLuckRhythmNumber(l1: number, l2: number): MatchResult {
  if (!l1 || !l2) return { isMatch: false, score: 0, label: "-" };

  const d = Math.abs(l1 - l2);
  const dist = Math.min(d, 9 - d); // 9と1も隣同士（円環）として計算

  if (dist === 0) {
    return { isMatch: true, score: 2, label: "◎", description: "運気が同じ（バイオリズムが完全に一致）" };
  } else if (dist === 1) {
    return { isMatch: true, score: 1, label: "○", description: "運気が1つ隣（波長が近い）" };
  }
  
  return { isMatch: false, score: 0, label: "△", description: "運気リズムが異なる" };
}

function checkCirculationNumber(z1: number, z2: number): MatchResult {
  if (!z1 || !z2) return { isMatch: false, score: 0, label: "-" };

  const getZone = (z: number) => {
    if ([8, 1].includes(z)) return "North";
    if ([5, 4].includes(z)) return "South";
    if ([6, 3].includes(z)) return "West";
    if ([7, 2].includes(z)) return "East";
    return "Center";
  };

  const zone1 = getZone(z1);
  const zone2 = getZone(z2);

  if (zone1 === zone2) {
    return { isMatch: true, score: 2, label: "◎", description: "同じエリア（同じ仲間・理解し合える）" };
  }

  const isOpposite = (a: string, b: string) => {
    return (a === "North" && b === "South") || (a === "South" && b === "North") ||
           (a === "East" && b === "West") || (a === "West" && b === "East");
  };

  if (isOpposite(zone1, zone2)) {
    return { isMatch: false, score: 0, label: "△", description: "向こう岸（水と油・異質）" };
  }

  return { isMatch: true, score: 1, label: "○", description: "川上・川下などの関係" };
}

function checkHakkenden(selfMatrix: string[][], partnerShinso: string): MatchResult {
  if (!selfMatrix || selfMatrix.length !== 9 || !partnerShinso) return { isMatch: false, score: 0, label: "-" };

  let px = -1, py = -1;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (selfMatrix[r][c] === partnerShinso) {
        px = c;
        py = r;
        break;
      }
    }
  }

  if (px === -1 || py === -1) return { isMatch: false, score: 0, label: "-", description: "データエラー" };

  const dx = Math.abs(px - 4);
  const dy = Math.abs(py - 4);

  if (dx === 0 && dy === 0) {
    return { isMatch: true, score: 3, label: "☆", description: "マトリクス中心（同一の心相数）" };
  }

  // 放射状の8方向（縦・横・斜め）にあるかどうか
  const isHakkendenGroup = (dx === 0 || dy === 0 || dx === dy);

  if (isHakkendenGroup) {
    const distance = Math.max(dx, dy);
    if (distance === 1) {
      return { isMatch: true, score: 2, label: "◎", description: "内八犬伝（強く支え合う・近しい相性）" };
    } else if (distance === 2 || distance === 3) {
      return { isMatch: true, score: 1, label: "○", description: "中八犬伝（支え合うグループ）" };
    } else if (distance === 4) {
      return { isMatch: true, score: 1, label: "○", description: "外八犬伝（自分にない要素で支え合う）" };
    }
  }

  return { isMatch: false, score: 0, label: "△", description: "八犬伝グループ以外（一般的な相性）" };
}

// 比較用のテーブル行コンポーネント
function ComparisonRow({ label, val1, val2, matchResult }: { label: string, val1: string, val2: string, matchResult?: MatchResult }) {
  const isMatch = matchResult ? matchResult.isMatch : (val1 === val2 && val1 !== "今後実装");
  const matchLabel = matchResult ? matchResult.label : (isMatch ? "一致" : "-");
  
  return (
    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
      <td style={{ padding: '12px', fontWeight: 'bold', color: '#4b5563', textAlign: 'left' }}>{label}</td>
      <td style={{ padding: '12px', color: '#1f2937' }}>{val1}</td>
      <td style={{ padding: '12px' }}>
        {matchResult && matchResult.label !== "-" ? (
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ 
              display: 'inline-block', 
              padding: '2px 8px', 
              backgroundColor: matchResult.score >= 3 ? '#fce7f3' : (matchResult.isMatch ? '#dcfce7' : '#f3f4f6'), 
              color: matchResult.score >= 3 ? '#be185d' : (matchResult.isMatch ? '#166534' : '#6b7280'), 
              borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 'bold' 
            }}>
              {matchLabel}
            </span>
            {matchResult.description && (
              <span style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '4px', whiteSpace: 'nowrap' }}>{matchResult.description}</span>
            )}
          </div>
        ) : isMatch ? (
          <span style={{ display: 'inline-block', padding: '2px 8px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 'bold' }}>一致</span>
        ) : (
          <span style={{ color: '#d1d5db' }}>-</span>
        )}
      </td>
      <td style={{ padding: '12px', color: '#1f2937' }}>{val2}</td>
    </tr>
  );
}
