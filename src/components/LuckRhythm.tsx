import React, { useState } from 'react';
import { getDetailedShinso, parseDate, getLuckPositionIndex } from '../lib/shinso';
import './LuckRhythm.css';
import AppraisalMemo from './AppraisalMemo';
import { generateLuckMemo } from '../lib/memoGenerator';

interface Props {
  data: any;
  memo?: string;
  onMemoChange?: (val: string) => void;
  isBatchPrinting?: boolean;
  batchTab?: 'cycle' | 'timeline';
  targetMemberLabel?: string; // 一括印刷などで特定のメンバーを指定して描画するためのプロパティ
}

// ----------------------------------------------------
// New: Timeline Row Component for "自分年表"
// ----------------------------------------------------
const TimelineRow = ({ startIndex, endIndex, member, getTextColor }: any) => {
  const safeMember = member || { name: '本人', birthDate: '1980-01-01', luckNumber: 9, luckColor: '#10b981' };
  const birthDate = safeMember.birthDate ? parseDate(safeMember.birthDate) : { year: 1980, month: 1, day: 1 };
  const luckNumber = safeMember.luckNumber || 9; // この「運気数」が直接的にオフセットを決定します
  
  // 生まれ年の単数変換数（DWCに割り当てられる基準となる数）
  const birthYearSum = birthDate.year % 9 === 0 ? 9 : birthDate.year % 9;
  
  // 0歳の位置（波形上のインデックス 0:A 〜 8:I）の算出
  // 法則：「マスの数字が自身の運気数となる場所が0歳のスタート地点」
  // DWCのマス(idx=6)がbirthYearSumであり、右にいくほど数字が減るため、以下で算出可能
  const i_Age0 = (6 + birthYearSum - luckNumber + 9) % 9;
  
  const steps = endIndex - startIndex;
  const svgWidth = 1400; // Increased width as requested to ensure clear drawing of 27 steps
  const paddingX = 30; 
  const stepWidth = (svgWidth - paddingX * 2) / steps;
  
  const nodes = [];
  for (let i = startIndex; i <= endIndex; i++) {
    const stepIdx = i - startIndex;
    
    // ループインデックス i をそのまま実年齢（age）として扱う
    const age = i;
    const year = birthDate.year + age;
    
    // 0歳時点のインデックス i_Age0 から年齢の分だけシフトした現在の波形位置 (0:A 〜 8:I) を算出
    const currentIdx = (i_Age0 + age) % 9;
    
    // Y座標のプロットを現在の波形位置に基づいて決定
    const cy = currentIdx <= 4 ? 60 + currentIdx * 25 : 160 - (currentIdx - 4) * 20;
    
    // 年齢に基づく運気数（DWCである G (idx=6) の時に必ず birthYearSum になり、右へ進むほど減る）
    let bioNum = (birthYearSum - (currentIdx - 6)) % 9;
    if (bioNum <= 0) bioNum += 9;
    
    const cx = paddingX + stepIdx * stepWidth;
    
    let type = 'white';
    if (currentIdx === 1 || currentIdx === 3) type = 'solid';
    else if (currentIdx === 2) type = 'double-black';
    else if (currentIdx === 6) type = 'double-white'; // DWCポイントは常に二重白丸
    
    // 幸福大転換のポイント（DWC）にバッジを配置する
    const isMatch = currentIdx === 6 && age >= 0;
    nodes.push({ age, year, bioNum, cx, cy, type, isMatch });
  }
  return (
    <div style={{ marginBottom: '1.5rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '1rem' }}>
      <div className="timeline-svg-wrapper">
        <svg viewBox={`0 0 ${svgWidth} 220`} style={{ width: '100%', height: 'auto', overflow: 'visible' }} className="timeline-svg">
          {/* Horizontal boundary guides */}
          <line x1={paddingX} y1="60" x2={svgWidth - paddingX} y2="60" stroke="#f1f5f9" strokeWidth="1" />
        <line x1={paddingX} y1="150" x2={svgWidth - paddingX} y2="150" stroke="#f1f5f9" strokeWidth="1" />
        
        {/* Zig-zag Path */}
        <polyline 
          points={nodes.map(n => `${n.cx},${n.cy}`).join(' ')} 
          fill="none" stroke="#94a3b8" strokeWidth="1.5" 
        />
        
        {/* Nodes and verticals */}
        {nodes.map(n => (
          <g key={n.age}>
            {/* Vertical drop line */}
            <line x1={n.cx} y1={n.cy} x2={n.cx} y2="180" stroke="#e2e8f0" strokeWidth="1" />
            
            {/* BioNum (Year's recursive transform) inside/above circle */}
            <text x={n.cx} y={n.cy - 12} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#334155">{n.bioNum}</text>
            
            {/* Age under the vertical line */}
            {n.age >= 0 ? (
              <text x={n.cx} y="195" textAnchor="middle" fontSize="13" fill="#64748b">{n.age}歳</text>
            ) : null}
            
            {/* Circle Rendering */}
            {n.type === 'solid' ? (
              <circle cx={n.cx} cy={n.cy} r={5.5} fill="#64748b" />
            ) : n.type === 'double-black' ? (
              <g>
                <circle cx={n.cx} cy={n.cy} r={6.5} fill="#fff" stroke="#111" strokeWidth="1.5" />
                <circle cx={n.cx} cy={n.cy} r={3.5} fill="#475569" />
              </g>
            ) : n.type === 'double-white' ? (
              <g>
                <circle cx={n.cx} cy={n.cy} r={6.5} fill="#fff" stroke="#111" strokeWidth="1.5" />
                <circle cx={n.cx} cy={n.cy} r={3.5} fill="none" stroke="#111" strokeWidth="1.5" />
              </g>
            ) : (
              <circle cx={n.cx} cy={n.cy} r={5.5} fill="#fff" stroke="#64748b" strokeWidth="1.5" />
            )}
            
            {/* Tag when lucky! */}
            {n.isMatch && (
              <g className="lucky-badge">
                <rect 
                  x={n.cx - 40} 
                  y={n.cy - 50} 
                  width="80" 
                  height="34" 
                  rx="6" 
                  ry="6" 
                  fill={safeMember.luckColor || '#10b981'} 
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth="1"
                />
                <text 
                  x={n.cx} 
                  y={n.cy - 38} 
                  textAnchor="middle" 
                  fontSize="10" 
                  fontWeight="bold" 
                  fill={getTextColor(safeMember.luckColor)}
                >
                  {safeMember.name || "運気数"}
                </text>
                <text 
                  x={n.cx} 
                  y={n.cy - 24} 
                  textAnchor="middle" 
                  fontSize="10" 
                  fontWeight="bold" 
                  fill={getTextColor(safeMember.luckColor)}
                >
                  幸福大転換
                </text>
              </g>
            )}
          </g>
        ))}
        </svg>
      </div>
    </div>
  );
};
// ----------------------------------------------------

const LuckRhythm: React.FC<Props> = ({ data, memo = "", onMemoChange, isBatchPrinting = false, batchTab, targetMemberLabel }) => {
  const [activeSubTab, setActiveSubTab] = useState<'cycle' | 'timeline'>('cycle');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMemberLabel, setSelectedMemberLabel] = useState<string>("本人");

  const currentTab = isBatchPrinting && batchTab ? batchTab : activeSubTab;

  const getTextColor = (hex: string) => {
    if (!hex || hex[0] !== '#') return '#fff';
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 135 ? '#111' : '#fff';
  };

  const getAllMembers = () => {
    const members: any[] = [];
    const addMember = (member: any, label: string) => {
      if (!member || (!member.birthDate && !member.manualShinso)) return;
      const { year, month, day } = parseDate(member.birthDate);
      const details = getDetailedShinso(year, month, day, member.manualShinso);
      members.push({ ...member, label, luckNumber: details.luckRhythmNumber, luckColor: details.luckColorX });
    };
    addMember(data.self, "本人");
    addMember(data.spouse, "配偶者");
    addMember(data.father, "父親");
    addMember(data.mother, "母親");
    addMember(data.paternalGrandfather, "父方祖父");
    addMember(data.paternalGrandmother, "父方祖母");
    addMember(data.maternalGrandfather, "母方祖父");
    addMember(data.maternalGrandmother, "母方祖母");
    addMember(data.spouseFather, "義父");
    addMember(data.spouseMother, "義母");

    data.siblings.forEach((s: any, i: number) => {
      addMember(s, `兄弟姉妹 ${i+1}`);
      if (s.spouse) {
        addMember(s.spouse, `兄弟姉妹 ${i+1}の配偶者`);
      }
      if (s.children) {
        s.children.forEach((c: any, ci: number) => {
          addMember(c, `兄弟姉妹 ${i+1}の子 ${ci+1}`);
        });
      }
    });

    data.spouseSiblings.forEach((s: any, i: number) => {
      addMember(s, `義兄弟姉妹 ${i+1}`);
      if (s.spouse) {
        addMember(s.spouse, `義兄弟姉妹 ${i+1}の配偶者`);
      }
      if (s.children) {
        s.children.forEach((c: any, ci: number) => {
          addMember(c, `義兄弟姉妹 ${i+1}の子 ${ci+1}`);
        });
      }
    });

    data.children.forEach((c: any, i: number) => addMember(c, `子供 ${i+1}`));
    data.grandchildren.forEach((g: any, i: number) => addMember(g, `孫 ${i+1}`));
    data.interestedPeople.forEach((p: any, i: number) => addMember(p, `気になる人 ${i+1}`));

    return members;
  };

  const rawMembers = getAllMembers();
  
  const activeMemberLabel = isBatchPrinting && targetMemberLabel ? targetMemberLabel : selectedMemberLabel;
  const activeMember = rawMembers.find(m => m.label === activeMemberLabel) || rawMembers.find(m => m.label === "本人") || rawMembers[0];
  
  // Calculate stack indices to prevent overlapping names
  // Also duplicate members at posIdx 0 (A) to posIdx 9 (J)
  const members = (() => {
    const counts = new Array(10).fill(0); // Expanded to 10 for J
    const expanded: any[] = [];
    
    rawMembers.forEach((m) => {
      const posIdx = getLuckPositionIndex(selectedYear, m.luckNumber);
      
      // Add regular position
      expanded.push({ ...m, posIdx, stackOrder: counts[posIdx]++ });
      
      // If A (0), also add to J (9)
      if (posIdx === 0) {
        expanded.push({ ...m, posIdx: 9, stackOrder: counts[9]++ });
      }
    });
    
    return expanded;
  })();

  // Wave points coordinates (SVG space 1000x320)
  const points = [
    { x: 50, y: 80, label: "A", special: "white-circle" },
    { x: 150, y: 110, label: "B", special: "solid-black" }, 
    { x: 250, y: 140, label: "C", special: "double-black" }, 
    { x: 350, y: 170, label: "D", special: "solid-black" }, 
    { x: 450, y: 200, label: "E", special: "white-circle" },
    { x: 550, y: 176, label: "F", special: "white-circle" }, // Up 24px
    { x: 650, y: 152, label: "G", special: "double-white" }, // Up 24px
    { x: 750, y: 128, label: "H", special: "white-circle" }, // Up 24px
    { x: 850, y: 104, label: "I", special: "white-circle" }, // Up 24px
    { x: 950, y: 80, label: "J", special: "white-circle" }, // Up 24px (Same height as A)
  ];

  // const getStatus = (idx: number) => {
  //   if (idx >= 1 && idx <= 3) return { text: "下降", class: "down" };
  //   return { text: "上昇", class: "up" };
  // };

  return (
    <div className="luck-rhythm-container glass">
      {!isBatchPrinting && (
        <style>{`
          @media print {
            @page { margin: 10mm; }
          }
        `}</style>
      )}
      <div className="diagram-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <div>
          <h2 className="diagram-title">運気リズム (9年サイクル)</h2>
          <div className="sub-tab-nav">
            <button className={currentTab === 'cycle' ? 'active tab-btn' : 'tab-btn'} onClick={() => setActiveSubTab('cycle')}>9年サイクル図</button>
            <button className={currentTab === 'timeline' ? 'active tab-btn' : 'tab-btn'} onClick={() => setActiveSubTab('timeline')}>自分年表</button>
          </div>
        </div>
        
        {/* A4横型印刷ボタン */}
        <div className="print-hide">
          <button 
            onClick={() => window.print()} 
            style={{ padding: '0.6rem 1.2rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}
          >
            A4横で印刷・PDF出力
          </button>
        </div>
      </div>

      {currentTab === 'cycle' ? (
        <div className="cycle-view">
          <div className="year-selector-row print-hide">
            <span>表示対象年:</span>
            <input 
              type="number" 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value) || 2026)} 
              className="year-input"
            />
          </div>

          <p className="important-note" style={{ color: '#e11d48', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', textAlign: 'center' }}>※誕生日を境に当該位置に移動します。</p>

          <div className="wave-canvas-wrapper" id="luck-cycle-chart">
            <svg viewBox="0 0 1000 320" className="wave-svg" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <marker id="arrowhead-down" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                </marker>
                <marker id="arrowhead-up" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                </marker>
              </defs>
              {/* Horizontal Guidelines */}
              <line x1="20" y1="80" x2="980" y2="80" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="20" y1="200" x2="980" y2="200" stroke="#f1f5f9" strokeWidth="1" />

              {/* Main Path */}
              <path 
                d="M 50 80 L 150 110 L 250 140 L 350 170 L 450 200 L 550 176 L 650 152 L 750 128 L 850 104 L 950 80" 
                fill="none" 
                stroke="#cbd5e1" 
                strokeWidth="3" 
              />

              {/* Arrows drawn clearly BELOW the waveform to prevent overlap with names */}
              <g className="arrow-group">
                {/* Downward Arrow */}
                <line x1="200" y1="240" x2="300" y2="260" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead-down)" />
                <text x="250" y="235" textAnchor="middle" className="arrow-label">下降</text>
                {/* Upward Arrow */}
                <line x1="600" y1="260" x2="700" y2="240" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead-up)" />
                <text x="650" y="235" textAnchor="middle" className="arrow-label">上昇</text>
              </g>

              {/* Points */}
              {points.map((p, i) => (
                <g key={i}>
                  <line x1={p.x} y1={p.y} x2={p.x} y2="280" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  
                  {/* Point Rendering Logic exactly as requested */}
                  {p.special === 'solid-black' ? (
                    <circle cx={p.x} cy={p.y} r={7} fill="#111" />
                  ) : p.special === 'double-black' ? (
                    <g>
                      <circle cx={p.x} cy={p.y} r={10} fill="none" stroke="#111" strokeWidth="2" />
                      <circle cx={p.x} cy={p.y} r={4} fill="#111" />
                    </g>
                  ) : p.special === 'double-white' ? (
                    <g>
                      <circle cx={p.x} cy={p.y} r={10} fill="#fff" stroke="#111" strokeWidth="2" />
                      <circle cx={p.x} cy={p.y} r={4} fill="none" stroke="#111" strokeWidth="2" />
                    </g>
                  ) : (
                    <circle cx={p.x} cy={p.y} r={7} fill="#fff" stroke="#cbd5e1" strokeWidth="2" />
                  )}
                  
                  <text x={p.x} y="300" textAnchor="middle" className="x-label">{p.label}</text>
                </g>
              ))}

              {/* Stacked Members */}
              {members.map((m, idx) => {
                const p = points[m.posIdx] || points[0];
                // Subtract 30px for each stack level so they stack UPWARDS
                const yOffset = (p?.y || 80) - 45 - (m.stackOrder * 30);
                const px = p?.x || 50;
                const py = p?.y || 80;
                
                const bgColor = m.luckColor || (idx % 2 === 0 ? '#3b82f6' : '#10b981');
                
                return (
                  <g key={idx} className="member-marker">
                    <rect 
                      x={px - 50} 
                      y={yOffset} 
                      width="100" 
                      height="26" 
                      rx="6" 
                      ry="6" 
                      fill={bgColor} 
                      stroke="rgba(0,0,0,0.1)"
                      strokeWidth="1"
                    />
                    <text 
                      x={px} 
                      y={yOffset + 17} 
                      textAnchor="middle" 
                      fontSize="11" 
                      fontWeight="bold" 
                      fill={getTextColor(bgColor)}
                    >
                      {m.name || m.label}
                    </text>
                    {/* Connecting line to the point only on the first member */}
                    {m.stackOrder === 0 && (
                      <line x1={px} y1={py} x2={px} y2={yOffset + 26} stroke="#94a3b8" strokeWidth="1" />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="instruction-box">
             <div className="theory-grid">
               <div className="theory-item">
                 <h4>3:6の原理</h4>
                 <p>9年サイクルのリズムは、下降と上昇の割合が3:6の関係になっています。</p>
                 <p>下降期（B,C,D）も人生に必要なリズムです。</p>
               </div>
               <div className="theory-item">
                 <h4>運気リズムの理解</h4>
                 <p>運気は人それぞれ固有のリズムで流れていきます。善し悪しのリズムではなく、生きるために必要なリズムです。上昇期も下降期もあなたの人生を支えるものとして活用してください。</p>
               </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="timeline-view" id="luck-personal-timeline">
           {/* メンバー切り替えセレクトボックス（通常画面のみ表示） */}
           {!isBatchPrinting && rawMembers.length > 1 && (
             <div className="member-selector-row print-hide" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
               <span style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>表示対象メンバー:</span>
               <select 
                 value={selectedMemberLabel} 
                 onChange={(e) => setSelectedMemberLabel(e.target.value)}
                 style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
               >
                 {rawMembers.map((m, idx) => (
                   <option key={idx} value={m.label}>
                     {m.name ? `${m.name} (${m.label})` : m.label}
                   </option>
                 ))}
               </select>
             </div>
           )}

           <div className="timeline-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
             <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>心相科学理論 バイオリズム年表（{activeMember?.name || "　　"} 用）</h3>
             <p style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 'bold' }}>
               ご自身のバイオリズム図です。プリントアウトして、各年齢で起きた出来事を記載していきましょう。
             </p>
           </div>
           
           <div className="waterfall-timeline-container" style={{ padding: '0', maxWidth: '100%', overflowX: 'auto' }}>
             <TimelineRow startIndex={0} endIndex={27} member={activeMember} getTextColor={getTextColor} />
             <TimelineRow startIndex={27} endIndex={54} member={activeMember} getTextColor={getTextColor} />
             <TimelineRow startIndex={54} endIndex={81} member={activeMember} getTextColor={getTextColor} />
             <TimelineRow startIndex={81} endIndex={108} member={activeMember} getTextColor={getTextColor} />
           </div>
        </div>
      )}

      {onMemoChange && (
        <AppraisalMemo 
          memo={memo} 
          onMemoChange={onMemoChange} 
          onRegenerate={() => onMemoChange(generateLuckMemo(data))} 
        />
      )}

      <div className="diagram-footer" style={{ textAlign: 'right', marginTop: '10px', fontSize: '11px', color: '#6b7280' }}>
        ©心相科学協会｜Division Miroku Inc.
      </div>
    </div>
  );
};

export default LuckRhythm;
