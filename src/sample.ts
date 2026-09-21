import type { Atlas } from './model'
export function createSample(): Atlas {
  return {
    version: 1, title: '云川旧事',
    characters: [
      { id: 'huaying', name: '花盈', group: '花家', color: '#4f8072', notes: '花家长女，温柔而坚韧。\n\n曾在云川渡口救下梓夜，自此卷入一段被尘封的江湖往事。她想守护的，从来不是家族的名望，而是身边每一个人。', tags: ['主角', '医者'] },
      { id: 'hualing', name: '花绫', group: '花家', color: '#4f8072', notes: '花盈的妹妹，聪慧灵动，擅长机关术。', tags: ['机关师'] },
      { id: 'hualianyue', name: '花怜月', group: '花家', color: '#4f8072', notes: '花家家主，藏着关于云川的秘密。', tags: ['家主'] },
      { id: 'ziye', name: '梓夜', group: '云岫门', color: '#8480a7', notes: '身世成谜的少年剑客，云栖月的关门弟子。', tags: ['主角', '剑客'] },
      { id: 'yunqiyue', name: '云栖月', group: '云岫门', color: '#8480a7', notes: '云岫门掌门，清冷寡言。与花怜月有一段旧交。', tags: ['掌门'] },
      { id: 'shenqinghe', name: '沈清和', group: '云岫门', color: '#8480a7', notes: '云岫门首徒，为人谦和，行事周全。', tags: ['大师兄'] },
      { id: 'luzhaochuan', name: '陆照川', group: '江湖散客', color: '#a97f5c', notes: '浪迹江湖的游侠，酒壶从不离身。', tags: ['游侠'] },
      { id: 'suwansheng', name: '苏晚声', group: '江湖散客', color: '#a97f5c', notes: '听雨楼说书人，知晓许多不为人知的往事。', tags: ['说书人'] },
      { id: 'wenjingtang', name: '温景棠', group: '江湖散客', color: '#a97f5c', notes: '行走江湖的商人，消息灵通。', tags: ['商人'] },
      { id: 'moxuan', name: '墨玄', group: '玄影阁', color: '#678ca3', notes: '玄影阁主，目标始终无人知晓。', tags: ['阁主'] },
      { id: 'yeweilan', name: '叶微澜', group: '玄影阁', color: '#678ca3', notes: '玄影阁情报使，与花绫相识于微时。', tags: ['情报使'] },
      { id: 'guchangfeng', name: '顾长风', group: '玄影阁', color: '#678ca3', notes: '墨玄的心腹，身负一笔旧债。', tags: ['护卫'] }
    ],
    relations: [
      ['huaying', 'hualing', '姐姐', 'one-way'], ['hualianyue', 'huaying', '母亲', 'one-way'], ['hualianyue', 'hualing', '母亲', 'one-way'],
      ['huaying', 'ziye', '知己', 'two-way'], ['yunqiyue', 'ziye', '师父', 'one-way'], ['shenqinghe', 'ziye', '师兄', 'one-way'],
      ['yunqiyue', 'shenqinghe', '师父', 'one-way'], ['yunqiyue', 'hualianyue', '故交', 'two-way'],
      ['huaying', 'luzhaochuan', '朋友', 'two-way'], ['luzhaochuan', 'suwansheng', '挚友', 'two-way'],
      ['suwansheng', 'wenjingtang', '合作', 'two-way'], ['wenjingtang', 'huaying', '相助', 'one-way'],
      ['moxuan', 'yunqiyue', '宿敌', 'two-way'], ['moxuan', 'yeweilan', '阁主', 'one-way'],
      ['moxuan', 'guchangfeng', '阁主', 'one-way'], ['yeweilan', 'hualing', '好友', 'two-way'],
      ['guchangfeng', 'luzhaochuan', '旧识', 'two-way'], ['ziye', 'moxuan', '追查', 'one-way']
    ].map((r, i) => ({ id: `r${i + 1}`, from: r[0]!, to: r[1]!, label: r[2]!, direction: r[3] as 'one-way' | 'two-way', description: '' }))
  }
}
