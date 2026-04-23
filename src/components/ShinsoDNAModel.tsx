import React from 'react';
import { SHINSO_MATRIX, LUCKY_COLORS } from '../data/shinsodata';
import './ShinsoDNAModel.css';

const ShinsoDNAModel: React.FC = () => {
  // 9 layers to form the ellipsoid (9 row entries in Matrix)
  const layersCount = 9;
  const dotsPerRow = 9;

  const layers = Array.from({ length: layersCount }, (_, i) => {
    const normalizedY = (i / (layersCount - 1)) * 2 - 1; // -1 at top, 1 at bottom
    // Radius of the ring at this height (elliptical curve)
    const radius = Math.sqrt(Math.max(0, 1 - normalizedY * normalizedY / 1.1)) * 85;
    const height = normalizedY * 120; // Vertical span

    // 9 dots per layer, shifted for a twist effect
    const rotationBase = i * 20; // Spiral twist
    
    return {
      id: i,
      y: height,
      r: radius,
      dots: Array.from({ length: dotsPerRow }, (_, j) => {
        const shinso = SHINSO_MATRIX[i][j];
        const firstDigit = parseInt(shinso[0], 10);
        const color = LUCKY_COLORS[firstDigit]?.hex || "#ffffff";
        
        return {
          id: j,
          angle: (j / dotsPerRow) * 360 + rotationBase,
          label: shinso,
          color: color
        };
      })
    };
  });

  return (
    <div className="dna-model-wrapper">
      <div className="dna-perspective">
        <div className="dna-container-3d">
          {/* Top Point 999 */}
          <div className="dna-point-cap top" style={{ transform: 'translateY(-135px)', backgroundColor: LUCKY_COLORS[9].hex }}>
            <span className="cap-label">999</span>
          </div>

          {/* Horizontal Rings (Total 81 dots across 9 rings) */}
          {layers.map(layer => (
            <div 
              key={layer.id} 
              className="dna-ring"
              style={{ 
                transform: `translateY(${layer.y}px) rotateX(85deg)`,
                width: `${layer.r * 2}px`,
                height: `${layer.r * 2}px`
              }}
            >
              {layer.dots.map(dot => (
                <div 
                  key={dot.id}
                  className="dna-dot-node"
                  style={{ 
                    transform: `rotate(${dot.angle}deg) translateX(${layer.r}px) rotateX(-85deg)`,
                    backgroundColor: dot.color,
                    boxShadow: `0 0 10px ${dot.color}`
                  }}
                >
                  <span className="dot-label">{dot.label}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Bottom Point 999 */}
          <div className="dna-point-cap bottom" style={{ transform: 'translateY(135px)', backgroundColor: LUCKY_COLORS[9].hex }}>
            <span className="cap-label">999</span>
          </div>
        </div>
      </div>
      <div className="dna-caption">81通り心相数の立体モデル</div>
    </div>
  );
};

export default ShinsoDNAModel;
