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
import Badge from '../../components/ui/Badge.vue'
import Modal from '../../components/ui/Modal.vue'
import * as Diff from 'diff'

const { t } = useI18n()
const auth = useAuth()
const pendingPrompts = ref<PendingSubmission[]>([])
const loading = ref(true)
const error = ref('')
const processingId = ref<string | null>(null)
const originalPrompts = ref<Record<string, Prompt>>({})
const selectedSubmission = ref<PendingSubmission | null>(null)

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
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load submissions'
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openReview = (submission: PendingSubmission) => {
  selectedSubmission.value = submission
}

const closeReview = () => {
  selectedSubmission.value = null
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

const handleApprove = async () => {
  if (!auth.token.value || !selectedSubmission.value) return
  const submission = selectedSubmission.value
  processingId.value = submission.id
  try {
    await approveSubmission(submission, auth.token.value)
    pendingPrompts.value = pendingPrompts.value.filter((p) => p.id !== submission.id)
    closeReview()
  } catch (e) {
    console.error(e)
    alert('Failed to approve submission')
  } finally {
    processingId.value = null
  }
}

const handleReject = async () => {
  if (!auth.token.value || !selectedSubmission.value) return
  const submission = selectedSubmission.value
  processingId.value = submission.id
  try {
    await rejectSubmission(submission, auth.token.value)
    pendingPrompts.value = pendingPrompts.value.filter((p) => p.id !== submission.id)
    closeReview()
  } catch (e) {
    console.error(e)
    alert('Failed to reject submission')
  } finally {
    processingId.value = null
  }
}

const getAuthorName = (author: string | { username: string; avatarUrl?: string }) => {
  if (typeof author === 'string') return author
  return author?.username || 'Anonymous'
}

const getAuthorAvatar = (author: string | { username: string; avatarUrl?: string }) => {
  if (typeof author === 'object' && author?.avatarUrl) return author.avatarUrl
  return null
}

const getSubmissionTitle = (submission: PendingSubmission) => {
  if (submission.action === 'create') {
    // Try to extract title from body if possible, or use "New Prompt"
    const parsed = parsePromptFromIssueBody(submission.prompt)
    return parsed.title || t('review.types.create')
  }
  return submission.action === 'update'
    ? `${t('review.types.update')}: ${submission.originalId}`
    : `${t('review.types.delete')}: ${submission.originalId}`
}

onMounted(() => {
  fetchSubmissions()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('review.title') }}</h1>
        <p class="text-gray-500 dark:text-gray-400">{{ t('review.subtitle') }}</p>
      </div>
      <Button variant="outline" @click="fetchSubmissions">{{ t('review.refresh') }}</Button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12 text-red-500">
      {{ error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="pendingPrompts.length === 0" class="text-center py-12 text-gray-500">
      {{ t('review.empty') }}
    </div>

    <!-- List View -->
    <div
      v-else
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead
            class="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
          >
            <tr>
              <th class="px-6 py-4 font-medium">{{ t('common.status.title') }}</th>
              <th class="px-6 py-4 font-medium">{{ t('review.fields.title') }}</th>
              <th class="px-6 py-4 font-medium">{{ t('review.submittedBy') }}</th>
              <th class="px-6 py-4 font-medium text-right">
                {{ t('prompts.list.columns.actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="submission in pendingPrompts"
              :key="submission.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <Badge :variant="submission.type === 'pr' ? 'info' : 'warning'" size="sm">
                    {{ submission.type === 'pr' ? 'PR' : 'Issue' }}
                  </Badge>
                  <span
                    class="text-xs font-medium"
                    :class="{
                      'text-green-600 dark:text-green-400': submission.action === 'create',
                      'text-blue-600 dark:text-blue-400': submission.action === 'update',
                      'text-red-600 dark:text-red-400': submission.action === 'delete',
                    }"
                  >
                    {{
                      submission.action === 'create'
                        ? t('review.types.create')
                        : submission.action === 'update'
                          ? t('review.types.update')
                          : t('review.types.delete')
                    }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                {{ getSubmissionTitle(submission) }}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <img
                    v-if="getAuthorAvatar(submission.author)"
                    :src="getAuthorAvatar(submission.author)"
                    class="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700"
                    alt="Avatar"
                  />
                  <div
                    v-else
                    class="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs"
                  >
                    {{ getAuthorName(submission.author).charAt(0).toUpperCase() }}
                  </div>
                  <span class="text-gray-700 dark:text-gray-300">{{
                    getAuthorName(submission.author)
                  }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <Button size="sm" @click="openReview(submission)">
                  {{ t('common.actions.view') }}
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Review Modal -->
    <Modal
      :is-open="!!selectedSubmission"
      :title="selectedSubmission ? getSubmissionTitle(selectedSubmission) : ''"
      size="xl"
      @close="closeReview"
    >
      <template v-if="selectedSubmission">
        <div class="space-y-6">
          <!-- Meta Info -->
          <div
            class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800"
          >
            <div class="flex items-center gap-2">
              <img
                v-if="getAuthorAvatar(selectedSubmission.author)"
                :src="getAuthorAvatar(selectedSubmission.author)"
                class="w-8 h-8 rounded-full"
              />
              <div
                v-else
                class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs"
              >
                {{ getAuthorName(selectedSubmission.author).charAt(0).toUpperCase() }}
              </div>
              <div>
                <div class="text-sm font-medium">
                  {{ getAuthorName(selectedSubmission.author) }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ new Date(selectedSubmission.createdAt).toLocaleString() }}
                </div>
              </div>
            </div>
            <div class="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
            <div>
              <div class="text-xs text-gray-500 mb-0.5">Source</div>
              <a
                :href="selectedSubmission.sourceLink"
                target="_blank"
                class="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                {{ selectedSubmission.type === 'pr' ? 'Pull Request' : 'Issue' }} #{{
                  selectedSubmission.number
                }}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          </div>

          <!-- Content -->

          <!-- Create Mode -->
          <div v-if="selectedSubmission.action === 'create'">
            <div class="prose dark:prose-invert max-w-none">
              <div
                class="bg-gray-50 dark:bg-gray-900 rounded-md p-4 border border-gray-100 dark:border-gray-800"
              >
                <pre
                  class="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200"
                  >{{ selectedSubmission.prompt }}</pre
                >
              </div>
            </div>
          </div>

          <!-- Update Mode -->
          <div v-else-if="selectedSubmission.action === 'update'" class="space-y-6">
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
                  v-for="(part, index) in getFieldDiff(selectedSubmission, field as keyof Prompt)"
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
          <div v-else-if="selectedSubmission.action === 'delete'">
            <div
              class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded text-red-700 dark:text-red-300 text-sm font-medium"
            >
              {{ t('review.types.delete') }}: {{ selectedSubmission.originalId }}
            </div>

            <div v-if="originalPrompts[selectedSubmission.originalId!]" class="opacity-75">
              <h4 class="font-bold text-lg mb-2">
                {{ originalPrompts[selectedSubmission.originalId!].title }}
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {{ originalPrompts[selectedSubmission.originalId!].description }}
              </p>
              <div
                class="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm font-mono border border-gray-200 dark:border-gray-700"
              >
                {{ originalPrompts[selectedSubmission.originalId!].prompt }}
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
      </template>

      <template #footer>
        <Button variant="ghost" @click="closeReview"> Cancel </Button>
        <Button variant="danger" :disabled="!!processingId" @click="handleReject">
          {{ processingId === selectedSubmission?.id ? t('review.rejecting') : t('review.reject') }}
        </Button>
        <Button variant="success" :disabled="!!processingId" @click="handleApprove">
          {{
            processingId === selectedSubmission?.id ? t('review.approving') : t('review.approve')
          }}
        </Button>
      </template>
    </Modal>
  </div>
</template>
