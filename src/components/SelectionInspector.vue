<script setup lang="ts">
import {
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  ChevronRight,
  CircleDot,
  Focus,
  Link2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-vue-next";
import { useWorkspaceContext } from "../workspaceContext";
import SelfReference from "./SelfReference.vue";
const {
  neighborhood,
  inspector,
  character,
  relation,
  linked,
  connectedPeople,
  name,
  relationLabel,
  select,
  editCharacter,
  editRelation,
  deleteCharacter,
  deleteRelation,
  palette,
} = useWorkspaceContext();
</script>
<template>
  <aside class="inspector">
    <div class="inspector-header">
      <span>{{ relation ? "关系详情" : "角色档案" }}</span>
      <div class="inspector-header-actions">
        <button
          v-if="character"
          class="inspector-edit-button"
          title="编辑当前角色档案"
          @click="editCharacter(character)"
        >
          <Pencil :size="13" />编辑档案
        </button>
        <button
          class="icon-button small"
          aria-label="关闭详情"
          @click="inspector = false"
        >
          <X :size="15" />
        </button>
      </div>
    </div>
    <template v-if="character">
      <div class="profile">
        <span
          class="avatar profile-avatar"
          :style="{
            '--character-color': character.color || palette[0],
          }"
          ><span>{{ character.name }}</span
          ><i></i
        ></span>
        <h2>{{ character.name }}</h2>

        <div class="tags">
          <span v-for="tag in character.tags" :key="tag">{{ tag }}</span>
        </div>
      </div>
      <div class="profile-stats">
        <div>
          <strong>{{ connectedPeople }}</strong
          ><span>关联人物</span>
        </div>
        <span></span>
        <div>
          <strong>{{ linked.length }}</strong
          ><span>人物关系</span>
        </div>
      </div>

      <section class="inspector-section relation-section">
        <h3>
          <Link2 :size="14" />人物关系<span class="count">{{
            linked.length
          }}</span
          ><button
            class="icon-button small"
            aria-label="为当前角色添加关系"
            @click="editRelation()"
          >
            <Plus :size="15" />
          </button>
        </h3>
        <div v-if="!linked.length" class="subtle-empty">
          尚未与其他角色建立关系
        </div>
        <button
          v-for="r in linked"
          :key="r.id"
          class="relation-row"
          @click="select('relation', r.id)"
        >
          <span class="relation-direction"
            ><ArrowLeftRight
              v-if="r.direction === 'two-way'"
              :size="15" /><ArrowRight
              v-else
              :size="15"
              :class="{ reversed: r.to === character.id }" /></span
          ><span
            ><strong>{{ name(r.from === character.id ? r.to : r.from) }}</strong
            ><small class="relation-endpoints"
              ><SelfReference
                v-if="r.from === character.id"
                :name="character.name"
              />
              <span v-else class="endpoint-name">{{ name(r.from) }}</span>
              <span>{{ r.direction === "two-way" ? "↔" : "→" }}</span>
              <SelfReference
                v-if="r.to === character.id"
                :name="character.name"
              />
              <span v-else class="endpoint-name">{{ name(r.to) }}</span></small
            ></span
          ><span class="relation-pill">{{ relationLabel(r) }}</span
          ><ChevronRight :size="12" />
        </button>
      </section>
      <div class="inspector-foot">
        <button
          class="text-button"
          :class="{ 'focus-active': neighborhood }"
          @click="neighborhood = !neighborhood"
        >
          <Focus :size="15" />{{
            neighborhood ? "显示全部关系" : "聚焦一度关系"
          }}</button
        ><button
          class="icon-button danger-subtle"
          aria-label="删除当前角色"
          title="删除角色"
          @click="deleteCharacter(character)"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </template>
    <template v-else-if="relation"
      ><div class="relation-profile">
        <div class="relation-symbol"><Link2 :size="26" /></div>
        <h2>{{ relationLabel(relation) }}</h2>
        <p>
          {{ relation.direction === "two-way" ? "双向关系" : "单向关系" }}
        </p>
        <div class="endpoints">
          <button @click="select('character', relation.from, true)">
            {{ name(relation.from) }}</button
          ><ArrowLeftRight
            v-if="relation.direction === 'two-way'"
            :size="20"
          /><ArrowRight v-else :size="20" /><button
            @click="select('character', relation.to, true)"
          >
            {{ name(relation.to) }}
          </button>
        </div>
        <button class="edit-profile" @click="editRelation(relation)">
          <Pencil :size="13" />编辑关系
        </button>
      </div>
      <section class="inspector-section">
        <h3><BookOpen :size="14" />关系描述</h3>
        <p class="biography">
          {{
            relation.description ||
            "还没有补充描述。记录他们相识的缘由，或关系变化的伏笔。"
          }}
        </p>
      </section>
      <div class="inspector-foot">
        <span class="muted-text">每条连线，都是故事。</span
        ><button
          class="icon-button danger-subtle"
          aria-label="删除当前关系"
          @click="deleteRelation(relation)"
        >
          <Trash2 :size="14" />
        </button></div
    ></template>
    <div v-else class="no-selection">
      <CircleDot :size="36" :stroke-width="1" />
      <h3>走近故事中的人</h3>
      <p>点击一个角色或一条连线，<br />在这里查看和编辑详情。</p>
    </div>
  </aside>
</template>
