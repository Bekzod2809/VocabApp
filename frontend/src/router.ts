import { useEffect, useState } from 'react'

// Hash router: #/, #/g/<id>, #/g/<id>/study, #/settings
// Android'ning "orqaga" tugmasi brauzer tarixidan foydalanadi, shuning uchun alohida plugin kerak emas.

function parse(hash: string): string[] {
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
}

export function useRoute(): string[] {
  const [segments, setSegments] = useState(() => parse(location.hash))

  useEffect(() => {
    const onChange = () => setSegments(parse(location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return segments
}

export function navigate(path: string): void {
  location.hash = path
}

export function goBack(fallback = '/'): void {
  if (history.length > 1) {
    history.back()
  } else {
    navigate(fallback)
  }
}

// Oyna (Sheet) yopilganda tarixdan bitta yozuv olib tashlanadi (history.back, asinxron).
// Undan keyingi navigatsiya shu tugagach bajarilishi kerak, aks holda ular aralashib ketadi.
export function afterHistoryBack(fn: () => void): void {
  let done = false
  const run = () => {
    if (done) return
    done = true
    window.removeEventListener('popstate', run)
    fn()
  }
  window.addEventListener('popstate', run)
  setTimeout(run, 300)
}
