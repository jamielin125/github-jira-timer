import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { fromEvent, switchMap, map, takeUntil, tap, type Subscription } from 'rxjs'
import type { ModalPosition } from '@/types'

function clampToViewport(pos: ModalPosition, el: HTMLElement): ModalPosition {
  const rect = el.getBoundingClientRect()
  const maxX = window.innerWidth - rect.width
  const maxY = window.innerHeight - rect.height

  return {
    x: Math.max(0, Math.min(pos.x, maxX)),
    y: Math.max(0, Math.min(pos.y, maxY))
  }
}

export function useDraggable(
  elementRef: Ref<HTMLElement | null>,
  storageKey = 'modalPosition'
) {
  const position = ref<ModalPosition>({ x: 20, y: 20 })
  let subscription: Subscription | null = null

  onMounted(async () => {
    const el = elementRef.value
    if (!el) return

    // Load saved position and validate it's within viewport
    const saved = await chrome.storage.local.get(storageKey)
    if (saved[storageKey]) {
      // Wait for element to render to get its size
      requestAnimationFrame(() => {
        position.value = clampToViewport(saved[storageKey], el)
      })
    }

    const mousedown$ = fromEvent<MouseEvent>(el, 'mousedown')
    const mousemove$ = fromEvent<MouseEvent>(document, 'mousemove')
    const mouseup$ = fromEvent<MouseEvent>(document, 'mouseup')

    subscription = mousedown$.pipe(
      switchMap(start => {
        const offsetX = start.clientX - position.value.x
        const offsetY = start.clientY - position.value.y

        return mousemove$.pipe(
          map(move => {
            const newPos = {
              x: move.clientX - offsetX,
              y: move.clientY - offsetY
            }
            return clampToViewport(newPos, el)
          }),
          takeUntil(mouseup$.pipe(
            tap(() => {
              chrome.storage.local.set({ [storageKey]: position.value })
            })
          ))
        )
      })
    ).subscribe(pos => {
      position.value = pos
    })

    // Re-clamp on window resize
    window.addEventListener('resize', () => {
      position.value = clampToViewport(position.value, el)
    })
  })

  onUnmounted(() => {
    subscription?.unsubscribe()
  })

  return { position }
}
