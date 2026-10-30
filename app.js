/* LobeWise marketing site: language switch, hero animation, scroll reveal, counters, stepper, pricing toggle, waitlist. */
;(() => {
  const $ = (s, r = document) => r.querySelector(s)
  const $$ = (s, r = document) => [...r.querySelectorAll(s)]
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const WAITLIST_TO = 'mark.peters.21575@gmail.com'

  // ---- Language: English lives in the HTML, Dutch in i18n.js. The original English is kept to switch back.
  const dict = window.LOBEWISE_I18N || { nl: {}, en: {} }
  const original = new Map()
  const setLang = (lang) => {
    const t = dict[lang] || {}
    for (const el of $$('[data-i18n]')) {
      const key = el.dataset.i18n
      if (!original.has(el)) original.set(el, el.innerHTML)
      if (lang === 'en') el.innerHTML = original.get(el)
      else if (t[key]) el.innerHTML = t[key]
    }
    for (const el of $$('[data-i18n-attr]')) {
      const [attr, key] = el.dataset.i18nAttr.split(':')
      const id = `${attr}:${key}`
      if (!original.has(el)) original.set(el, new Map())
      const store = original.get(el)
      if (!store.has(id)) store.set(id, el.getAttribute(attr))
      el.setAttribute(attr, lang === 'en' ? store.get(id) : t[key] || store.get(id))
    }
    document.documentElement.lang = lang
    for (const b of $$('[data-lang]')) b.setAttribute('aria-pressed', String(b.dataset.lang === lang))
    try {
      localStorage.setItem('lobewise-site-lang', lang)
    } catch {
      /* private mode */
    }
    updatePrice()
  }
  for (const b of $$('[data-lang]')) b.addEventListener('click', () => setLang(b.dataset.lang))
  let lang = (navigator.language || '').toLowerCase().startsWith('nl') ? 'nl' : 'en'
  try {
    const saved = localStorage.getItem('lobewise-site-lang')
    if (saved === 'en' || saved === 'nl') lang = saved
  } catch {
    /* private mode */
  }

  // ---- Mobile menu
  const burger = $('.nav__burger')
  const mobile = $('#mobile-menu')
  burger?.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true'
    burger.setAttribute('aria-expanded', String(!open))
    mobile.hidden = open
  })
  mobile?.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      burger.setAttribute('aria-expanded', 'false')
      mobile.hidden = true
    }
  })
  addEventListener('scroll', () => $('.nav')?.classList.toggle('is-scrolled', scrollY > 8), { passive: true })

  // ---- Hero lobes: a polar pattern |cos(n·θ)|^k drawn as a closed path; CSS rotates and breathes the sets.
  const lobePath = (n, k = 1.6, r = 230, pts = 180) => {
    let d = ''
    for (let i = 0; i <= pts; i++) {
      const th = (i / pts) * Math.PI * 2
      const rr = r * (0.18 + 0.82 * Math.abs(Math.cos((n * th) / 2)) ** k)
      const x = rr * Math.cos(th)
      const y = rr * Math.sin(th)
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)
    }
    return d + 'Z'
  }
  for (const p of $$('.lobe')) p.setAttribute('d', lobePath(Number(p.dataset.lobe)))

  // ---- Scroll reveal
  const reveals = $$('.reveal')
  if (reduced || !('IntersectionObserver' in window)) reveals.forEach((el) => el.classList.add('is-in'))
  else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    )
    reveals.forEach((el) => io.observe(el))
  }

  // ---- Counters in the hero facts
  const count = (el) => {
    const to = Number(el.dataset.count)
    if (reduced) return (el.textContent = String(to))
    const t0 = performance.now()
    const dur = 1200
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur)
      el.textContent = String(Math.round(to * (1 - (1 - p) ** 3)))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }
  const facts = $('.hero__facts')
  if (facts) {
    if (reduced || !('IntersectionObserver' in window)) $$('[data-count]', facts).forEach(count)
    else {
      const io = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) {
          $$('[data-count]', facts).forEach(count)
          io.disconnect()
        }
      })
      io.observe(facts)
    }
  }

  // ---- Stepper: the active step advances by itself until the visitor hovers or clicks one.
  const steps = $$('[data-step]')
  if (steps.length) {
    let i = 0
    let timer = null
    const activate = (k) => {
      i = k
      steps.forEach((s, j) => s.classList.toggle('is-active', j === k))
    }
    const start = () => {
      if (reduced || timer) return
      timer = setInterval(() => activate((i + 1) % steps.length), 2600)
    }
    const stop = () => {
      clearInterval(timer)
      timer = null
    }
    steps.forEach((s, k) => {
      s.addEventListener('mouseenter', () => {
        stop()
        activate(k)
      })
      s.addEventListener('click', () => {
        stop()
        activate(k)
      })
      s.addEventListener('focusin', () => {
        stop()
        activate(k)
      })
      s.tabIndex = 0
    })
    const list = $('[data-steps]')
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop())), { threshold: 0.3 })
      io.observe(list)
    } else start()
  }

  // ---- Pricing: monthly / yearly
  let billing = 'month'
  const updatePrice = () => {
    const amount = $('[data-price-month]')
    if (!amount) return
    amount.textContent = billing === 'month' ? amount.dataset.priceMonth : amount.dataset.priceYear
    $('[data-per-month]').hidden = billing !== 'month'
    $('[data-per-year]').hidden = billing !== 'year'
    for (const b of $$('[data-billing]')) {
      const on = b.dataset.billing === billing
      b.classList.toggle('is-active', on)
      b.setAttribute('aria-pressed', String(on))
    }
    const sel = $('select[name=plan]')
    if (sel) sel.value = billing === 'month' ? 'monthly' : 'yearly'
  }
  for (const b of $$('[data-billing]'))
    b.addEventListener('click', () => {
      billing = b.dataset.billing
      updatePrice()
    })

  // ---- Waitlist: a prefilled mail, nothing stored here.
  const form = $('[data-waitlist]')
  form?.addEventListener('submit', (e) => {
    e.preventDefault()
    const l = document.documentElement.lang
    const t = { ...dict.en, ...(dict[l] || {}) }
    const name = form.name.value.trim() || '—'
    const email = form.email.value.trim()
    const plan = form.plan.options[form.plan.selectedIndex].text
    const body = t['waitlist.body'].replace('{plan}', plan).replace('{name}', name).replace('{email}', email)
    location.href = `mailto:${WAITLIST_TO}?subject=${encodeURIComponent(t['waitlist.subject'])}&body=${encodeURIComponent(body)}`
    const msg = $('.waitlist__msg', form)
    msg.textContent = ''
    msg.append(t['waitlist.ok'])
    const a = document.createElement('a')
    a.href = `mailto:${WAITLIST_TO}`
    a.textContent = WAITLIST_TO
    msg.append(a, '.')
  })

  // ---- App link: the deployed app lives next to the site as /app/; override with ?app=URL while that is not live yet.
  const appUrl = new URLSearchParams(location.search).get('app')
  if (appUrl) for (const a of $$('[data-app-link]')) a.href = appUrl

  const year = $('[data-year]')
  if (year) year.textContent = String(new Date().getFullYear())

  setLang(lang)
})()
