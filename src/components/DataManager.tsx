import React, { useState, useEffect, useRef } from 'react';
import { Save, FolderOpen, PlusCircle, FileDown, FileUp, Trash2 } from 'lucide-react';
import { type FamilyData } from '../lib/shinso';

interface Props {
  data: FamilyData;
  familyName: string;
  onLoad: (familyName: string, familyData: FamilyData) => void;
  onFamilyNameChange: (name: string) => void;
  initialFamilyData: FamilyData;
}

interface SavedFamily {
  familyName: string;
  familyData: FamilyData;
  updatedAt: string;
}

const STORAGE_KEY = 'shinsokagaku_saved_families';

export default function DataManager({ data, familyName, onLoad, onFamilyNameChange, initialFamilyData }: Props) {
  const [savedList, setSavedList] = useState<SavedFamily[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 初回ロード時に保存リストを取得
  useEffect(() => {
    loadSavedList();
  }, []);

  // ドロップダウン外クリックで閉じる処理
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSavedList = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, SavedFamily>;
        const list = Object.values(parsed).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setSavedList(list);
      } else {
        setSavedList([]);
      }
    } catch (e) {
      console.error('Failed to load saved families list', e);
    }
  };

  // 新規作成（クリア）
  const handleNew = () => {
    if (window.confirm('現在の入力内容をクリアして、新しく作成しますか？')) {
      onLoad('', initialFamilyData);
      alert('入力欄を初期化しました。');
    }
  };

  // ローカル保存
  const handleSave = () => {
    const defaultName = familyName.trim() || '無題';
    const targetName = window.prompt('保存する家の名前（例：山田、佐藤）を入力してください：', defaultName);
    
    if (targetName === null) return; // キャンセル
    
    const finalName = targetName.trim() || '無題';
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as Record<string, SavedFamily>) : {};
      
      parsed[finalName] = {
        familyName: finalName,
        familyData: data,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      onFamilyNameChange(finalName);
      loadSavedList();
      alert(`「${finalName}家」のデータをローカルに保存しました。`);
    } catch (e) {
      console.error('Failed to save', e);
      alert('保存に失敗しました。ブラウザのLocalStorage容量がいっぱいの可能性があります。');
    }
  };

  // データをロード
  const handleLoad = (family: SavedFamily) => {
    onLoad(family.familyName, family.familyData);
    setIsDropdownOpen(false);
    alert(`「${family.familyName}家」のデータをロードしました。`);
  };

  // 保存データを削除
  const handleDelete = (e: React.MouseEvent, targetName: string) => {
    e.stopPropagation(); // アコーディオンやロード処理の発火を防ぐ
    
    if (window.confirm(`「${targetName}家」の保存データを削除しますか？`)) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Record<string, SavedFamily>;
          delete parsed[targetName];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          loadSavedList();
        }
      } catch (e) {
        console.error('Failed to delete', e);
      }
    }
  };

  // JSONファイルとしてエクスポート
  const handleExport = () => {
    const finalName = familyName.trim() || '無題';
    const exportData = {
      version: '1.0',
      type: 'shinsokagaku',
      familyName: finalName,
      familyData: data,
      exportedAt: new Date().toISOString()
    };
    
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `shinsokagaku_${finalName}家_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // JSONファイルからインポート
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        let loadedName = '';
        let loadedData: FamilyData | null = null;

        // 独自エクスポート形式の場合
        if (parsed.type === 'shinsokagaku' && parsed.familyData) {
          loadedName = parsed.familyName || '';
          loadedData = parsed.familyData;
        } 
        // 旧LP申し込みデータ形式の場合
        else if (parsed.type === 'shinsokagaku' && parsed.formType === 'appraisal' && parsed.familyData) {
          const nameParts = parsed.applicantName ? parsed.applicantName.split(/[\s　]+/) : [''];
          loadedName = nameParts[0] ? nameParts[0] : '';
          loadedData = parsed.familyData;
        }
        // 直接 familyData オブジェクト単体ファイルの場合
        else if (parsed.self && parsed.siblings) {
          loadedName = window.prompt('インポートデータの「家名」を入力してください：', 'インポート') || 'インポート';
          loadedData = parsed as FamilyData;
        }

        if (loadedData) {
          onLoad(loadedName, loadedData);
          alert(`「${loadedName || '無題'}家」のファイルデータをインポートしました。`);
          
          // 自動的ローカル保存するか尋ねる
          if (loadedName && window.confirm('インポートしたデータをブラウザの保存リストにも追加しますか？')) {
            const stored = localStorage.getItem(STORAGE_KEY);
            const localParsed = stored ? (JSON.parse(stored) as Record<string, SavedFamily>) : {};
            localParsed[loadedName] = {
              familyName: loadedName,
              familyData: loadedData,
              updatedAt: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(localParsed));
            loadSavedList();
          }
        } else {
          alert('正しい家系図データ形式のファイルではありませんでした。');
        }
      } catch (err) {
        console.error('Import parse error', err);
        alert('ファイルの読み込みに失敗しました。JSONファイルが壊れている可能性があります。');
      }
    };
    reader.readAsText(file);
    // 同じファイルを再度アップロードしても発火するようにリセット
    e.target.value = '';
  };

  return (
    <div className="data-management-bar print-hide">
      <div className="management-group">
        <button type="button" className="mgt-btn new-btn" onClick={handleNew} title="新規作成してクリア">
          <PlusCircle size={16} />
          <span>新規作成</span>
        </button>

        <button type="button" className="mgt-btn save-btn" onClick={handleSave} title="現在のデータをローカルに保存">
          <Save size={16} />
          <span>保存</span>
        </button>
        
        <div className="mgt-dropdown-wrapper" ref={dropdownRef}>
          <button 
            type="button" 
            className={`mgt-btn load-btn ${isDropdownOpen ? 'active' : ''}`} 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            title="保存したデータからロード"
          >
            <FolderOpen size={16} />
            <span>開く ({savedList.length})</span>
          </button>
          
          {isDropdownOpen && (
            <div className="mgt-dropdown-menu">
              {savedList.length === 0 ? (
                <div className="dropdown-empty">保存されたデータがありません</div>
              ) : (
                <div className="dropdown-list">
                  {savedList.map((family) => {
                    const date = new Date(family.updatedAt);
                    const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                    return (
                      <div 
                        key={family.familyName} 
                        className="dropdown-item" 
                        onClick={() => handleLoad(family)}
                      >
                        <div className="item-info">
                          <span className="item-name">{family.familyName}家</span>
                          <span className="item-date">保存日: {dateStr}</span>
                        </div>
                        <button 
                          type="button" 
                          className="delete-item-btn" 
                          onClick={(e) => handleDelete(e, family.familyName)}
                          title="このデータを削除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="divider" />

      <div className="management-group">
        <button type="button" className="mgt-btn file-btn" onClick={handleExport} title="ファイルとしてPCに保存">
          <FileDown size={16} />
          <span>ファイルに保存</span>
        </button>

        <button 
          type="button" 
          className="mgt-btn file-btn" 
          onClick={() => fileInputRef.current?.click()} 
          title="PCのファイルから読み込み"
        >
          <FileUp size={16} />
          <span>ファイルから読込</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".json" 
          onChange={handleImport} 
        />
      </div>
    </div>
  );
}
