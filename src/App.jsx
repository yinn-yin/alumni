import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, ArrowDownToLine, ArrowRight, Bell, BriefcaseBusiness, Building2, CalendarDays, ChartNoAxesColumnIncreasing, ChevronDown, Eye, FileSpreadsheet, GraduationCap, LayoutDashboard, Mail, Pencil, Plus, Search, Settings, ShieldCheck, SlidersHorizontal, UsersRound, X } from 'lucide-react'
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react'
import './App.css'

const graduateNames = [
  'Al-Phyne Albert Resbicios',
  'Alexandra Reblora',
  'Arvin Garcia',
  'Brigette Alindayu',
  'Cliff Acer Del Rosario',
  'Gerel Peralta',
  'Jampol Martinez',
  'John Carlo Agbayani',
  'Kathleen Garan',
  'Kimberly Luzano',
  'Knole Anne C. Gungon',
  'Marc Sherwin Goronia',
  'Marko Marzo',
  'Marvin Pitacio',
  'Regine Mata',
  'Ruben Pencaíla',
  'Sean Antonio',
  'Steven Villota',
  'Vincent Benitez',
]
const avatarColors = ['coral', 'blue', 'yellow', 'green', 'pink', 'purple', 'orange', 'teal']
const graduateProgram = 'Bachelor of Science in Information Technology (BSIT)'
const graduationYear = 2025
const starterGraduates = graduateNames.map((name, index) => {
  const emailName = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')
  return {
    id: index + 1,
    name,
    email: `${emailName}.${String(index + 1).padStart(2, '0')}@example.com`,
    program: graduateProgram,
    year: graduationYear,
    academicBackground: 'Not specified',
    status: 'Unreported',
    role: '-',
    employer: '-',
    location: '-',
    color: avatarColors[index % avatarColors.length],
  }
})
const graduateStorageVersion = '4'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Graduates', icon: UsersRound },
  { label: 'Outcomes', icon: BriefcaseBusiness },
  { label: 'Reports', icon: Activity },
  { label: 'Settings', icon: Settings },
]

const dateFormatter = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
const currentYear = new Date().getFullYear()
const motionEase = [0.2, 0.75, 0.25, 1]

function MotionButton({ children, ...props }) {
  return <motion.button whileTap={{ scale: 0.98 }} transition={{ duration: 0.12, ease: motionEase }} {...props}>{children}</motion.button>
}

function getOutcomeSummary(counts, total) {
  const categories = [
    { label: 'Employed', count: counts.employed, className: 'employed' },
    { label: 'Further study', count: counts.furtherStudy, className: 'further-study' },
    { label: 'Seeking work', count: counts.seekingWork, className: 'seeking-work' },
    { label: 'Unreported', count: counts.unreported, className: 'unreported' },
  ]
  const shares = categories.map((category) => {
    const exact = total ? (category.count / total) * 100 : 0
    return { ...category, exact, percentage: Math.floor(exact) }
  })
  const remainingPoints = total ? 100 - shares.reduce((sum, category) => sum + category.percentage, 0) : 0
  const roundedUp = new Set(
    [...shares]
      .sort((a, b) => (b.exact - b.percentage) - (a.exact - a.percentage))
      .slice(0, remainingPoints)
      .map((category) => category.label),
  )

  return shares.map(({ label, count, className, percentage }) => ({
    label,
    count,
    className,
    percentage: percentage + Number(roundedUp.has(label)),
  }))
}

function getLegacyGraduates() {
  const stored = localStorage.getItem('alumni-tracker-graduates')
  if (stored === null) return starterGraduates

  let graduates
  try {
    graduates = JSON.parse(stored)
  } catch {
    throw new Error('Saved browser records could not be read for migration.')
  }
  if (!Array.isArray(graduates)) {
    throw new Error('Saved browser records are not a valid graduate list.')
  }
  if (localStorage.getItem('alumni-tracker-data-version') === graduateStorageVersion) {
    return graduates
  }

  return graduates.map((graduate) => ({
    ...graduate,
    program: graduateProgram,
    year: graduationYear,
    academicBackground: graduate.academicBackground ?? 'Not specified',
  }))
}

async function requestApi(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error('The PHP API returned an invalid response. Check that the backend is running.')
  }
  if (!response.ok) {
    throw new Error(payload.error ?? `The API request failed (${response.status}).`)
  }
  return payload
}

function graduateList(payload) {
  if (!Array.isArray(payload.data)) {
    throw new Error('The PHP API returned an invalid graduate list.')
  }
  return payload.data
}

function App() {
  const reduceMotion = useReducedMotion()
  const [graduates, setGraduates] = useState([])
  const [databaseLoading, setDatabaseLoading] = useState(true)
  const [databaseError, setDatabaseError] = useState('')
  const [databaseRetry, setDatabaseRetry] = useState(0)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [activePage, setActivePage] = useState('Overview')
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('All years')
  const [statusFilter, setStatusFilter] = useState('All outcomes')
  const [editing, setEditing] = useState(null)
  const [profileGraduate, setProfileGraduate] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [savingGraduate, setSavingGraduate] = useState(false)
  const [toast, setToast] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationRef = useRef(null)
  const notificationButtonRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function loadGraduates() {
      setDatabaseLoading(true)
      setDatabaseError('')
      try {
        let records = graduateList(await requestApi('/api/graduates'))
        if (records.length === 0 && localStorage.getItem('alumni-tracker-mysql-migrated') !== 'true') {
          const imported = await requestApi('/api/graduates/import', {
            method: 'POST',
            body: JSON.stringify({ graduates: getLegacyGraduates() }),
          })
          records = graduateList(imported)
        }
        try {
          localStorage.setItem('alumni-tracker-mysql-migrated', 'true')
        } catch (error) {
          console.warn('Could not save the browser migration marker.', error)
        }
        if (!cancelled) setGraduates(records)
      } catch (error) {
        if (!cancelled) {
          setDatabaseError(error instanceof Error ? error.message : 'Could not load graduates from MySQL.')
        }
      } finally {
        if (!cancelled) setDatabaseLoading(false)
      }
    }

    loadGraduates()
    return () => {
      cancelled = true
    }
  }, [databaseRetry])

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    if (!notificationsOpen) return undefined
    const closeOnPointerDown = (event) => {
      if (!notificationRef.current?.contains(event.target)) setNotificationsOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false)
        notificationButtonRef.current?.focus()
      }
    }
    window.addEventListener('pointerdown', closeOnPointerDown)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('pointerdown', closeOnPointerDown)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [notificationsOpen])

  const filtered = useMemo(() => graduates.filter((graduate) => {
    const query = search.trim().toLowerCase()
    const searchable = [graduate.name, graduate.email, graduate.program, graduate.employer, graduate.role].join(' ').toLowerCase()
    return (!query || searchable.includes(query)) && (yearFilter === 'All years' || String(graduate.year) === yearFilter) && (statusFilter === 'All outcomes' || graduate.status === statusFilter)
  }), [graduates, search, statusFilter, yearFilter])

  const outcomeCounts = {
    employed: graduates.filter((graduate) => graduate.status === 'Employed').length,
    furtherStudy: graduates.filter((graduate) => graduate.status === 'Further study').length,
    seekingWork: graduates.filter((graduate) => graduate.status === 'Seeking work').length,
    unreported: graduates.filter((graduate) => graduate.status === 'Unreported').length,
  }
  const pendingOutcomes = outcomeCounts.unreported
  const outcomeSummary = getOutcomeSummary(outcomeCounts, graduates.length)
  const outcomeRate = (count) => graduates.length ? Math.round((count / graduates.length) * 100) : 0
  const classOutcomes = [...graduates.reduce((years, graduate) => {
    const year = years.get(graduate.year) ?? { year: graduate.year, total: 0, employed: 0, furtherStudy: 0, seekingWork: 0, unreported: 0 }
    year.total += 1
    if (graduate.status === 'Employed') year.employed += 1
    if (graduate.status === 'Further study') year.furtherStudy += 1
    if (graduate.status === 'Seeking work') year.seekingWork += 1
    if (graduate.status === 'Unreported') year.unreported += 1
    years.set(graduate.year, year)
    return years
  }, new Map()).values()].sort((a, b) => b.year - a.year)
  const programOutcomes = [...graduates.reduce((programs, graduate) => {
    const program = programs.get(graduate.program) ?? { name: graduate.program, total: 0, employed: 0 }
    program.total += 1
    if (graduate.status === 'Employed') program.employed += 1
    programs.set(graduate.program, program)
    return programs
  }, new Map()).values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  const pageHeading = {
    Overview: ['Overview', 'A clear view of your alumni community and graduate outcomes.'],
    Graduates: ['Graduate directory', 'Manage graduate records, contact details, and destinations.'],
    Outcomes: ['Graduate outcomes', 'Explore employment and study destinations by cohort.'],
    Reports: ['Reports & analytics', 'Review cohort performance and export your graduate data.'],
    Settings: ['Settings', 'Manage your directory preferences and data workspace.'],
  }[activePage]

  function openForm(graduate = null) {
    setProfileGraduate(null)
    setEditing(graduate)
    setFormError('')
    setModalOpen(true)
  }

  async function saveGraduate(event) {
    event.preventDefault()
    setFormError('')
    const form = new FormData(event.currentTarget)
    const updated = {
      name: form.get('name').trim(), email: form.get('email').trim(),
      program: form.get('program').trim(), year: Number(form.get('year')), status: form.get('status'),
      academicBackground: form.get('academicBackground'),
      role: form.get('role').trim() || '-', employer: form.get('employer').trim() || '-',
      location: form.get('location').trim() || '-', color: editing?.color ?? ['coral', 'blue', 'yellow', 'green', 'pink', 'purple'][graduates.length % 6],
    }
    setSavingGraduate(true)
    try {
      const saved = await requestApi(
        editing ? `/api/graduates?id=${encodeURIComponent(editing.id)}` : '/api/graduates',
        { method: editing ? 'PUT' : 'POST', body: JSON.stringify(updated) },
      )
      if (!saved.data || typeof saved.data.id !== 'number') {
        throw new Error('The PHP API did not return the saved graduate record.')
      }

      setGraduates((current) => editing
        ? current.map((item) => item.id === editing.id ? saved.data : item)
        : [saved.data, ...current])
      setModalOpen(false)
      setEditing(null)
      setToast(editing ? 'Graduate record updated' : 'Graduate added to your records')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save this graduate record.')
    } finally {
      setSavingGraduate(false)
    }
  }

  function exportCsv(records = filtered, filename = 'alumni-graduate-records.csv', message = 'Graduate records exported') {
    const columns = ['Name', 'Email', 'Program', 'Graduation year', 'Academic background', 'Outcome', 'Role', 'Employer', 'Location']
    const values = records.map(({ name, email, program, year, academicBackground, status, role, employer, location }) => [name, email, program, year, academicBackground ?? 'Not specified', status, role, employer, location])
    const csv = [columns, ...values].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
    setToast(message)
  }

  function clearFilters() {
    setYearFilter('All years')
    setStatusFilter('All outcomes')
    setSearch('')
  }

  function exportOutcomesCsv() {
    const columns = ['Graduation year', 'Graduates', 'Employed', 'Further study', 'Seeking work', 'Unreported', 'Employed rate']
    const years = [...new Set(graduates.map(({ year }) => year).filter(Number.isFinite))].sort((a, b) => b - a)
    const values = years.map((year) => {
      const cohort = graduates.filter((graduate) => graduate.year === year)
      const employed = cohort.filter((graduate) => graduate.status === 'Employed').length
      return [
        year,
        cohort.length,
        employed,
        cohort.filter((graduate) => graduate.status === 'Further study').length,
        cohort.filter((graduate) => graduate.status === 'Seeking work').length,
        cohort.filter((graduate) => graduate.status === 'Unreported').length,
        `${Math.round((employed / cohort.length) * 100)}%`,
      ]
    })
    const csv = [columns, ...values].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    link.download = 'alumni-outcomes-by-class.csv'
    link.click()
    URL.revokeObjectURL(link.href)
    setToast('Class outcomes exported')
  }

  function renderDirectory(title, description, limit = null) {
    const rows = limit ? filtered.slice(0, limit) : filtered
    const firstRow = rows.length ? 1 : 0
    const lastRow = rows.length

    return (
      <section className={`directory-panel ${limit ? 'directory-preview' : 'directory-full'}`}>
        <div className="directory-heading">
          <div>
            <div className="directory-title"><h2>{title}</h2><span className="record-count">{filtered.length}</span></div>
            <p>{description}</p>
          </div>
          {limit && <button className="text-button" onClick={() => setActivePage('Graduates')}>All graduates <ArrowRight size={15} /></button>}
        </div>
        <div className="table-toolbar">
          <div className="table-filters">
            <label className="filter-search"><Search size={15} /><input aria-label="Search graduate records" placeholder="Search by name or email..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <label className="filter-select"><select aria-label="Filter by graduation year" value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}><option>All years</option>{[...new Set(graduates.map(({ year }) => year).filter(Number.isFinite))].sort((a, b) => b - a).map((year) => <option key={year}>{year}</option>)}</select><ChevronDown size={14} /></label>
            <label className="filter-select"><select aria-label="Filter by outcome" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All outcomes</option><option>Employed</option><option>Further study</option><option>Seeking work</option><option>Unreported</option></select><ChevronDown size={14} /></label>
          </div>
          <button className="filter-button" onClick={clearFilters} aria-label="Clear all filters"><SlidersHorizontal size={16} /><span>Clear</span></button>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>GRADUATE NAME</th><th>EMAIL ADDRESS</th><th>PROGRAM</th><th>YEAR GRADUATED</th><th>ACADEMIC BACKGROUND</th><th>EMPLOYMENT OUTCOME</th><th>ROLE &amp; ORGANIZATION</th><th>ACTIONS</th></tr></thead>
            <tbody>
              {rows.map((graduate, index) => (
                <tr key={graduate.id} className="result-row" style={{ animationDelay: `${index * 35}ms` }}>
                  <td><div className="graduate-cell"><span className={`graduate-avatar avatar-${graduate.color}`}>{graduate.name.split(' ').map((part) => part[0]).join('')}</span><button className="graduate-name-link" onClick={() => setProfileGraduate(graduate)}>{graduate.name}</button></div></td>
                  <td><span className="email-address">{graduate.email}</span></td>
                  <td><span className="program-name">{graduate.program}</span></td>
                  <td><span className="class-year">{graduate.year ?? '—'}</span></td>
                  <td><span className={`academic-honor${graduate.academicBackground === 'Not specified' ? ' academic-honor-unreported' : ''}`}>{graduate.academicBackground ?? 'Not specified'}</span></td>
                  <td><span className={`outcome-pill ${graduate.status.toLowerCase().replace(' ', '-')}`}><i />{graduate.status === 'Further study' ? 'Further Studies' : graduate.status}</span></td>
                  <td><span className="job-title">{graduate.role}</span><small className="employer-name">{graduate.employer}</small></td>
                  <td><div className="table-actions"><button className="row-action" aria-label={`View ${graduate.name}`} onClick={() => setProfileGraduate(graduate)}><Eye size={16} /></button><button className="row-action" aria-label={`Edit ${graduate.name}`} onClick={() => openForm(graduate)}><Pencil size={15} /></button></div></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="empty-state" colSpan="8">
                    <Search size={19} />
                    <strong>{activePage === 'Outcomes' && statusFilter !== 'All outcomes' ? 'No graduates have this outcome yet' : 'No graduates found'}</strong>
                    <span>{activePage === 'Outcomes' && statusFilter !== 'All outcomes' ? 'Choose another destination to see its records.' : 'Try adjusting your search or filters.'}</span>
                    {activePage === 'Outcomes' && statusFilter !== 'All outcomes' && <button className="text-button empty-action" onClick={() => setStatusFilter('All outcomes')}>Show all outcomes</button>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Showing <strong>{firstRow}-{lastRow}</strong> of <strong>{filtered.length}</strong> matching graduates</span>
          {!limit && <MotionButton className="button button-subtle" onClick={() => exportCsv()}><ArrowDownToLine size={15} /> Export CSV</MotionButton>}
        </div>
      </section>
    )
  }

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.18, ease: motionEase }}>
    <div className="app-shell">
      <nav className="floating-nav" id="primary-navigation" aria-label="Main navigation">
        {navItems.map(({ label, icon: Icon }) => (
          <button key={label} className={`nav-item ${activePage === label ? 'active' : ''}`} aria-current={activePage === label ? 'page' : undefined} onClick={() => setActivePage(label)}>
            <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            {label === 'Graduates' && <span className="nav-count">{graduates.length}</span>}
          </button>
        ))}
      </nav>

      <main className="main-area">
        <header className="topbar">
          <a className="topbar-brand" href="#overview" onClick={() => setActivePage('Overview')}><span className="brand-mark"><GraduationCap size={18} /></span><strong>Alumni</strong></a>
          <div className="topbar-actions">
            <label className="global-search"><Search size={16} /><input aria-label="Search graduates globally" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search graduates..." /><kbd>⌘ K</kbd></label>
            <div className="notification-wrap" ref={notificationRef}>
              <button
                ref={notificationButtonRef}
                className="icon-button notification-button"
                aria-label={pendingOutcomes ? `Notifications, ${pendingOutcomes} graduate outcomes need review` : 'Notifications'}
                aria-haspopup="dialog"
                aria-expanded={notificationsOpen}
                aria-controls="notification-panel"
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell size={18} />
                {pendingOutcomes > 0 && <span className="notification-count">{pendingOutcomes > 99 ? '99+' : pendingOutcomes}</span>}
              </button>
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    id="notification-panel"
                    className="notification-popover"
                    role="dialog"
                    aria-labelledby="notification-title"
                    initial={{ opacity: 0, y: reduceMotion ? 0 : -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduceMotion ? 0 : -5 }}
                    transition={{ duration: reduceMotion ? 0.12 : 0.16, ease: motionEase }}
                  >
                    <div className="notification-popover-header">
                      <div><h2 id="notification-title">Notifications</h2><p>{pendingOutcomes ? 'Needs your attention' : "You're all caught up"}</p></div>
                      <button className="icon-button notification-close" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)}><X size={16} /></button>
                    </div>
                    {pendingOutcomes > 0 ? (
                      <button
                        className="notification-item"
                        onClick={() => {
                          clearFilters()
                          setStatusFilter('Unreported')
                          setActivePage('Outcomes')
                          setNotificationsOpen(false)
                          notificationButtonRef.current?.focus()
                        }}
                      >
                        <span className="notification-item-icon"><UsersRound size={17} /></span>
                        <span className="notification-item-copy">
                          <strong>Graduate outcomes need updating</strong>
                          <span>{pendingOutcomes} graduate {pendingOutcomes === 1 ? 'record is' : 'records are'} marked as unreported.</span>
                          <small>Review outcomes <ArrowRight size={13} /></small>
                        </span>
                      </button>
                    ) : (
                      <div className="notification-empty"><ShieldCheck size={18} /><span>No outstanding graduate updates.</span></div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="topbar-datetime">
              <span className="topbar-date">{dateFormatter.format(currentTime)}</span>
              <time className="topbar-time" dateTime={currentTime.toISOString()}>{timeFormatter.format(currentTime)}</time>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activePage}
          className="page-content"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.18, ease: motionEase }}
        >
          <section className="page-heading">
            <div className="page-heading-copy"><h1>{pageHeading[0]}</h1><p>{pageHeading[1]}</p></div>
            {activePage === 'Overview' || activePage === 'Graduates'
              ? <MotionButton className="button button-primary" disabled={databaseLoading || Boolean(databaseError)} onClick={() => openForm()}><Plus size={17} /> Add graduate</MotionButton>
              : activePage === 'Outcomes'
                ? <MotionButton className="button button-primary" onClick={() => setActivePage('Graduates')}>Browse graduates <ArrowRight size={16} /></MotionButton>
                : activePage === 'Settings'
                  ? <MotionButton className="button button-subtle" onClick={() => exportCsv(graduates, 'alumni-graduate-register.csv', 'Graduate register exported')}><ArrowDownToLine size={16} /> Export records</MotionButton>
                : null}
          </section>
          {databaseLoading && <div className="database-notice" role="status">Connecting to the MySQL database…</div>}
          {databaseError && (
            <div className="database-notice database-notice-error" role="alert">
              <div><strong>Could not load graduate records</strong><span>{databaseError}</span></div>
              <MotionButton className="button button-subtle" onClick={() => setDatabaseRetry((attempt) => attempt + 1)}>Retry</MotionButton>
            </div>
          )}
          {activePage === 'Overview' && (
            <>
              <motion.section className="summary-strip" aria-label="Graduate summary statistics">
                {[
                  { label: 'Total Graduates', value: graduates.length, note: 'Records in directory' },
                  { label: 'Employed', value: outcomeCounts.employed, note: `${outcomeRate(outcomeCounts.employed)}% of graduates` },
                  { label: 'Further Studies', value: outcomeCounts.furtherStudy, note: `${outcomeRate(outcomeCounts.furtherStudy)}% of graduates` },
                  { label: 'Seeking Work', value: outcomeCounts.seekingWork, note: `${outcomeRate(outcomeCounts.seekingWork)}% of graduates` },
                  { label: 'Unreported', value: outcomeCounts.unreported, note: `${outcomeRate(outcomeCounts.unreported)}% of graduates` },
                ].map(({ label, value, note }, index) => (
                  <motion.div
                    className="summary-stat-item"
                    key={label}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0.12 : 0.22, delay: index * 0.035, ease: motionEase }}
                  >
                    <span className="metric-label">{label}</span>
                    <strong className="metric-value">{value.toLocaleString()}</strong>
                    <span className="metric-note">{note}</span>
                  </motion.div>
                ))}
              </motion.section>
              <motion.section
                className="overview-analytics"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.24, delay: 0.06, ease: motionEase }}
              >
                <motion.article className="chart-card" whileHover={reduceMotion ? undefined : { y: -2 }}>
                  <div className="panel-heading">
                    <div><span className="eyebrow">DESTINATIONS</span><h2>Outcome distribution</h2><p>Reported first destinations across the directory.</p></div>
                    <div className="chart-total"><strong>{graduates.length}</strong><span>graduates</span></div>
                  </div>
                  <div className="outcome-bar" role="img" aria-label={outcomeSummary.map(({ label, percentage }) => `${label}: ${percentage}%`).join(', ')}>
                    {outcomeSummary.filter(({ count }) => count > 0).map(({ label, className, percentage }) => (
                      <span key={label} className={`outcome-segment ${className}`} style={{ width: `${percentage}%` }} title={`${label}: ${percentage}%`} />
                    ))}
                  </div>
                  <div className="chart-legend">
                    {outcomeSummary.map(({ label, count, className, percentage }) => (
                      <div className="chart-legend-item" key={label}><span className={`outcome-key ${className}`} /><span>{label === 'Further study' ? 'Further Studies' : label}</span><strong>{count}</strong><small>{percentage}%</small></div>
                    ))}
                  </div>
                </motion.article>
                <motion.article className="cohort-card" whileHover={reduceMotion ? undefined : { y: -2 }}>
                  <div className="panel-heading">
                    <div><span className="eyebrow">CLASS PROFILE</span><h2>Graduates by year</h2><p>Records grouped by graduation year.</p></div>
                    <CalendarDays size={19} className="muted-icon" />
                  </div>
                  {classOutcomes.length ? classOutcomes.map(({ year, total }) => (
                    <div className="cohort-row" key={year}>
                      <div className="cohort-label"><strong>Class of {year}</strong><span>{total} graduates</span></div>
                      <div className="cohort-track"><i style={{ width: `${graduates.length ? (total / graduates.length) * 100 : 0}%` }} /></div>
                    </div>
                  )) : <p className="empty-copy">Graduation year data will appear here.</p>}
                  <div className="cohort-footnote"><span>Program</span><strong>{programOutcomes.length === 1 ? programOutcomes[0].name : `${programOutcomes.length} programs`}</strong></div>
                </motion.article>
              </motion.section>
              <div className="section-heading"><div><span className="eyebrow">DIRECTORY</span><h2>Recently added graduates</h2></div><button className="text-button" onClick={() => setActivePage('Graduates')}>View all graduates <ArrowRight size={16} /></button></div>
              {renderDirectory('Graduate records', 'A snapshot of your most recent graduate records.', 5)}
            </>
          )}

          {activePage === 'Graduates' && (
            <section className="graduate-index">
              <div className="directory-summary-card">
                <div className="summary-icon"><UsersRound size={19} /></div>
                <div><strong>{graduates.length} graduate records</strong><span>BSIT · Class of 2025</span></div>
                <span className="summary-card-note">Search, filter, view profiles, and update records.</span>
              </div>
              {renderDirectory('All graduates', 'Search, filter, and update your alumni records.')}
            </section>
          )}

          {activePage === 'Outcomes' && (
            <>
              <section className="outcomes-workspace" aria-label="Outcome analysis">
                <div className="outcomes-workspace-heading">
                  <div><h2>Where graduates land</h2><p>Choose an outcome to see the records behind it.</p></div>
                  <button className={`outcome-reset ${statusFilter === 'All outcomes' ? 'selected' : ''}`} onClick={() => setStatusFilter('All outcomes')}>All outcomes <span>{graduates.length}</span></button>
                </div>
                <div className="outcomes-analysis-grid">
                  <div className="outcome-breakdown">
                    {outcomeSummary.map(({ label, count, className, percentage }, index) => (
                      <button key={label} className={`outcome-row ${statusFilter === label ? 'selected' : ''}`} aria-pressed={statusFilter === label} onClick={() => setStatusFilter(statusFilter === label ? 'All outcomes' : label)} style={{ animationDelay: `${index * 60}ms` }}>
                        <span className={`outcome-key ${className}`} />
                        <span className="outcome-row-label">{label === 'Further study' ? 'Further Studies' : label}</span>
                        <span className="outcome-row-track"><i className={className} style={{ width: `${percentage}%` }} /></span>
                        <strong>{count}</strong>
                        <small>{percentage}%</small>
                      </button>
                    ))}
                  </div>
                  <div className="program-outcomes">
                    <h3>By program</h3>
                    <p>Employment within each field</p>
                    {programOutcomes.length ? programOutcomes.map(({ name, total, employed }, index) => (
                      <div className="program-outcome-row reveal-up" key={name} style={{ animationDelay: `${index * 60}ms` }}>
                        <div className="program-outcome-heading"><strong>{name}</strong><span>{employed} of {total}</span></div>
                        <div className="program-outcome-track" role="img" aria-label={`${name}: ${total ? Math.round((employed / total) * 100) : 0}% employed`}><i style={{ width: `${total ? Math.round((employed / total) * 100) : 0}%` }} /></div>
                      </div>
                    )) : <p className="program-empty">Add graduate records to see outcomes by program.</p>}
                  </div>
                </div>
              </section>
              {renderDirectory('Outcome records', statusFilter === 'All outcomes' ? 'Review first destinations across every graduate.' : `${statusFilter} records. Select an outcome above to change this view.`)}
            </>
          )}

          {activePage === 'Reports' && (
            <section className="reports-page">
              <div className="report-metrics">
                {[
                  { label: 'Employment rate', value: `${outcomeRate(outcomeCounts.employed)}%`, detail: `${outcomeCounts.employed} employed`, tone: 'green' },
                  { label: 'Further studies', value: `${outcomeRate(outcomeCounts.furtherStudy)}%`, detail: `${outcomeCounts.furtherStudy} graduates`, tone: 'blue' },
                  { label: 'Seeking work', value: `${outcomeRate(outcomeCounts.seekingWork)}%`, detail: `${outcomeCounts.seekingWork} graduates`, tone: 'orange' },
                  { label: 'Graduates tracked', value: graduates.length, detail: `${classOutcomes.length} graduating class${classOutcomes.length === 1 ? '' : 'es'}`, tone: 'navy' },
                ].map(({ label, value, detail, tone }) => (
                  <article className="report-metric-card" key={label}>
                    <span className={`report-metric-dot tone-${tone}`} />
                    <span className="report-metric-label">{label}</span>
                    <strong>{value}</strong>
                    <small>{detail}</small>
                  </article>
                ))}
              </div>
              <div className="report-analytics-grid">
                <article className="panel report-chart">
                  <div className="panel-heading"><div><span className="eyebrow">EMPLOYMENT OUTCOMES</span><h2>Destination breakdown</h2><p>Share of all graduates by reported status.</p></div><ChartNoAxesColumnIncreasing size={20} className="muted-icon" /></div>
                  <div className="report-breakdown">
                    {outcomeSummary.map(({ label, count, className, percentage }) => (
                      <div className="report-breakdown-row" key={label}>
                        <div className="report-breakdown-label"><span className={`outcome-key ${className}`} /><span>{label === 'Further study' ? 'Further Studies' : label}</span><strong>{count}</strong></div>
                        <div className="report-breakdown-track"><i className={className} style={{ width: `${percentage}%` }} /></div>
                        <small>{percentage}%</small>
                      </div>
                    ))}
                  </div>
                </article>
                <article className="panel report-chart">
                  <div className="panel-heading"><div><span className="eyebrow">GRADUATION COHORTS</span><h2>Graduates by year</h2><p>Class size and outcome mix by graduation year.</p></div><CalendarDays size={19} className="muted-icon" /></div>
                  {classOutcomes.length ? classOutcomes.map(({ year, total, employed, furtherStudy, seekingWork, unreported }) => (
                    <div className="year-report-row" key={year}>
                      <div className="year-report-heading"><strong>Class of {year}</strong><span>{total} graduates</span></div>
                      <div className="year-report-bar" role="img" aria-label={`Class of ${year}: ${total} graduates`}>
                        <i className="employed" style={{ width: `${graduates.length ? (employed / total) * 100 : 0}%` }} />
                        <i className="further-study" style={{ width: `${graduates.length ? (furtherStudy / total) * 100 : 0}%` }} />
                        <i className="seeking-work" style={{ width: `${graduates.length ? (seekingWork / total) * 100 : 0}%` }} />
                        <i className="unreported" style={{ width: `${graduates.length ? (unreported / total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  )) : <p className="empty-copy">Graduation year data will appear here.</p>}
                  <div className="year-legend"><span><i className="employed" /> Employed</span><span><i className="further-study" /> Further Studies</span><span><i className="seeking-work" /> Seeking Work</span><span><i className="unreported" /> Unreported</span></div>
                </article>
              </div>
              <div className="reports-heading"><div><span className="eyebrow">DATA EXPORTS</span><h2>Reports & exports</h2><p>Export the latest records loaded from the database.</p></div></div>
              <div className="report-list">
                <motion.article
                  className="report-option"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.2, ease: motionEase }}
                >
                  <div className="report-option-icon"><FileSpreadsheet size={19} /></div>
                  <div className="report-option-copy"><h3>Graduate register</h3><p>Every graduate, with contact, program, outcome, and employment details.</p><span className="report-meta">CSV file, {graduates.length} rows</span></div>
                  <MotionButton className="button button-subtle" onClick={() => exportCsv(graduates, 'alumni-graduate-register.csv', 'Graduate register exported')}><ArrowDownToLine size={15} /> Export register</MotionButton>
                </motion.article>
                <motion.article
                  className="report-option"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.2, delay: 0.06, ease: motionEase }}
                >
                  <div className="report-option-icon report-outcomes-icon"><BriefcaseBusiness size={19} /></div>
                  <div className="report-option-copy"><h3>Class outcomes</h3><p>Employment and study destinations grouped by graduation year.</p><span className="report-meta">CSV file, {[...new Set(graduates.map(({ year }) => year).filter(Number.isFinite))].length} classes</span></div>
                  <MotionButton className="button button-subtle" onClick={exportOutcomesCsv}><ArrowDownToLine size={15} /> Export outcomes</MotionButton>
                </motion.article>
              </div>
              <p className="reports-note">CSV files open in spreadsheet apps such as Excel and Google Sheets.</p>
            </section>
          )}
          {activePage === 'Settings' && (
            <section className="settings-page">
              <article className="panel settings-card">
                <div className="settings-card-heading">
                  <div className="settings-icon"><Settings size={19} /></div>
                  <div><span className="eyebrow">DIRECTORY</span><h2>Graduate directory</h2><p>Current cohort details used throughout your dashboard.</p></div>
                </div>
                <div className="settings-details">
                  <div><span>Registered graduates</span><strong>{graduates.length}</strong></div>
                  <div><span>Program</span><strong>{programOutcomes.length === 1 ? programOutcomes[0].name : `${programOutcomes.length} programs`}</strong></div>
                  <div><span>Graduation year</span><strong>{classOutcomes.length === 1 ? classOutcomes[0].year : `${classOutcomes.length} classes`}</strong></div>
                </div>
              </article>
              <article className="panel settings-card storage-card">
                <div className="settings-card-heading">
                  <div className="settings-icon storage-icon"><ShieldCheck size={19} /></div>
                  <div><span className="eyebrow">DATA & PRIVACY</span><h2>MySQL database</h2><p>Graduate records are stored in the connected MySQL database.</p></div>
                </div>
                <div className={`storage-status${databaseError ? ' storage-status-error' : ''}`}><span className="status-indicator" />{databaseLoading ? 'Connecting to the database…' : databaseError ? 'Database connection failed' : 'Connected · changes save to MySQL'}</div>
                <div className="settings-actions"><MotionButton className="button button-subtle" onClick={() => exportCsv(graduates, 'alumni-graduate-register.csv', 'Graduate register exported')}><ArrowDownToLine size={16} /> Export all records</MotionButton><span>Keep an exported copy for your records.</span></div>
              </article>
            </section>
          )}
          <footer className="page-footer"><span>Alumni Graduate Tracking</span><span>Graduate relations workspace</span></footer>
        </motion.div>
        </AnimatePresence>
      </main>
      <AnimatePresence>
      {profileGraduate && (
        <motion.div className="modal-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0.12 : 0.16, ease: motionEase }} onMouseDown={(event) => { if (event.target === event.currentTarget) setProfileGraduate(null) }}>
          <motion.section
            className="graduate-modal profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.98, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.98, y: reduceMotion ? 0 : 8 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.2, ease: motionEase }}
          >
            <div className="profile-header">
              <span className={`profile-large-avatar avatar-${profileGraduate.color}`}>{profileGraduate.name.split(' ').map((part) => part[0]).join('')}</span>
              <div className="profile-heading-copy"><span className="eyebrow">GRADUATE PROFILE</span><h2 id="profile-title">{profileGraduate.name}</h2><span className={`outcome-pill ${profileGraduate.status.toLowerCase().replace(' ', '-')}`}><i />{profileGraduate.status === 'Further study' ? 'Further Studies' : profileGraduate.status}</span></div>
              <button className="icon-button modal-close" aria-label="Close profile" onClick={() => setProfileGraduate(null)}><X size={19} /></button>
            </div>
            <div className="profile-details">
              <div className="profile-detail"><span><Mail size={15} /> Email address</span><strong>{profileGraduate.email}</strong></div>
              <div className="profile-detail"><span><GraduationCap size={15} /> Program</span><strong>{profileGraduate.program}</strong></div>
              <div className="profile-detail"><span><CalendarDays size={15} /> Graduation year</span><strong>{profileGraduate.year ?? '—'}</strong></div>
              <div className="profile-detail"><span><GraduationCap size={15} /> Academic background</span><strong>{profileGraduate.academicBackground ?? 'Not specified'}</strong></div>
              <div className="profile-detail"><span><BriefcaseBusiness size={15} /> Current job position</span><strong>{profileGraduate.role}</strong></div>
              <div className="profile-detail"><span><Building2 size={15} /> Company or organization</span><strong>{profileGraduate.employer}</strong></div>
              <div className="profile-detail"><span>Location</span><strong>{profileGraduate.location}</strong></div>
            </div>
            <div className="modal-actions"><MotionButton className="button button-subtle" onClick={() => setProfileGraduate(null)}>Close</MotionButton><MotionButton className="button button-primary" onClick={() => openForm(profileGraduate)}><Pencil size={15} /> Edit profile</MotionButton></div>
          </motion.section>
        </motion.div>
      )}
      </AnimatePresence>
      <AnimatePresence>
      {modalOpen && (
        <motion.div className="modal-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0.12 : 0.16, ease: motionEase }} onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false) }}>
          <motion.section
            className="graduate-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="graduate-modal-title"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.98, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.98, y: reduceMotion ? 0 : 8 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.2, ease: motionEase }}
          >
            <div className="modal-header">
              <div><span className="modal-icon"><GraduationCap size={19} /></span><h2 id="graduate-modal-title">{editing ? 'Edit graduate' : 'Add a graduate'}</h2><p>Keep their next chapter in view.</p></div>
              <button className="icon-button modal-close" aria-label="Close dialog" onClick={() => setModalOpen(false)}><X size={19} /></button>
            </div>
            <form onSubmit={saveGraduate}>
              <div className="form-grid">
                <label className="form-field form-full"><span>Full name</span><input name="name" required defaultValue={editing?.name ?? ''} placeholder="e.g. Alex Morgan" /></label>
                <label className="form-field form-full"><span>Email address</span><input name="email" type="email" required defaultValue={editing?.email ?? ''} placeholder="alex@email.edu" /></label>
                <label className="form-field form-full"><span>Program</span><input name="program" required defaultValue={editing?.program ?? ''} placeholder="e.g. Computer Science" /></label>
                <label className="form-field"><span>Graduation year</span><input name="year" type="number" min="1950" max="2100" required defaultValue={editing?.year ?? currentYear} /></label>
                <label className="form-field"><span>Current outcome</span><select name="status" defaultValue={editing?.status ?? 'Employed'}><option>Employed</option><option>Further study</option><option>Seeking work</option><option>Unreported</option></select></label>
                <label className="form-field form-full"><span>Academic background</span><select name="academicBackground" defaultValue={editing?.academicBackground ?? 'Not specified'}><option>Not specified</option><option>Cum Laude</option><option>Magna Cum Laude</option><option>Summa Cum Laude</option></select></label>
                <label className="form-field"><span>Role / course</span><input name="role" defaultValue={editing?.role === '-' ? '' : editing?.role ?? ''} placeholder="e.g. Product Designer" /></label>
                <label className="form-field"><span>Employer / institution</span><input name="employer" defaultValue={editing?.employer === '-' ? '' : editing?.employer ?? ''} placeholder="Organization name" /></label>
                <label className="form-field form-full"><span>Location</span><input name="location" defaultValue={editing?.location === '-' ? '' : editing?.location ?? ''} placeholder="City, State" /></label>
              </div>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <div className="modal-actions"><MotionButton type="button" className="button button-subtle" disabled={savingGraduate} onClick={() => setModalOpen(false)}>Cancel</MotionButton><MotionButton type="submit" className="button button-primary" disabled={savingGraduate}>{savingGraduate ? 'Saving…' : editing ? 'Save changes' : 'Add graduate'} {!savingGraduate && <ArrowRight size={16} />}</MotionButton></div>
            </form>
          </motion.section>
        </motion.div>
      )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <motion.div className="toast-message" role="status" initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduceMotion ? 0 : 8 }} transition={{ duration: reduceMotion ? 0.12 : 0.18, ease: motionEase }}><span className="toast-check">✓</span>{toast}</motion.div>}
      </AnimatePresence>
    </div>
    </MotionConfig>
  )
}

export default App
