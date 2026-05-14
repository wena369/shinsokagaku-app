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
        inputMode="numeric"
        placeholder="例: 1980-01-01"
        className={className}
        style={{ paddingRight: '2rem', width: '100%' }}
        value={value}
        onChange={(e) => {
          let val = e.target.value.replace(/[^0-9]/g, '');
          if (val.length > 8) val = val.slice(0, 8);
          
          let formatted = val;
          if (val.length >= 5) {
            formatted = val.slice(0, 4) + '-' + val.slice(4);
          }
          if (val.length >= 7) {
            formatted = val.slice(0, 4) + '-' + val.slice(4, 6) + '-' + val.slice(6);
          }
          onChange(formatted);
        }}
      />
      <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', overflow: 'hidden' }}>
        <input 
          type="date" 
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', transform: 'scale(2)' }}
          value={value}
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
    if (path.includes('.')) {
      const parts = path.split('.');
      const parentName = parts[0] as keyof FamilyData;
      const index = parseInt(parts[1], 10);
      const list = [...(newData[parentName] as any[])];
      list[index] = { ...list[index], [field]: value };
      (newData as any)[parentName] = list;
    } else {
      (newData as any)[path] = { ...(newData as any)[path], [field]: value };
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
                value={member.name} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateMember(path, 'name', e.target.value)}
                placeholder="例：山田 太郎 / お父さん"
              />
            </div>
            <div className="input-fields-grid">
              {(id === 'self' || id === 'spouse' || id.startsWith('interestedPeople')) && (
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
                  value={member.birthDate} 
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
            {renderListGroup("兄弟姉妹", "siblings", 2, <Users size={18} />, "siblings")}
          </div>
          <div className="parents-col">
            <h3 className="sub-header">配偶者の兄弟姉妹</h3>
            {renderListGroup("義兄弟姉妹", "spouseSiblings", 2, <Users size={18} />, "spouseSiblings")}
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
