<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import {
  fetchPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  loadPrompts,
  type PendingSubmission,
  type Prompt,
} from '../../repositories/prompts'
import Button from '../../components/ui/Button.vue'
import Card from '../../components/ui/Card.vue'
import Badge from '../../components/ui/Badge.vue'
import * as Diff from 'diff'

const { t } = useI18n()
const auth = useAuth()
const pendingPrompts = ref<PendingSubmission[]>([])
const loading = ref(true)
const error = ref('')
const processingId = ref<string | null>(null)
const originalPrompts = ref<Record<string, Prompt>>({})

const fetchSubmissions = async () => {
  loading.value = true
  try {
    if (!auth.token.value) return
    pendingPrompts.value = await fetchPendingSubmissions(auth.token.value)

    // Fetch original prompts for updates/deletes
    try {
      const promptList = await loadPrompts()
      const promptMap = promptList.reduce(
        (acc, p) => {
          acc[p.id] = p
          return acc
        },
        {} as Record<string, Prompt>,
      )
      originalPrompts.value = promptMap
    } catch (loadError) {
      console.warn('Failed to load original prompts for diff view:', loadError)
      // Non-fatal error, we can still review but diffs might be incomplete
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load submissions'
    console.error(e)
  } finally {
    loading.value = false
  }
}

const parsePromptFromIssueBody = (body: string): Partial<Prompt> => {
  const titleMatch = body.match(/\*\*Title:\*\* (.*)/)
  const categoryMatch = body.match(/\*\*Category:\*\* (.*)/)
  const descMatch = body.match(/\*\*Description:\*\*\s*\n([\s\S]*?)\n\n\*\*Prompt:\*\*/)
  const promptMatch = body.match(/```\n([\s\S]*?)\n```/)
  const tagsMatch = body.match(/\*\*Tags:\*\* (.*)/)

  return {
    title: titleMatch ? titleMatch[1].trim() : undefined,
    category: categoryMatch ? categoryMatch[1].trim() : undefined,
    description: descMatch ? descMatch[1].trim() : undefined,
    prompt: promptMatch ? promptMatch[1].trim() : undefined,
    tags: tagsMatch ? tagsMatch[1].split(',').map((s) => s.trim()) : undefined,
  }
}

const getDiff = (oldText: string, newText: string) => {
  const diff = Diff.diffWords(oldText || '', newText || '')
  return diff
}

const getFieldDiff = (submission: PendingSubmission, field: keyof Prompt) => {
  const original = submission.originalId ? originalPrompts.value[submission.originalId] : null
  const newValues = parsePromptFromIssueBody(submission.prompt)

  const oldVal = original ? String(original[field] || '') : ''
  const newVal = newValues[field] !== undefined ? String(newValues[field]) : oldVal

  return getDiff(oldVal, newVal)
}

const handleApprove = async (submission: PendingSubmission) => {
  if (!auth.token.value) return
  processingId.value = submission.id
  try {
    await approveSubmission(submission, auth.token.value)
    // Remove from list immediately for UX
    pendingPrompts.value = pendingPrompts.value.filter((p) => p.id !== submission.id)
  } catch (e) {
    console.error(e)
    alert('Failed to approve submission')
  } finally {
    processingId.value = null
  }
}

const handleReject = async (submission: PendingSubmission) => {
  if (!auth.token.value) return
  processingId.value = submission.id
  try {
    await rejectSubmission(submission, auth.token.value)
    // Remove from list immediately for UX
    pendingPrompts.value = pendingPrompts.value.filter((p) => p.id !== submission.id)
  } catch (e) {
    console.error(e)
    alert('Failed to reject submission')
  } finally {
    processingId.value = null
  }
}

const getAuthorName = (author: any) => {
  if (typeof author === 'string') return author
  return author?.username || 'Anonymous'
}

const getAuthorAvatar = (author: any) => {
  if (typeof author === 'object' && author?.avatarUrl) return author.avatarUrl
  return null
}

onMounted(() => {
  fetchSubmissions()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('review.title') }}</h1>
        <p class="text-gray-500 dark:text-gray-400">{{ t('review.subtitle') }}</p>
      </div>
      <Button variant="outline" @click="fetchSubmissions">{{ t('review.refresh') }}</Button>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
    </div>

    <div v-else-if="error" class="text-center py-12 text-red-500">
      {{ error }}
    </div>

    <div v-else-if="pendingPrompts.length === 0" class="text-center py-12 text-gray-500">
      {{ t('review.empty') }}
    </div>

    <div v-else class="grid gap-6">
      <Card v-for="submission in pendingPrompts" :key="submission.id" class="overflow-hidden">
        <div
          class="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center"
        >
          <div class="flex items-center gap-3">
            <!-- Author Avatar -->
            <img
              v-if="getAuthorAvatar(submission.author)"
              :src="getAuthorAvatar(submission.author)"
              class="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700"
              alt="Avatar"
            />
            <div
              v-else
              class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs"
            >
              {{ getAuthorName(submission.author).charAt(0).toUpperCase() }}
            </div>

            <div>
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900 dark:text-white">{{
                  getAuthorName(submission.author)
                }}</span>
                <span class="text-gray-400 text-xs">•</span>
                <span class="text-xs text-gray-500">{{
                  new Date(submission.createdAt).toLocaleDateString()
                }}</span>
              </div>
              <div class="flex items-center gap-2 mt-0.5">
                <Badge :variant="submission.type === 'pr' ? 'info' : 'warning'" size="sm">
                  {{ submission.type === 'pr' ? 'PR' : 'Issue' }} #{{ submission.number }}
                </Badge>
                <span class="text-xs text-gray-500">
                  {{
                    submission.action === 'create'
                      ? t('review.types.create')
                      : submission.action === 'update'
                        ? t('review.types.update')
                        : t('review.types.delete')
                  }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <Button
              variant="success"
              size="sm"
              :disabled="!!processingId"
              @click="handleApprove(submission)"
            >
              {{ processingId === submission.id ? t('review.approving') : t('review.approve') }}
            </Button>
            <Button
              variant="danger"
              size="sm"
              :disabled="!!processingId"
              @click="handleReject(submission)"
            >
              {{ processingId === submission.id ? t('review.rejecting') : t('review.reject') }}
            </Button>
          </div>
        </div>

        <div class="p-6">
          <!-- Create Mode -->
          <div v-if="submission.action === 'create'">
            <h3 class="text-lg font-bold mb-2 text-gray-900 dark:text-white">
              {{ submission.title }}
            </h3>
            <div class="prose dark:prose-invert max-w-none">
              <p class="text-gray-600 dark:text-gray-300 mb-4">{{ submission.description }}</p>
              <div
                class="bg-gray-50 dark:bg-gray-900 rounded-md p-4 border border-gray-100 dark:border-gray-800"
              >
                <pre
                  class="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200"
                  >{{ submission.prompt }}</pre
                >
              </div>
              <div class="mt-4 flex gap-2 flex-wrap">
                <span
                  v-for="tag in submission.tags"
                  :key="tag"
                  class="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400"
                  >#{{ tag }}</span
                >
              </div>
            </div>
          </div>

          <!-- Update Mode -->
          <div v-else-if="submission.action === 'update'" class="space-y-6">
            <div class="flex items-center gap-2 mb-4">
              <h3 class="text-lg font-bold">{{ t('review.diff') }}</h3>
              <span class="text-xs text-gray-400 font-mono">ID: {{ submission.originalId }}</span>
            </div>

            <div
              v-for="field in ['title', 'description', 'prompt', 'category', 'tags']"
              :key="field"
            >
              <div class="mb-1 text-xs uppercase tracking-wider font-semibold text-gray-500">
                {{ t(`review.fields.${field}`) }}
              </div>
              <div
                class="text-sm font-mono bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto leading-relaxed"
              >
                <span
                  v-for="(part, index) in getFieldDiff(submission, field as keyof Prompt)"
                  :key="index"
                  :class="{
                    'bg-green-200 dark:bg-green-900/60 text-green-900 dark:text-green-100 px-1 rounded-sm':
                      part.added,
                    'bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-100 line-through decoration-red-500/50 px-1 rounded-sm mx-0.5':
                      part.removed,
                    'text-gray-700 dark:text-gray-300': !part.added && !part.removed,
                  }"
                  >{{ part.value }}</span
                >
              </div>
            </div>
          </div>

          <!-- Delete Mode -->
          <div v-else-if="submission.action === 'delete'">
            <div
              class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded text-red-700 dark:text-red-300 text-sm font-medium"
            >
              {{ t('review.types.delete') }}: {{ submission.originalId }}
            </div>

            <div
              v-if="originalPrompts[submission.originalId!]"
              class="opacity-75 grayscale hover:grayscale-0 transition-all duration-300"
            >
              <h4 class="font-bold text-lg mb-2">
                {{ originalPrompts[submission.originalId!].title }}
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {{ originalPrompts[submission.originalId!].description }}
              </p>
              <div
                class="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm font-mono border border-gray-200 dark:border-gray-700"
              >
                {{ originalPrompts[submission.originalId!].prompt }}
              </div>
            </div>
            <div
              v-else
              class="p-8 text-center bg-gray-50 dark:bg-gray-900 rounded border border-dashed border-gray-300 dark:border-gray-700 text-gray-500"
            >
              {{ t('common.messages.originalNotFound') }}
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
