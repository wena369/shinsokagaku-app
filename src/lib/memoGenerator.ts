import { type FamilyData, getDetailedShinso, parseDate } from './shinso';
import { BASIC_TRAITS } from '../data/shinsodata';

// 個人カルテ用
export function generateKarteMemo(member: any): string {
  if (!member || (!member.birthDate && !member.manualShinso)) return "";
  const { year, month, day } = parseDate(member.birthDate);
  const details = getDetailedShinso(year, month, day, member.manualShinso);
  const trait = BASIC_TRAITS[Number(details.basicNumber) as keyof typeof BASIC_TRAITS]?.trait || "";
  
  return `${member.name || 'この方'}の鑑定メモ：
心相数「${details.shinso}」は、${trait}といった気質を持ちます。
基本数（枝）は「${details.basicNumber}」であり、人生におけるテーマがここに現れています。
また、運命の出会いを引き寄せる受胎数は 自「${details.conceptionSelf}」/ 他「${details.conceptionOther}」です。
八犬伝グループに該当する方とは深いご縁がありますので、周囲の人間関係と照らし合わせてみてください。
`;
}

// 家系図用
export function generateTreeMemo(data: FamilyData): string {
  let hasData = false;
  const numbers = new Set<string>();
  const basicNumbers = new Set<number>();
  
  const collect = (member: any) => {
    if (!member || (!member.birthDate && !member.manualShinso)) return;
    hasData = true;
    const { year, month, day } = parseDate(member.birthDate);
    const details = getDetailedShinso(year, month, day, member.manualShinso);
    numbers.add(details.shinso);
    basicNumbers.add(Number(details.basicNumber));
  };
  
  collect(data.self);
  collect(data.father);
  collect(data.mother);
  
  if (!hasData) return "家系内のつながりについて、特徴や気付いた点をここに記入してください。";

  return `【家系図 鑑定メモ】
家系内には同じ基本数を持つ方がいるか、
あるいは足して999になる組み合わせがあるか注目してください。
心相科学では、家族間でどのような役割を補い合っているかがこの図に現れます。自分を支えてくれる人、自分がサポートするべき人を意識することで、より良い家庭環境の構築に繋がります。
`;
}

// 運気リズム用
export function generateLuckMemo(data: FamilyData): string {
  if (!data.self.birthDate && !data.self.manualShinso) return "運気リズムについての解説を記入してください。";
  
  const currentYear = new Date().getFullYear();
  return `【運気リズム 鑑定メモ（${currentYear}年）】
あなたにとって今年はどのような波でしょうか。
心相科学の9年周期において、運気が上昇する時期、内省する時期など、リズムに沿った行動をとることで、自然と結果が伴いやすくなります。来年・再来年に向けた準備期間としてもご活用ください。
`;
}

// 循環数（川上川下）用
export function generateCirculationMemo(data: FamilyData): string {
  if (!data.self.birthDate && !data.self.manualShinso) return "川上・川下図についての解説を記入してください。";

  return `【循環数・川上川下図 鑑定メモ】
自分がどのエリア（North, Southなど）に属しているか、また矢印の向きに注目してください。
矢印の始点（川上）は心の支えとなる存在であり、終点（川下）はあなたが支えるべき存在です。同じ円の中にいる方は思考パターンが似ている「同じ仲間」となります。
向かい合うエリアの方とは異質だからこそ学びがある関係です。
`;
}

// 相性鑑定用
export function generateCompatibilityMemo(_data: FamilyData): string {
  return `【相性鑑定 鑑定メモ】
表面数、基本数、受胎数などの一致が多いほど、ご縁の深い関係です。
特に「足して999になる関係」や「受胎数が一致する関係」は数千年の時を超えて出会った究極のペアとされています。結果の星マーク（☆や🌟）が多い項目をピックアップしてお伝えすると良いでしょう。
`;
}
