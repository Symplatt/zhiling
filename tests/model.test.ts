import { describe, it, expect } from 'vitest'
import { parseAtlas, addCharacter, removeCharacter, splitTags, relationLabel, relationFrom } from '../src/model'
import { createSample } from '../src/sample'
describe('关系网数据完整性', () => {
  it('移除旧版关系网简介，保留人物小传、关系描述及扩展信息', () => {
    const input = createSample()
    input.description = '旧版关系网简介'
    input.custom = '扩展信息'
    input.relations[0]!.description = '两人相识的故事'
    const result = parseAtlas(input).data
    expect(result).not.toHaveProperty('description')
    expect(result.characters[0]!.notes).toBe(input.characters[0]!.notes)
    expect(result.relations[0]!.description).toBe('两人相识的故事')
    expect(result.custom).toBe('扩展信息')
  })
  it('兼容需求文档的最小 JSON，并生成稳定关系 ID', () => {
    const input = { characters: [{ id: '001', name: '花盈' }, { id: '002', name: '花绫' }], relations: [{ from: '001', to: '002', label: '姐姐', direction: 'one-way' }] }
    const { data } = parseAtlas(input)
    expect(data.relations[0]).toMatchObject({ id: 'relation-1', direction: 'one-way' })
    expect(parseAtlas(data).data).toEqual(data)
  })
  it('拒绝重复角色 ID，保留同名但不同 ID 的角色', () => {
    const data = createSample(); data.characters.push({ ...data.characters[0]! })
    expect(() => parseAtlas(data)).toThrow('重复')
    data.characters.at(-1)!.id = 'different-id'
    expect(parseAtlas(data).data.characters.length).toBe(13)
  })
  it('新增时拒绝重复 ID，删除角色时级联清理入边和出边', () => {
    const data = createSample()
    expect(() => addCharacter(data, data.characters[0]!)).toThrow('已存在')
    const updated = removeCharacter(data, 'huaying')
    expect(updated.characters.some(c => c.id === 'huaying')).toBe(false)
    expect(updated.relations.some(r => r.to === 'huaying' || r.from === 'huaying')).toBe(false)
    expect(() => parseAtlas(updated)).not.toThrow()
  })
  it('拒绝悬空关系、重复关系 ID、未知版本及方向', () => {
    const data = createSample(); data.relations[0]!.to = 'missing'
    expect(() => parseAtlas(data)).toThrow('不存在')
    const duplicate = createSample(); duplicate.relations.push({ ...duplicate.relations[0]! })
    expect(() => parseAtlas(duplicate)).toThrow('重复')
    expect(() => parseAtlas({ ...createSample(), version: 2 })).toThrow('版本')
    expect(() => parseAtlas({ characters: [{ id: 'a', name: 'a' }], relations: [{ from: 'a', to: 'a', direction: 'wrong' }] })).toThrow('direction')
  })
  it('保留同一对角色的多条关系及扩展字段', () => {
    const data = createSample(); data.custom = { author: '作者' }
    data.characters[0]!.birthday = '初一'
    data.relations.push({ ...data.relations[0]!, id: 'another', label: '朋友', direction: 'two-way' })
    const result = parseAtlas(JSON.parse(JSON.stringify(data))).data
    expect(result.relations.length).toBe(19)
    expect(result.characters[0]!.birthday).toBe('初一')
    expect(result.custom).toEqual({ author: '作者' })
  })
  it('旧头像字段被移除，其他角色信息保留', () => {
    const data = createSample(); data.characters[0]!.avatar = 'https://example.com/tracking.png'
    expect(parseAtlas(data).data.characters[0]!.avatar).toBeUndefined()
    expect(parseAtlas(data).data.characters[0]!.name).toBe('花盈')
  })
  it('空格分隔标签并去重',()=>{expect(splitTags('  侠客 仙子\t金丹后期 仙子 ')).toEqual(['侠客','仙子','金丹后期'])})
  it('旧双向关系合并到一个输入字段，重复载入不会重复拼接', () => {
    const data = parseAtlas({characters:[{id:'a',name:'甲'},{id:'b',name:'乙'}],relations:[
      {id:'r',from:'a',to:'b',label:'母亲',reverseLabel:'女儿',mode:'paired',direction:'two-way',description:'原说明'},
    ]}).data
    expect(data.relations[0]).toMatchObject({label:'母亲/女儿',description:'原说明'})
    expect(data.relations[0]).not.toHaveProperty('mode')
    expect(data.relations[0]).not.toHaveProperty('reverseLabel')
    expect(parseAtlas(data).data).toEqual(data)
    data.relations[0]!.label = '母女'
    expect(parseAtlas(data).data.relations[0]!.label).toBe('母女')
  })
  it('成对的双向关系按人物视角反转，共同关系不反转',()=>{
    const r={id:'r',from:'a',to:'b',label:'母亲',reverseLabel:'女儿',direction:'two-way' as const,mode:'paired' as const}
    expect(relationLabel(r)).toBe('母亲/女儿')
    expect(relationFrom(r,'a')).toBe('母亲 / 对方：女儿')
    expect(relationFrom(r,'b')).toBe('女儿 / 对方：母亲')
    expect(relationLabel({...r,mode:'shared',label:'母女'})).toBe('母女')
    expect(()=>parseAtlas({characters:[{id:'a',name:'甲'},{id:'b',name:'乙'}],relations:[{...r,reverseLabel:''}]})).toThrow('B 对 A')
  })
  it('接受空图与 500 角色关系网', () => {
    expect(parseAtlas({ characters: [], relations: [] }).data.characters).toEqual([])
    const characters = Array.from({ length: 500 }, (_, i) => ({ id: `c${i}`, name: `角色${i}` }))
    const relations = characters.slice(1).map((c, i) => ({ from: `c${i}`, to: c.id, label: '朋友', direction: 'two-way' }))
    expect(parseAtlas({ characters, relations }).data.relations.length).toBe(499)
  })
})
