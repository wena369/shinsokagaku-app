import { useState, type ChangeEvent, type ReactNode } from 'react';
import type { FamilyData } from '../lib/shinso';
import { ChevronDown, ChevronUp, User, Users, Heart } from 'lucide-react';
import './FamilyForm.css';

interface Props {
  data: FamilyData;
  onChange: (data: FamilyData) => void;
}

const FamilyForm: React.FC<Props> = ({ data, onChange }) => {
  const [activeSection, setActiveSection] = useState<string | null>('self');

  const updateMember = (path: string, field: string, value: string) => {
    const newData = { ...data };
    if (path.includes('.')) {
      const parts = path.split('.');
      const parentName = parts[0] as keyof FamilyData;
      const index = parseInt(parts[1], 10);
      const list = newData[parentName] as any[];
      list[index][field] = value;
    } else {
      (newData as any)[path][field] = value;
    }
    onChange(newData);
  };

  const renderInputGroup = (title: string, path: string, icon: ReactNode, id: string) => {
    const isOpen = activeSection === id;
    const member = (data as any)[path];

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
              {(id === 'self' || id === 'spouse') && (
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
                <input 
                  type="date" 
                  max="9999-12-31"
                  value={member.birthDate} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateMember(path, 'birthDate', e.target.value)}
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

  const renderListGroup = (title: string, path: string, count: number, icon: React.ReactNode, id: string) => {
    const isOpen = activeSection === id;
    const list = (data as any)[path];

    return (
      <div className={`form-section ${isOpen ? 'active' : ''}`}>
        <div className="section-header" onClick={() => setActiveSection(isOpen ? null : id)}>
          <div className="title-area">
            {icon}
            <span className="section-title">{title} <small>({count}名まで)</small></span>
          </div>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>

        {isOpen && (
          <div className="section-content">
            {list.map((member: any, i: number) => (
              <div key={i} className="list-item-form">
                <span className="item-label">{i + 1}人目</span>
                <div className="item-inputs">
                  <input 
                    type="text" 
                    className="name-input"
                    value={member.name} 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateMember(`${path}.${i}`, 'name', e.target.value)}
                    placeholder="お名前"
                  />
                  <div className="secondary-inputs">
                    <input 
                      type="date" 
                      className="date-input"
                      max="9999-12-31"
                      value={member.birthDate} 
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateMember(`${path}.${i}`, 'birthDate', e.target.value)}
                    />
                    <input 
                      type="text" 
                      className="shinso-input"
                      maxLength={3}
                      value={member.manualShinso || ''} 
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateMember(`${path}.${i}`, 'manualShinso', e.target.value)}
                      placeholder="心相数"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="family-form-container">
      <h2 className="form-header">診断用データの入力</h2>
      
      <div className="form-sections">
        {renderInputGroup("自分 (優先)", "self", <User size={24} />, "self")}
        {renderInputGroup("配偶者", "spouse", <Heart size={20} />, "spouse")}
        
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
