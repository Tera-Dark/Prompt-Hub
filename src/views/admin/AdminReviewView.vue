<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

onMounted(() => {
  fetchSubmissions()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Pending Reviews</h1>
        <p class="text-gray-500 dark:text-gray-400">Review community submissions</p>
      </div>
      <Button variant="outline" @click="fetchSubmissions">Refresh</Button>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
    </div>

    <div v-else-if="error" class="text-center py-12 text-red-500">
      {{ error }}
    </div>

    <div v-else-if="pendingPrompts.length === 0" class="text-center py-12 text-gray-500">
      No pending submissions
    </div>

    <div v-else class="grid gap-6">
      <Card v-for="submission in pendingPrompts" :key="submission.id">
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-lg font-bold">
                <span v-if="submission.action === 'create'">New Prompt</span>
                <span v-else-if="submission.action === 'update'"
                  >Update: {{ submission.originalId }}</span
                >
                <span v-else-if="submission.action === 'delete'"
                  >Delete: {{ submission.originalId }}</span
                >
              </h3>
              <Badge :variant="submission.type === 'pr' ? 'info' : 'warning'">
                {{ submission.type === 'pr' ? 'Pull Request' : 'Issue' }} #{{ submission.number }}
              </Badge>
            </div>
            <p class="text-sm text-gray-500">Submitted by {{ submission.author }}</p>
          </div>
          <div class="flex gap-2">
            <Button
              variant="success"
              size="sm"
              :disabled="!!processingId"
              @click="handleApprove(submission)"
            >
              {{ processingId === submission.id ? 'Approving...' : 'Approve' }}
            </Button>
            <Button
              variant="danger"
              size="sm"
              :disabled="!!processingId"
              @click="handleReject(submission)"
            >
              {{ processingId === submission.id ? 'Rejecting...' : 'Reject' }}
            </Button>
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
          <!-- Create Mode -->
          <div v-if="submission.action === 'create'">
            <pre class="whitespace-pre-wrap font-mono text-sm">{{ submission.prompt }}</pre>
          </div>

          <!-- Update Mode -->
          <div v-else-if="submission.action === 'update'" class="space-y-4">
            <div
              v-for="field in ['title', 'description', 'prompt', 'category', 'tags']"
              :key="field"
            >
              <h4 class="text-sm font-semibold capitalize mb-1">{{ field }}</h4>
              <div
                class="text-sm font-mono bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700"
              >
                <span
                  v-for="(part, index) in getFieldDiff(submission, field as keyof Prompt)"
                  :key="index"
                  :class="{
                    'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100': part.added,
                    'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 line-through':
                      part.removed,
                    'text-gray-800 dark:text-gray-200': !part.added && !part.removed,
                  }"
                  >{{ part.value }}</span
                >
              </div>
            </div>
          </div>

          <!-- Delete Mode -->
          <div v-else-if="submission.action === 'delete'">
            <div class="text-red-600 font-bold mb-2">Request to delete prompt:</div>
            <div v-if="originalPrompts[submission.originalId!]" class="opacity-75">
              <h4 class="font-bold">{{ originalPrompts[submission.originalId!].title }}</h4>
              <p class="text-sm">{{ originalPrompts[submission.originalId!].description }}</p>
              <pre class="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded">{{
                originalPrompts[submission.originalId!].prompt
              }}</pre>
            </div>
            <div v-else class="text-gray-500 italic">
              Original prompt not found (already deleted?)
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
