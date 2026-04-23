import React, { useEffect, useState } from 'react';

/**
 * 鑑定メモ（自由記入欄）コンポーネント
 * - UI時は自由に入力できるテキストエリア
 * - 印刷時は不要な枠線等が消えて単純なテキストになる
 */
interface AppraisalMemoProps {
  memo: string;
  onMemoChange: (val: string) => void;
  onRegenerate: () => void;
  printClassName?: string;
}

const AppraisalMemo: React.FC<AppraisalMemoProps> = ({ memo, onMemoChange, onRegenerate, printClassName = "" }) => {
  const [isEditing, setIsEditing] = useState(false);

  // 初期ロード時に空なら自動生成を実行する
  useEffect(() => {
    if (!memo) {
      onRegenerate();
    }
  }, []);

  const MAX_CHARS = 400;
  const charCount = memo.length;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <div className="appraisal-memo-container" style={{ marginTop: '30px', pageBreakInside: 'avoid' }}>
      {/* 画面上のUI */}
      <div className="print-hide" style={{ background: '#f9fafb', borderRadius: '8px', padding: '15px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ✏️ 鑑定メモ・自由記入欄
            <span style={{ fontSize: '0.8rem', color: isOverLimit ? '#ef4444' : '#6b7280', fontWeight: 'normal', marginLeft: '10px' }}>
              ({charCount} / 約{MAX_CHARS}文字目安)
            </span>
          </h4>
          <button 
            onClick={onRegenerate}
            title="現在のデータで解説文を作り直します（現在の入力は上書きされます）"
            style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#4b5563' }}
          >
            ↻ デフォルト解説を再生成
          </button>
        </div>
        {isOverLimit && (
          <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 'bold' }}>
            ※文字数が多すぎます。印刷時に2枚目にはみ出す可能性があります。
          </div>
        )}
        <textarea
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          rows={5}
          placeholder="ここに鑑定のポイントやコメントをご自由に記入してください。"
          style={{
            width: '100%',
            padding: '10px',
            border: isEditing ? '2px solid #3b82f6' : (isOverLimit ? '2px solid #ef4444' : '1px solid #d1d5db'),
            borderRadius: '4px',
            resize: 'vertical',
            fontFamily: 'inherit',
            fontSize: '0.95rem',
            lineHeight: '1.5',
            outline: 'none',
            boxSizing: 'border-box',
            color: isOverLimit ? '#b91c1c' : 'inherit'
          }}
        />
        <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '5px 0 0 0', textAlign: 'right' }}>
          ※このメモはPC画面上でのみ枠が表示され、印刷時は画面下にスッキリと印字されます。
        </p>
      </div>

      {/* 印刷用のテキスト表示 */}
      <div className={`print-only ${printClassName}`}>
        <h4 style={{ borderBottom: '1px solid #333', paddingBottom: '4px', marginBottom: '8px', fontSize: '12px' }}>鑑定メモ</h4>
        <div style={{ whiteSpace: 'pre-wrap', fontSize: '11px', lineHeight: '1.4', color: '#000' }}>
          {memo}
        </div>
      </div>

      {/* スタイル定義 */}
      <style>{`
        .print-only {
          display: none;
        }
        @media print {
          .print-only {
            display: block !important;
            margin-top: 2px !important;
          }
          .print-hide {
            display: none !important;
          }
          .appraisal-memo-container {
            margin-top: 2px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AppraisalMemo;
