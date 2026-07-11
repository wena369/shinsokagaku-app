import { useState, type ChangeEvent, type ReactNode } from 'react';
import type { FamilyData } from '../lib/shinso';
import { ChevronDown, ChevronUp, User, Users, Heart } from 'lucide-react';
import './FamilyForm.css';

interface Props {
  data: FamilyData;
  onChange: (data: FamilyData) => void;
}

const DateInputWithPicker = ({ value, onChange, className }: { value: string, onChange: (v: string) => void, className?: string }) => {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
      <input
        type="text"
        placeholder="例: 1980-01-01"
        className={className}
        style={{ paddingRight: '2rem', width: '100%' }}
        value={value || ''}
        onChange={(e) => {
          const val = e.target.value;
          const digits = val.replace(/[^0-9]/g, '');
          if (digits.length === 8 && val.length === 8) {
            onChange(`${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`);
          } else {
            onChange(val);
          }
        }}
        onBlur={(e) => {
          const val = e.target.value;
          const digits = val.replace(/[^0-9]/g, '');
          if (digits.length === 8) {
            onChange(`${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`);
          }
        }}
      />
      <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', overflow: 'hidden' }}>
        <input 
          type="date" 
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', transform: 'scale(2)' }}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        <svg style={{ width: '20px', height: '20px', color: '#9ca3af', pointerEvents: 'none' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
  );
};

const FamilyForm: React.FC<Props> = ({ data, onChange }) => {
  const [activeSection, setActiveSection] = useState<string | null>('self');

  const updateMember = (path: string, field: string, value: string) => {
    const newData = { ...data };
    const parts = path.split('.');
    
    if (parts.length === 1) {
      const key = parts[0] as keyof FamilyData;
      newData[key] = { ...(newData[key] as any), [field]: value };
    } else if (parts.length === 2) {
      const key = parts[0] as keyof FamilyData;
      const idx = parseInt(parts[1], 10);
      const arr = [...(newData[key] as any[])];
      arr[idx] = { ...arr[idx], [field]: value };
      (newData as any)[key] = arr;
    } else if (parts.length === 3) {
      const key = parts[0] as keyof FamilyData;
      const idx = parseInt(parts[1], 10);
      const subKey = parts[2];
      const arr = [...(newData[key] as any[])];
      arr[idx] = {
        ...arr[idx],
        [subKey]: { ...(arr[idx][subKey] || {}), [field]: value }
      };
      (newData as any)[key] = arr;
    } else if (parts.length === 4) {
      const key = parts[0] as keyof FamilyData;
      const idx = parseInt(parts[1], 10);
      const subKey = parts[2];
      const subIdx = parseInt(parts[3], 10);
      const arr = [...(newData[key] as any[])];
      const subArr = [...(arr[idx][subKey] || [])];
      subArr[subIdx] = { ...subArr[subIdx], [field]: value };
      arr[idx] = {
        ...arr[idx],
        [subKey]: subArr
      };
      (newData as any)[key] = arr;
    }
    onChange(newData);
  };

  const renderInputGroup = (title: string, path: string, icon: ReactNode, id: string) => {
    const isOpen = activeSection === id;
    const member = path.includes('.') 
      ? (data as any)[path.split('.')[0]][parseInt(path.split('.')[1])]
      : (data as any)[path];

    return (
      <div className={`form-section ${id === 'self' ? 'priority' : ''} ${isOpen ? 'active' : ''}`}>
        <div className="section-header" onClick={() => setActiveSection(isOpen ? null : id)}>
          <div className="title-area">
            {icon}
            <span className="section-title">{title}</span>
          </div>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        
        {isOpen && (
          <div className="section-content">
            <div className="input-row">
              <label>お名前（または呼称）</label>
              <input 
                type="text" 
                value={member.name || ''} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateMember(path, 'name', e.target.value)}
                placeholder="例：山田 太郎 / お父さん"
              />
            </div>
            <div className="input-fields-grid">
              {(id === 'self' || id === 'spouse' || id.startsWith('interestedPeople') || id.startsWith('siblings-') || id.startsWith('spouseSiblings-')) && (
                <div className="input-row">
                  <label>性別 <small>(必須)</small></label>
                  <div className="gender-toggle-group">
                    <button 
                      type="button"
                      className={`gender-btn male ${member.gender === 'male' ? 'active' : ''}`}
                      onClick={() => updateMember(path, 'gender', 'male')}
                    >
                      男性
                    </button>
                    <button 
                      type="button"
                      className={`gender-btn female ${member.gender === 'female' ? 'active' : ''}`}
                      onClick={() => updateMember(path, 'gender', 'female')}
                    >
                      女性
                    </button>
                  </div>
                </div>
              )}
              <div className="input-row">
                <label>生年月日</label>
                <DateInputWithPicker 
                  value={member.birthDate || ''} 
                  onChange={(val) => updateMember(path, 'birthDate', val)}
                />
              </div>
              <div className="input-row">
                <label>心相数 <small>(手動)</small></label>
                <input 
                  type="text" 
                  maxLength={3}
                  value={member.manualShinso || ''} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateMember(path, 'manualShinso', e.target.value)}
                  placeholder="3桁"
                />
              </div>
            </div>

            {/* 兄弟姉妹・義兄弟姉妹の配偶者と子供のネスト入力 */}
            {(id.startsWith('siblings-') || id.startsWith('spouseSiblings-')) && (
              <div className="nested-family-section" style={{ marginTop: '1.5rem', borderTop: '1px dashed #cbd5e1', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Heart size={16} style={{ color: '#ec4899' }} /> 配偶者と子供の情報
                </h4>
                
                {/* 配偶者入力 */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '0.8rem' }}>配偶者</span>
                  <div className="input-row">
                    <label>お名前（または呼称）</label>
                    <input 
                      type="text" 
                      value={member.spouse?.name || ''} 
                      onChange={(e) => updateMember(`${path}.spouse`, 'name', e.target.value)}
                      placeholder="例：義兄 / 義姉"
                    />
                  </div>
                  <div className="input-fields-grid">
                    <div className="input-row">
                      <label>生年月日</label>
                      <DateInputWithPicker 
                        value={member.spouse?.birthDate || ''} 
                        onChange={(val) => updateMember(`${path}.spouse`, 'birthDate', val)}
                      />
                    </div>
                    <div className="input-row">
                      <label>心相数 <small>(手動)</small></label>
                      <input 
                        type="text" 
                        maxLength={3}
                        value={member.spouse?.manualShinso || ''} 
                        onChange={(e) => updateMember(`${path}.spouse`, 'manualShinso', e.target.value)}
                        placeholder="3桁"
                      />
                    </div>
                  </div>
                </div>

                {/* 子供入力 */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '0.8rem' }}>子供（4人まで）</span>
                  {Array.from({ length: 4 }).map((_, ci) => {
                    const child = member.children?.[ci] || { name: '', birthDate: '', manualShinso: '' };
                    return (
                      <div key={ci} style={{ marginBottom: ci < 3 ? '1rem' : 0, paddingBottom: ci < 3 ? '1rem' : 0, borderBottom: ci < 3 ? '1px dashed #e2e8f0' : 'none' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>子供 {ci + 1}</span>
                        <div className="input-row">
                          <label>お名前（または呼称）</label>
                          <input 
                            type="text" 
                            value={child.name || ''} 
                            onChange={(e) => updateMember(`${path}.children.${ci}`, 'name', e.target.value)}
                            placeholder={`例：子供 ${ci + 1}`}
                          />
                        </div>
                        <div className="input-fields-grid">
                          <div className="input-row">
                            <label>生年月日</label>
                            <DateInputWithPicker 
                              value={child.birthDate || ''} 
                              onChange={(val) => updateMember(`${path}.children.${ci}`, 'birthDate', val)}
                            />
                          </div>
                          <div className="input-row">
                            <label>心相数 <small>(手動)</small></label>
                            <input 
                              type="text" 
                              maxLength={3}
                              value={child.manualShinso || ''} 
                              onChange={(e) => updateMember(`${path}.children.${ci}`, 'manualShinso', e.target.value)}
                              placeholder="3桁"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderListGroup = (title: string, pathPrefix: keyof FamilyData, maxCount: number, icon: ReactNode, groupId: string) => {
    const list = data[pathPrefix] as any[];
    return (
      <div className="children-group">
        {Array.from({ length: maxCount }).map((_, i) => {
          const isFilled = list[i]?.name || list[i]?.birthDate;
          return renderInputGroup(
            `${title} ${i + 1}${isFilled ? ` (${list[i].name || '入力済'})` : ''}`, 
            `${pathPrefix}.${i}`, 
            icon, 
            `${groupId}-${i}`
          );
        })}
      </div>
    );
  };

  return (
    <div className="family-form-container">
      <h2 className="form-header">診断用データの入力</h2>
      
      <div className="form-sections">
        {renderInputGroup("自分 (優先)", "self", <User size={24} />, "self")}
        {renderInputGroup("配偶者", "spouse", <Heart size={20} />, "spouse")}
        
        <div className="list-col" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          <h3 className="sub-header">気になる人 (相性鑑定用)</h3>
          {renderListGroup("気になる人", "interestedPeople", 4, <Users size={20} />, "interestedPeople")}
        </div>
        
        <div className="children-group">
          <div className="list-col">
            <h3 className="sub-header">子供</h3>
            {renderListGroup("子供", "children", 6, <Users size={20} />, "children")}
          </div>
          <div className="list-col">
            <h3 className="sub-header">孫</h3>
            {renderListGroup("孫", "grandchildren", 6, <Users size={20} />, "grandchildren")}
          </div>
        </div>
        
        <div className="parents-grid">
          <div className="parents-col">
            <h3 className="sub-header">あなたの両親</h3>
            {renderInputGroup("父親", "father", <Users size={18} />, "father")}
            {renderInputGroup("母親", "mother", <Users size={18} />, "mother")}
          </div>
          <div className="parents-col">
            <h3 className="sub-header">配偶者の両親</h3>
            {renderInputGroup("義理の父親", "spouseFather", <Users size={18} />, "spouse_father")}
            {renderInputGroup("義理の母親", "spouseMother", <Users size={18} />, "spouse_mother")}
          </div>
        </div>

        <div className="parents-grid">
          <div className="parents-col">
            <h3 className="sub-header">あなたの兄弟姉妹</h3>
            {renderListGroup("兄弟姉妹", "siblings", 4, <Users size={18} />, "siblings")}
          </div>
          <div className="parents-col">
            <h3 className="sub-header">配偶者の兄弟姉妹</h3>
            {renderListGroup("義兄弟姉妹", "spouseSiblings", 4, <Users size={18} />, "spouseSiblings")}
          </div>
        </div>
        
        <div className="ancestors-group">
          <h3 className="sub-header">あなたの祖父母 (任意)</h3>
          <div className="ancestors-grid">
            {renderInputGroup("父方祖父", "paternalGrandfather", <Users size={16} />, "pgf")}
            {renderInputGroup("父方祖母", "paternalGrandmother", <Users size={16} />, "pgm")}
            {renderInputGroup("母方祖父", "maternalGrandfather", <Users size={16} />, "mgf")}
            {renderInputGroup("母方祖母", "maternalGrandmother", <Users size={16} />, "mgm")}
          </div>
        </div>

        <div className="ancestors-group">
          <h3 className="sub-header">配偶者の祖父母 (任意)</h3>
          <div className="ancestors-grid">
            {renderInputGroup("義理の父方祖父", "spousePaternalGrandfather", <Users size={16} />, "spgf")}
            {renderInputGroup("義理の父方祖母", "spousePaternalGrandmother", <Users size={16} />, "spgm")}
            {renderInputGroup("義理の母方祖父", "spouseMaternalGrandfather", <Users size={16} />, "smgf")}
            {renderInputGroup("義理の母方祖母", "spouseMaternalGrandmother", <Users size={16} />, "smgm")}
          </div>
        </div>

        {/* Move children/grandchildren above parents */}

      </div>
    </div>
  );
};

export default FamilyForm;
