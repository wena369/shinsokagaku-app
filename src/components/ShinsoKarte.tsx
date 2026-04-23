import React from 'react';
import './ShinsoKarte.css';
import { getDetailedShinso, parseDate } from '../lib/shinso';
// import { BASIC_TRAITS, LUCKY_COLORS, SHINSO_MATRIX } from '../data/shinsodata';
import AppraisalMemo from './AppraisalMemo';
import { generateKarteMemo } from '../lib/memoGenerator';

interface ShinsoKarteProps {
  name: string;
  birthDate: string;
  manualShinso?: string;
  relationship?: string;
  memo?: string;
  onMemoChange?: (val: string) => void;
  isBatchPrinting?: boolean;
}

const ShinsoKarte: React.FC<ShinsoKarteProps> = ({ name, birthDate, manualShinso, relationship, memo = "", onMemoChange, isBatchPrinting = false }) => {
  const { year, month, day } = parseDate(birthDate);
  const details = getDetailedShinso(year, month, day, manualShinso);

  return (
    <div className="shinso-karte">
      {!isBatchPrinting && (
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
          }
        `}</style>
      )}
      <div className="karte-header">
        <span className="relationship-tag">{relationship}</span>
        <h3 className="member-name">{name || "未入力"}</h3>
        <p className="birth-date">{birthDate ? `${year}年${month}月${day}日生` : "生年月日 未設定"}</p>
      </div>

      <div className="karte-main-visual">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.1em' }}>ラッキーカラー</span>
        </div>
        <div className="shinso-row">
          <div className="shinso-digit-block">
            <span className="shinso-digit" style={{ color: details.luckColorX }}>{details.x}</span>
            <span className="luck-color-name">{details.luckColorNameX}</span>
          </div>
          <div className="shinso-digit-block">
            <span className="shinso-digit" style={{ color: details.luckColorY }}>{details.y}</span>
            <span className="luck-color-name">{details.luckColorNameY}</span>
          </div>
          <div className="shinso-digit-block">
            <span className="shinso-digit" style={{ color: details.luckColorZ }}>{details.z}</span>
            <span className="luck-color-name">{details.luckColorNameZ}</span>
          </div>
        </div>
          
        <div className="sub-metrics-row">
          <div className="metrics-left">
            <div className="metric-box">
              <span className="metric-label">グループ数</span>
              <div className="group-box">{details.positionGroup}</div>
            </div>
            <div className="metric-box">
              <span className="metric-label">運気数</span>
              <div className="rhythm-circle">{details.luckRhythmNumber}</div>
            </div>
            <div className="metric-box">
              <span className="metric-label">循環数</span>
              <div className="circulation-val">{details.z}</div>
            </div>
          </div>

          <div className="metrics-right">
             <div className="metric-box">
               <span className="metric-label">基本数</span>
               <div className="basic-num">({details.basicNumber})</div>
             </div>
             <div className="conception-stack">
               <span className="metric-label">受胎数</span>
               <div className="conception-vals">
                 <span>[{details.conceptionSelf}(自)</span>
                 <span> {details.conceptionOther}(他)]</span>
               </div>
             </div>
          </div>
        </div>

        <div className="trait-card-full">
          <span className="card-label">基本性質: {details.trait}</span>
          <p className="trait-description">
            {details.description}
          </p>
        </div>
      </div>

      <div className="hakkenden-section">
        <h4 className="section-title">八犬伝図 (9x9 宇宙マトリックス)</h4>
        <div className="hakkenden-grid-9x9">
          {details.hakkendenMatrix.map((row, ri) => 
            row.map((cell, ci) => {
              const dx = ci - 4; // column offset
              const dy = ri - 4; // row offset
              const adx = Math.abs(dx);
              const ady = Math.abs(dy);
              const dist = Math.max(adx, ady);
              const isHakkendenDir = dx === 0 || dy === 0 || adx === ady;
              const isCenter = adx === 0 && ady === 0;
              
              let zoneClass = "none";
              if (isHakkendenDir && !isCenter) {
                if (dist === 1) zoneClass = "inner";
                else if (dist === 2 || dist === 3) zoneClass = "middle";
                else if (dist === 4) zoneClass = "outer";
              }

              return (
                <div key={`${ri}-${ci}`} className={`grid-cell ${zoneClass}`}>
                  <div className={`cell-circle ${isCenter ? 'center' : ''} ${zoneClass}`}>
                    {cell}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bottom-split-section">
        <div className="transformation-section">
          <h4>人生の幸福大転換期 (年齢 / 西暦)</h4>
          <div className="ages-grid">
            {details.transformationAges.slice(0, 8).map((age, i) => (
              <div key={i} className="age-pill">
                <span className="age-num">{age}歳</span>
                <span className="year-num">({details.transformationYears[i]})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="explanation-box">
          <h4>各項目の解説</h4>
          <ul>
            <li><strong>基本数:</strong> 樹木でイメージすると、心相数が葉っぱ（各個性）だとすると、基本数は枝の部分になります。同じ枝であったり、足して999になる枝は、やはりご縁のある数字といえます。</li>
            <li><strong>受胎数:</strong> 心相科学理論で特殊な相性判定となり、通常の相性判定に加えて出現する運命の関係です。自分から見た受胎数と相手から見た受胎数があり、どちらも運命の関係となる数字です。</li>
            <li><strong>八犬伝図:</strong> 人間関係図です。自分を囲む８人（内八犬伝）は一生を通じて支え合う人、外八犬伝は自分にない能力を持った人、中八犬伝は内と外のどちらに近いかにより、それぞれの次にその役割を持ちます。</li>
          </ul>
        </div>
      </div>

      {/* 鑑定メモ */}
      {onMemoChange && (
        <AppraisalMemo 
          memo={memo} 
          onMemoChange={onMemoChange} 
          onRegenerate={() => onMemoChange(generateKarteMemo({ name, birthDate, manualShinso }))} 
        />
      )}

      <div className="copyright-footer">©心相科学協会｜Division Miroku Inc.</div>
    </div>
  );
};

export default ShinsoKarte;
