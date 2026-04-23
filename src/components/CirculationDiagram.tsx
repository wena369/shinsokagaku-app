import React from 'react';
import { getDetailedShinso, parseDate, type FamilyData } from '../lib/shinso';
import './CirculationDiagram.css';
import AppraisalMemo from './AppraisalMemo';
import { generateCirculationMemo } from '../lib/memoGenerator';

interface CirculationDiagramProps {
  data: FamilyData;
  memo?: string;
  onMemoChange?: (val: string) => void;
  isBatchPrinting?: boolean;
}

const CirculationDiagram: React.FC<CirculationDiagramProps> = ({ data, memo = "", onMemoChange, isBatchPrinting = false }) => {
  // Collect all people with valid shinso numbers
  const getAllMembers = () => {
    const members: any[] = [];
    
    const addMember = (member: any, label: string) => {
      if (!member || (!member.birthDate && !member.manualShinso)) return;
      const { year, month, day } = parseDate(member.birthDate);
      const details = getDetailedShinso(year, month, day, member.manualShinso);
      members.push({ ...member, label, z: details.z });
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
    
    data.siblings.forEach((s: any, i: number) => addMember(s, `兄弟姉妹 ${i+1}`));
    data.children.forEach((c: any, i: number) => addMember(c, `子供 ${i+1}`));
    data.interestedPeople.forEach((p: any, i: number) => addMember(p, `気になる人 ${i+1}`));

    return members;
  };

  const members = getAllMembers();

  // Positions mapping inside 900x900 canvas
  // Adjusted West and East to provide ample space (170px) for member lists
  // Formats into a balanced, slightly tall circle perfect for A4 Portrait.
  const zones = [
    { name: "North", z: [8, 1], top: "150px", left: "450px", labels: ["8", "1"] },
    { name: "South", z: [5, 4], top: "750px", left: "450px", labels: ["5", "4"] },
    { name: "West",  z: [6, 3], top: "450px", left: "220px", labels: ["6", "3"] },
    { name: "East",  z: [7, 2], top: "450px", left: "680px", labels: ["7", "2"] },
    { name: "Center",z: [9],    top: "450px", left: "450px", labels: ["9"] },
  ];

  const getMembersInZone = (zValues: number[]) => {
    return members.filter(m => zValues.includes(m.z));
  };

  return (
    <div className="circulation-diagram-container glass">
      {!isBatchPrinting && (
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
          }
        `}</style>
      )}
      <div className="diagram-header" style={{ position: 'relative' }}>
        <h2 className="diagram-title">循環図 (川上川下図)</h2>
        <p className="diagram-subtitle">循環数による相性・役割マップ</p>
        <div className="print-hide" style={{ position: 'absolute', top: 0, right: 0 }}>
          <button 
            onClick={() => window.print()} 
            style={{ padding: '0.6rem 1.2rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            A4縦で印刷・PDF出力
          </button>
        </div>
      </div>

      <div className="circulation-canvas-wrapper">
        <div className="circulation-canvas">
          {/* Arrows SVG matching 900x900 coordinates */}
          <svg className="circulation-arrows-svg" viewBox="0 0 900 900" preserveAspectRatio="xMidYMid meet">
             <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
             </defs>
             {/* North (450,150) -> West (220,450) */}
             <path d="M 400 150 Q 220 150 220 400" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
             {/* West (220,450) -> South (450,750) */}
             <path d="M 220 500 Q 220 750 400 750" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
             {/* South (450,750) -> East (680,450) */}
             <path d="M 500 750 Q 680 750 680 500" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
             {/* East (680,450) -> North (450,150) */}
             <path d="M 680 400 Q 680 150 500 150" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />

             {/* Center Connections (Lines) */}
             {/* West to Center */}
             <line x1="270" y1="450" x2="400" y2="450" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="5 5" />
             {/* Center to East */}
             <line x1="500" y1="450" x2="630" y2="450" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="5 5" />
             {/* North to Center */}
             <line x1="450" y1="200" x2="450" y2="400" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="5 5" />
             {/* Center to South */}
             <line x1="450" y1="500" x2="450" y2="700" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="5 5" />
          </svg>

          {zones.map((zone, idx) => {
            const zoneMembers = getMembersInZone(zone.z);
            return (
              <div 
                key={idx} 
                className={`circulation-zone pos-${zone.name.toLowerCase()}`}
                style={{ top: zone.top, left: zone.left }}
              >
                <div className="zone-circle">
                  {zone.labels.length > 1 ? (
                    <div className="split-labels">
                      <div className="label-top">{zone.labels[0]}</div>
                      <div className="divider-h"></div>
                      <div className="label-bottom">{zone.labels[1]}</div>
                    </div>
                  ) : (
                    <div className="center-label">{zone.labels[0]}</div>
                  )}
                </div>
                
                <div className="zone-member-list">
                  {zoneMembers.map((m, mi) => (
                    <div key={mi} className="member-item-tag pulse-soft">
                      <span className="m-name">{m.name}</span>
                      <span className="m-label">({m.label})</span>
                    </div>
                  ))}
                  {zoneMembers.length === 0 && <span className="no-members">-</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="circulation-legend">
        <div className="legend-card">
          <h4>川上の法則</h4>
          <p>川上（矢印の始点）にある人が川下（矢印の終点）の人を支える関係です。</p>
          <ul>
            <li>川下は川上から頼まれると断りにくい</li>
            <li>川上が心の支えとなる</li>
            <li>川上は川下に対して楽な気持ちで接することができる</li>
          </ul>
        </div>
        <div className="legend-card">
          <h4>その他の関係</h4>
          <ul>
            <li><strong>向こう岸:</strong> 水と油のような異質な関係。ぎこちなさを感じやすい。</li>
            <li><strong>同じ円内:</strong> 同じ仲間。理解し合える楽な関係。</li>
            <li><strong>中心の人 (9):</strong> 全体のバランスを調整する役割。象徴的存在。</li>
          </ul>
        </div>
      </div>

      {onMemoChange && (
        <AppraisalMemo 
          memo={memo} 
          onMemoChange={onMemoChange} 
          onRegenerate={() => onMemoChange(generateCirculationMemo(data))} 
        />
      )}

      <div className="diagram-footer" style={{ textAlign: 'right', marginTop: '10px', fontSize: '11px', color: '#6b7280' }}>
        ©心相科学協会｜Division Miroku Inc.
      </div>
    </div>
  );
};

export default CirculationDiagram;
