import React, { useLayoutEffect, useState, useRef } from 'react';
import type { FamilyData } from '../lib/shinso';
import { getDetailedShinso, parseDate, combineShinso } from '../lib/shinso';
import './GenealogyTree.css';
import AppraisalMemo from './AppraisalMemo';
import { generateTreeMemo } from '../lib/memoGenerator';

interface Props {
  data: FamilyData;
  memo?: string;
  onMemoChange?: (val: string) => void;
  familyName?: string;
  onFamilyNameChange?: (val: string) => void;
  isBatchPrinting?: boolean;
}

const GenealogyTree: React.FC<Props> = ({ data, memo = "", onMemoChange, familyName = "", onFamilyNameChange, isBatchPrinting = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isPrinting = useRef(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isMale = data.self.gender !== 'female';

  const renderNode = (member: any, title: string, colorClass: string, id: string, side: 'left' | 'right' = 'left') => {
    if (!member || (!member.birthDate && !member.manualShinso)) return (
      <div className={`tree-node empty ${colorClass} side-${side}`} id={id}>
        <span className="node-title-label">{title}</span>
        <div className="node-body-layout">
          <div className="node-main-box" id={`${id}-box`}>
            <div className="empty-placeholder">未入力</div>
          </div>
          <div className="node-side-area">
          </div>
        </div>
      </div>
    );
    
    const { year, month, day } = parseDate(member.birthDate);
    const details = getDetailedShinso(year, month, day, member.manualShinso);
    
    const boxStyle = {
      borderColor: details.luckColorX,
      borderWidth: '2px', // slightly thicker to make color visible
      borderStyle: 'solid',
      backgroundColor: `${details.luckColorX}26` // 15% opacity
    };

    const shinsoStyle = {
      borderColor: details.luckColorZ,
      backgroundColor: details.luckColorY, // Full opacity as requested
      color: '#000' // explicitly black
    };

    return (
      <div className={`tree-node ${colorClass} side-${side}`} id={id}>
        <span className="node-title-label">{title}</span>
        <div className="node-body-layout">
          <div className="node-main-box" id={`${id}-box`} style={boxStyle}>
            <div className="shinso-rect" style={shinsoStyle}>{details.shinso}</div>
            <div className="node-sub-row">
              <span className="group-box">{details.positionGroup}</span>
              <span className="rhythm-circle">{details.luckRhythmNumber}</span>
              <span className="circ-val">{details.z}</span>
            </div>
            <div className="basic-num">({details.basicNumber})</div>
            <div className="conception-row">
              <span>[{details.conceptionSelf}(自)</span>
              <span>{details.conceptionOther}(他)]</span>
            </div>
          </div>
          <div className="node-side-area">
            <span className="node-side-name">{member.name || ""}</span>
            <div className="binary-sequence-list">
              {details.binarySequence.slice(0, 6).map((seq, i) => (
                <div key={i} className="binary-seq-item">{seq}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const updateSvgDom = React.useCallback(() => {
    if (!containerRef.current || !svgRef.current) return;
    const container = containerRef.current;
    let svgHtml = '';

    const getPos = (id: string) => {
      const el = container.querySelector(`#${id}`);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      
      // zoomがかかっている状態（プレビュー等）でも正しい比率を取得する
      // (通常はzoom=1の時に走るはずだが、念のためcRectの幅とoffsetWidthの比で補正)
      const scaleX = cRect.width ? (container.offsetWidth / cRect.width) : 1;
      const scaleY = cRect.height ? (container.offsetHeight / cRect.height) : 1;

      return {
        x: (rect.left - cRect.left) * scaleX + (rect.width * scaleX) / 2,
        y: (rect.top - cRect.top) * scaleY,
        bottom: (rect.top - cRect.top + rect.height) * scaleY,
        width: rect.width * scaleX,
        height: rect.height * scaleY
      };
    };

    const drawLine = (p1Id: string, p2Id: string, childrenIds: string[], color = "#333") => {
      const p1Box = getPos(`${p1Id}-box`);
      const p2Box = getPos(`${p2Id}-box`);
      const p1 = p1Box || getPos(p1Id);
      const p2 = p2Box || getPos(p2Id);
      
      if (!p1 || !p2) return;
      const midX = (p1.x + p2.x) / 2;
      
      const children = childrenIds.map(id => {
        const box = getPos(`${id}-box`);
        const outer = getPos(id);
        if (!box) return null;
        return {
          x: box.x,
          y: outer ? outer.y - 2 : box.y - 2
        };
      }).filter(pos => pos !== null) as {x: number, y: number}[];

      if (children.length > 0) {
        const pBottom = Math.max(p1.bottom, p2.bottom);
        const cTop = Math.min(...children.map(c => c.y));
        const vertSpace = Math.max(30, cTop - pBottom);
        const dropY = pBottom + vertSpace * 0.5;
        const childTopY = dropY; // 同じ高さで水平線を引く（段差なし）

        svgHtml += `<line x1="${p1.x}" y1="${p1.bottom}" x2="${p1.x}" y2="${dropY}" stroke="${color}" stroke-width="1.5" />`;
        svgHtml += `<line x1="${p2.x}" y1="${p2.bottom}" x2="${p2.x}" y2="${dropY}" stroke="${color}" stroke-width="1.5" />`;
        svgHtml += `<line x1="${p1.x}" y1="${dropY}" x2="${p2.x}" y2="${dropY}" stroke="${color}" stroke-width="1.5" />`;
        svgHtml += `<line x1="${midX}" y1="${dropY}" x2="${midX}" y2="${childTopY}" stroke="${color}" stroke-width="1.5" />`;
        
        const minChildX = Math.min(midX, ...children.map(c => c.x));
        const maxChildX = Math.max(midX, ...children.map(c => c.x));

        if (minChildX !== maxChildX) {
          svgHtml += `<line x1="${minChildX}" y1="${childTopY}" x2="${maxChildX}" y2="${childTopY}" stroke="${color}" stroke-width="1.5" />`;
        }
        
        children.forEach((c) => {
          svgHtml += `<line x1="${c.x}" y1="${childTopY}" x2="${c.x}" y2="${c.y}" stroke="${color}" stroke-width="1.5" />`;
        });
      }
    };

    drawLine('pgm', 'pgf', ['father']);
    drawLine('mgm', 'mgf', ['mother']);
    drawLine('spgm', 'spgf', ['spouse-father']);
    drawLine('smgm', 'smgf', ['spouse-mother']);
    drawLine('mother', 'father', ['self']);
    drawLine('spouse-mother', 'spouse-father', ['spouse']);

    const drawVerticalLine = (p1Id: string, p2Id: string, color = "#333") => {
      const p1 = getPos(`${p1Id}-box`);
      const p2 = getPos(`${p2Id}-box`);
      if (!p1 || !p2) return;
      svgHtml += `<line x1="${p1.x}" y1="${p1.bottom}" x2="${p2.x}" y2="${p2.y - 2}" stroke="${color}" stroke-width="1.5" />`;
    };

    const childrenIds = data.children.filter(c => c.birthDate || c.manualShinso).map((_, i) => `child-${i}`);
    if (isMale) {
      drawLine('spouse', 'self', childrenIds);
    } else {
      drawLine('self', 'spouse', childrenIds);
    }

    data.children.forEach((c, i) => {
      const g = data.grandchildren[i];
      if ((c.birthDate || c.manualShinso) && g && (g.birthDate || g.manualShinso)) {
        drawVerticalLine(`child-${i}`, `grandchild-${i}`);
      }
    });

    svgRef.current.innerHTML = svgHtml;
    // offsetWidth/offsetHeightでSVGサイズ設定（zoomの影響を受けない）
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    svgRef.current.setAttribute('width', `${w}`);
    svgRef.current.setAttribute('height', `${h}`);
    svgRef.current.removeAttribute('viewBox');
    svgRef.current.removeAttribute('preserveAspectRatio');
  }, [data, isMale]);

  useLayoutEffect(() => {
    if (!isPrinting.current) updateSvgDom();
  }, [updateSvgDom, refreshKey]);

  React.useEffect(() => {
    const handleBeforePrint = () => { 
      const wrapper = document.querySelector('.print-content-wrapper') as HTMLElement;
      const outer = document.getElementById('print-wrapper-outer');
      
      if (wrapper && outer) {
        const treeWidth = wrapper.scrollWidth;
        const treeHeight = wrapper.scrollHeight;
        const landscapeWidth = 980; // A4 landscape safer maximum width
        
        // ツリー幅が縦幅を超える場合は縮小（余白をゼロにし、用紙ギリギリまで拡大）
        let scale = 1;
        if (treeWidth > landscapeWidth) {
          scale = landscapeWidth / treeWidth;
        }

        // transform: scale() を適用して、HTMLとSVGキャンバスを丸ごと「画像のように」縮小する
        // A4 viewportに押し込まれてHTMLレイアウトが変形するのを防ぐため、計算時の幅・高さを固定する
        wrapper.style.width = `${treeWidth}px`;
        wrapper.style.height = `${treeHeight}px`;
        wrapper.style.transform = `scale(${scale})`;
        wrapper.style.transformOrigin = 'top left';

        // 縮小後の領域に合わせて外枠のサイズを絞り、複数ページへの無駄な改ページを防ぐ
        outer.style.width = `${treeWidth * scale}px`;
        outer.style.height = `${treeHeight * scale + 50}px`;
        outer.style.margin = '0 auto';
        outer.style.overflow = 'hidden';
      }

      // 印刷状態フラグのみ立てる（クラス等のため）
      isPrinting.current = true; 
    };
    
    const handleAfterPrint = () => { 
      const wrapper = document.querySelector('.print-content-wrapper') as HTMLElement;
      const outer = document.getElementById('print-wrapper-outer');
      if (wrapper) {
        wrapper.style.width = '';
        wrapper.style.height = '';
        wrapper.style.transform = '';
        wrapper.style.transformOrigin = '';
      }
      if (outer) {
        outer.style.width = '';
        outer.style.height = '';
        outer.style.margin = '';
        outer.style.overflow = '';
      }

      isPrinting.current = false; 
      setRefreshKey(prev => prev + 1); 
    };
    
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    const handleResize = () => { if (!isPrinting.current) setRefreshKey(prev => prev + 1); };
    window.addEventListener('resize', handleResize);
    
    const observer = new ResizeObserver(() => { if (!isPrinting.current) setRefreshKey(prev => prev + 1); });
    if (containerRef.current) observer.observe(containerRef.current);
    
    const timer = setTimeout(handleResize, 500);
    return () => { 
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      window.removeEventListener('resize', handleResize); 
      observer.disconnect(); 
      clearTimeout(timer); 
    };
  }, [updateSvgDom, data, isMale]);

  function getCombinedInfo(m1: any, m2: any) {
    if (!m1 || !m2 || (!m1.birthDate && !m1.manualShinso) || (!m2.birthDate && !m2.manualShinso)) return null;
    const s1 = m1.manualShinso || (m1.birthDate ? getDetailedShinso(parseDate(m1.birthDate).year, parseDate(m1.birthDate).month, parseDate(m1.birthDate).day).shinso : "");
    const s2 = m2.manualShinso || (m2.birthDate ? getDetailedShinso(parseDate(m2.birthDate).year, parseDate(m2.birthDate).month, parseDate(m2.birthDate).day).shinso : "");
    if (s1 && s2) {
      const combined = combineShinso(s1, s2);
      const details = getDetailedShinso(1970, 1, 1, combined);
      return details;
    }
    return null;
  }

  const combinedPaternalGP = getCombinedInfo(data.paternalGrandfather, data.paternalGrandmother);
  const combinedMaternalGP = getCombinedInfo(data.maternalGrandfather, data.maternalGrandmother);
  const combinedSpousePaternalGP = getCombinedInfo(data.spousePaternalGrandfather, data.spousePaternalGrandmother);
  const combinedSpouseMaternalGP = getCombinedInfo(data.spouseMaternalGrandfather, data.spouseMaternalGrandmother);
  const combinedParents = getCombinedInfo(data.father, data.mother);
  const combinedSpouseParents = getCombinedInfo(data.spouseFather, data.spouseMother);
  const combinedCouple = getCombinedInfo(data.self, data.spouse);

  const renderCombined = (details: any) => {
    if (!details) return <div className="combined-badge empty-badge"></div>;
    return (
      <div className="combined-badge">
        <span className="combined-shinso">{details.shinso}</span>
        <span className="combined-basic">({details.basicNumber})</span>
      </div>
    );
  };

  // Side placement based on gender
  const leftGP1 = isMale
    ? { gm: data.spouseMaternalGrandmother, gf: data.spouseMaternalGrandfather, combined: combinedSpouseMaternalGP, gmId: "smgm", gfId: "smgf", gmLabel: "祖母", gfLabel: "祖父", color: "gray" }
    : { gm: data.maternalGrandmother, gf: data.maternalGrandfather, combined: combinedMaternalGP, gmId: "mgm", gfId: "mgf", gmLabel: "祖母", gfLabel: "祖父", color: "red" };
  const leftGP2 = isMale
    ? { gm: data.spousePaternalGrandmother, gf: data.spousePaternalGrandfather, combined: combinedSpousePaternalGP, gmId: "spgm", gfId: "spgf", gmLabel: "祖母", gfLabel: "祖父", color: "gray" }
    : { gm: data.paternalGrandmother, gf: data.paternalGrandfather, combined: combinedPaternalGP, gmId: "pgm", gfId: "pgf", gmLabel: "祖母", gfLabel: "祖父", color: "blue" };
  const rightGP1 = isMale
    ? { gm: data.maternalGrandmother, gf: data.maternalGrandfather, combined: combinedMaternalGP, gmId: "mgm", gfId: "mgf", gmLabel: "祖母", gfLabel: "祖父", color: "red" }
    : { gm: data.spouseMaternalGrandmother, gf: data.spouseMaternalGrandfather, combined: combinedSpouseMaternalGP, gmId: "smgm", gfId: "smgf", gmLabel: "祖母", gfLabel: "祖父", color: "gray" };
  const rightGP2 = isMale
    ? { gm: data.paternalGrandmother, gf: data.paternalGrandfather, combined: combinedPaternalGP, gmId: "pgm", gfId: "pgf", gmLabel: "祖母", gfLabel: "祖父", color: "blue" }
    : { gm: data.spousePaternalGrandmother, gf: data.spousePaternalGrandfather, combined: combinedSpousePaternalGP, gmId: "spgm", gfId: "spgf", gmLabel: "祖母", gfLabel: "祖父", color: "gray" };

  const leftMother = isMale ? data.spouseMother : data.mother;
  const leftFather = isMale ? data.spouseFather : data.father;
  const leftMotherId = isMale ? "spouse-mother" : "mother";
  const leftFatherId = isMale ? "spouse-father" : "father";
  const leftMotherLabel = isMale ? "義母" : "母";
  const leftFatherLabel = isMale ? "義父" : "父";
  const leftCombined = isMale ? combinedSpouseParents : combinedParents;

  const rightMother = isMale ? data.mother : data.spouseMother;
  const rightFather = isMale ? data.father : data.spouseFather;
  const rightMotherId = isMale ? "mother" : "spouse-mother";
  const rightFatherId = isMale ? "father" : "spouse-father";
  const rightMotherLabel = isMale ? "母" : "義母";
  const rightFatherLabel = isMale ? "父" : "義父";
  const rightCombined = isMale ? combinedParents : combinedSpouseParents;

  const leftPerson = isMale ? data.spouse : data.self;
  const rightPerson = isMale ? data.self : data.spouse;
  const leftPersonId = isMale ? "spouse" : "self";
  const rightPersonId = isMale ? "self" : "spouse";
  const leftPersonLabel = isMale ? "配偶者" : "自分";
  const rightPersonLabel = isMale ? "自分" : "配偶者";
  const leftPersonClass = isMale ? "" : "hero";
  const rightPersonClass = isMale ? "hero" : "";

  // Calculate dynamic scale for printing based on generation depth
  const hasGrandchildren = data.grandchildren && data.grandchildren.some(c => c.birthDate || c.manualShinso);
  const hasGrandparents = [
    data.maternalGrandfather, data.maternalGrandmother, data.paternalGrandfather, data.paternalGrandmother,
    data.spouseMaternalGrandfather, data.spouseMaternalGrandmother, data.spousePaternalGrandfather, data.spousePaternalGrandmother
  ].some(x => x && (x.birthDate || x.manualShinso));

  const printClass = (hasGrandparents && hasGrandchildren) ? 'print-scale-max'
                   : (hasGrandparents || hasGrandchildren) ? 'print-scale-mid'
                   : 'print-scale-normal';

  return (
    <div className="genealogy-tree-container">
      {!isBatchPrinting && (
        <style id="print-page-style">{`
          @media print {
            @page { size: A4 landscape; margin: 0; }
            body, html { margin: 0; padding: 0; overflow: hidden; }
            .genealogy-tree-container {
              padding: 24px 0 0 0 !important;
              height: 100vh !important;
              overflow: hidden !important;
            }
          }
        `}</style>
      )}
      
      {/* 印刷・PDF出力ボタン */}
      <div className="gt-actions print-hide" style={{ textAlign: 'right', marginBottom: '1rem', paddingRight: '2rem' }}>
        <button 
          onClick={() => {
            window.print();
          }}
          style={{ padding: '0.6rem 1.2rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        >
          印刷・PDF出力
        </button>
      </div>

      <div id="print-wrapper-outer">
        <div className={`print-content-wrapper ${printClass}`}>
          
          <div style={{ textAlign: 'center', marginBottom: '0.3rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span className="gt-title" style={{ marginRight: '1rem' }}>心相科学理論</span>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <input 
                type="text" 
                value={familyName}
                onChange={(e) => onFamilyNameChange?.(e.target.value)}
                placeholder="◯◯"
                className="family-name-input print-hide"
                style={{ fontSize: '39px', fontWeight: 800, width: '120px', textAlign: 'center', border: 'none', borderBottom: '2px dashed #999', background: 'transparent', outline: 'none', color: '#1a202c', letterSpacing: '0.1em' }}
              />
              {/* 印刷時のみ表示されるテキスト */}
              <span className="gt-title" style={{ display: 'none', margin: 0, padding: 0 }} id="print-family-name">
                {familyName || "　　"}
              </span>
              <span className="gt-title" style={{ marginLeft: '0.2rem' }}>家の家系図</span>
          </div>
        </div>
        
        <p className="gt-legend" style={{ textAlign: 'center', fontSize: '13px', color: '#666', marginTop: '1rem' }}>※大きな四角内に心相数、□グループ数、○運気数、運気数右横は循環数、（ ）基本数、 [ ] 受胎数、両親の心相数合算（とその基本数）</p>
      <div className="gt-tree" ref={containerRef} style={{ position: 'relative', width: 'max-content', margin: '0 auto' }}>
        <svg className="tree-lines-svg" style={{ zIndex: 0 }} ref={svgRef}></svg>
        <div className="gt-tree-top" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
          
          {/* ====== LEFT FAMILY SIDE ====== */}
          <div className="family-side" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* Grandparents */}
            <div className="gp-row" style={{ display: 'flex' }}>
              <div className="gt-pair">
                {renderNode(leftGP1.gm, leftGP1.gmLabel, leftGP1.color, leftGP1.gmId, 'left')}
                {renderCombined(leftGP1.combined)}
                {renderNode(leftGP1.gf, leftGP1.gfLabel, leftGP1.color, leftGP1.gfId, 'right')}
              </div>
              <div className="gt-pair">
                {renderNode(leftGP2.gm, leftGP2.gmLabel, leftGP2.color, leftGP2.gmId, 'left')}
                {renderCombined(leftGP2.combined)}
                {renderNode(leftGP2.gf, leftGP2.gfLabel, leftGP2.color, leftGP2.gfId, 'right')}
              </div>
            </div>
            
            {/* Parents */}
            <div className="gt-pair parent-pair">
              {renderNode(leftMother, leftMotherLabel, "", leftMotherId, 'left')}
              {renderCombined(leftCombined)}
              {renderNode(leftFather, leftFatherLabel, "", leftFatherId, 'right')}
            </div>
            
            {/* Self/Spouse */}
            <div>
              {renderNode(leftPerson, leftPersonLabel, leftPersonClass, leftPersonId, 'left')}
            </div>

          </div>

          {/* ====== CENTER SYNTHESIS ====== */}
          <div className="main-synthesis" style={{ paddingBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
            {renderCombined(combinedCouple)}
          </div>

          {/* ====== RIGHT FAMILY SIDE ====== */}
          <div className="family-side" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* Grandparents */}
            <div className="gp-row" style={{ display: 'flex' }}>
              <div className="gt-pair">
                {renderNode(rightGP1.gm, rightGP1.gmLabel, rightGP1.color, rightGP1.gmId, 'left')}
                {renderCombined(rightGP1.combined)}
                {renderNode(rightGP1.gf, rightGP1.gfLabel, rightGP1.color, rightGP1.gfId, 'right')}
              </div>
              <div className="gt-pair">
                {renderNode(rightGP2.gm, rightGP2.gmLabel, rightGP2.color, rightGP2.gmId, 'left')}
                {renderCombined(rightGP2.combined)}
                {renderNode(rightGP2.gf, rightGP2.gfLabel, rightGP2.color, rightGP2.gfId, 'right')}
              </div>
            </div>
            
            {/* Parents */}
            <div className="gt-pair parent-pair">
              {renderNode(rightMother, rightMotherLabel, "", rightMotherId, 'left')}
              {renderCombined(rightCombined)}
              {renderNode(rightFather, rightFatherLabel, "", rightFatherId, 'right')}
            </div>
            
            {/* Self/Spouse */}
            <div>
              {renderNode(rightPerson, rightPersonLabel, rightPersonClass, rightPersonId, 'right')}
            </div>

          </div>

        </div>

        {/* Row 4: Children & Grandchildren grouped */}
        {(data.children.some(c => c.birthDate || c.manualShinso) || data.grandchildren.some(g => g.birthDate || g.manualShinso)) && (
          <div className="gt-row children-row" style={{ alignItems: 'flex-start' }}>
            {data.children
              .map((c, i) => ({ c, i }))
              .filter(({ c }) => c.birthDate || c.manualShinso)
              .reverse()
              .map(({ c, i }) => {
                const g = data.grandchildren[i];
                const hasGrandchild = g && (g.birthDate || g.manualShinso);
                const side = (i % 2 === 0) ? 'right' : 'left';
                return (
                  <div key={`family-${i}`} className="child-family-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '36px' }}>
                    {renderNode(c, `子${i + 1}`, "", `child-${i}`, side)}
                    {hasGrandchild && renderNode(g, `孫${i + 1}`, "", `grandchild-${i}`, side)}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      </div>{/* End of print-content-wrapper */}
      
      {onMemoChange && (
        <div className="gt-memo-container print-absolute-wrapper">
          <AppraisalMemo 
            memo={memo} 
            onMemoChange={onMemoChange} 
            onRegenerate={() => onMemoChange(generateTreeMemo(data))} 
            printClassName="genealogy-print-memo"
          />
        </div>
      )}

      <div className="print-copyright" style={{ textAlign: 'right', marginTop: '10px', fontSize: '11px', color: '#6b7280' }}>
        ©心相科学協会｜Division Miroku Inc.
      </div>
      </div>{/* End of print-wrapper-outer */}
    </div>
  );
};

export default GenealogyTree;
