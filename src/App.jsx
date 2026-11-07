import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownToLine, ArrowRight, Bell, BriefcaseBusiness, ChevronDown, CircleHelp, GraduationCap, LayoutDashboard, MoreHorizontal, Plus, Search, SlidersHorizontal, Sparkles, UsersRound, X } from 'lucide-react'
import './App.css'

const starterGraduates = [
  { id: 1, name: 'Amara Johnson', email: 'amara.johnson@email.edu', program: 'Computer Science', year: 2024, status: 'Employed', role: 'Product Designer', employer: 'Stripe', location: 'New York, NY', color: 'coral' },
  { id: 2, name: 'Ethan Chen', email: 'ethan.chen@email.edu', program: 'Business Analytics', year: 2024, status: 'Employed', role: 'Data Analyst', employer: 'Deloitte', location: 'Chicago, IL', color: 'blue' },
  { id: 3, name: 'Sofia Martinez', email: 'sofia.martinez@email.edu', program: 'Public Health', year: 2023, status: 'Further study', role: 'MPH Candidate', employer: 'Johns Hopkins', location: 'Baltimore, MD', color: 'yellow' },
  { id: 4, name: 'Noah Williams', email: 'noah.williams@email.edu', program: 'Mechanical Engineering', year: 2024, status: 'Seeking work', role: '-', employer: '-', location: 'Austin, TX', color: 'green' },
  { id: 5, name: 'Priya Patel', email: 'priya.patel@email.edu', program: 'Economics', year: 2022, status: 'Employed', role: 'Financial Associate', employer: 'JPMorgan Chase', location: 'Boston, MA', color: 'pink' },
  { id: 6, name: 'Lucas Brown', email: 'lucas.brown@email.edu', program: 'Graphic Design', year: 2023, status: 'Employed', role: 'Visual Designer', employer: 'Figma', location: 'San Francisco, CA', color: 'purple' },
  { id: 7, name: 'Zara Okafor', email: 'zara.okafor@email.edu', program: 'Environmental Science', year: 2021, status: 'Employed', role: 'Research Associate', employer: 'The Nature Conservancy', location: 'Portland, OR', color: 'orange' },
  { id: 8, name: 'Oliver Kim', email: 'oliver.kim@email.edu', program: 'Computer Science', year: 2023, status: 'Seeking work', role: '-', employer: '-', location: 'Seattle, WA', color: 'teal' },
]

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Graduates', icon: UsersRound },
  { label: 'Outcomes', icon: BriefcaseBusiness },
  { label: 'Reports', icon: Activity },
]

function getStoredGraduates() {
  try {
    return JSON.parse(localStorage.getItem('alumni-tracker-graduates')) || starterGraduates
  } catch {
    return starterGraduates
  }
}

function App() {
  const [graduates, setGraduates] = useState(getStoredGraduates)
  const [activePage, setActivePage] = useState('Overview')
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('All years')
  const [statusFilter, setStatusFilter] = useState('All outcomes')
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => localStorage.setItem('alumni-tracker-graduates', JSON.stringify(graduates)), [graduates])
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const filtered = useMemo(() => graduates.filter((graduate) => {
    const query = search.trim().toLowerCase()
    const searchable = [graduate.name, graduate.email, graduate.program, graduate.employer, graduate.role].join(' ').toLowerCase()
    return (!query || searchable.includes(query)) && (yearFilter === 'All years' || String(graduate.year) === yearFilter) && (statusFilter === 'All outcomes' || graduate.status === statusFilter)
  }), [graduates, search, statusFilter, yearFilter])

  const employed = graduates.filter((graduate) => graduate.status === 'Employed').length
  const employedRate = graduates.length ? Math.round((employed / graduates.length) * 100) : 0
  const pageHeading = {
    Overview: ['Alumni overview', 'A clearer picture of where your graduates are headed.'],
    Graduates: ['Graduate directory', 'Your graduate records, all in one place.'],
    Outcomes: ['Graduate outcomes', 'See how your alumni are building their next chapter.'],
    Reports: ['Reports and exports', 'Take your graduate data wherever it needs to go.'],
  }[activePage]

  function openForm(graduate = null) {
    setEditing(graduate)
    setModalOpen(true)
  }

  function saveGraduate(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const updated = {
      id: editing?.id ?? Date.now(), name: form.get('name').trim(), email: form.get('email').trim(),
      program: form.get('program').trim(), year: Number(form.get('year')), status: form.get('status'),
      role: form.get('role').trim() || '-', employer: form.get('employer').trim() || '-',
      location: form.get('location').trim() || '-', color: editing?.color ?? ['coral', 'blue', 'yellow', 'green', 'pink', 'purple'][graduates.length % 6],
    }
    setGraduates((current) => editing ? current.map((item) => item.id === editing.id ? updated : item) : [updated, ...current])
    setModalOpen(false)
    setEditing(null)
    setToast(editing ? 'Graduate record updated' : 'Graduate added to your records')
  }

  function exportCsv() {
    const columns = ['Name', 'Email', 'Program', 'Graduation year', 'Outcome', 'Role', 'Employer', 'Location']
    const values = filtered.map(({ name, email, program, year, status, role, employer, location }) => [name, email, program, year, status, role, employer, location])
    const csv = [columns, ...values].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    link.download = 'alumni-graduate-records.csv'
    link.click()
    URL.revokeObjectURL(link.href)
    setToast('Graduate records exported')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setActivePage('Overview')}>
          <span className="brand-mark"><GraduationCap size={21} strokeWidth={2.2} /></span>
          <span>alumni<span className="brand-dot">.</span></span>
        </a>

        <div className="workspace-switcher">
          <div className="school-avatar">N</div>
          <div className="workspace-copy"><strong>Northstar University</strong><span>Alumni relations</span></div>
          <ChevronDown size={15} />
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activePage === label ? 'active' : ''}`} onClick={() => setActivePage(label)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {label === 'Graduates' && <span className="nav-count">{graduates.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><CircleHelp size={17} /></div>
            <div><strong>Need a hand?</strong><span>Visit the help center</span></div>
            <ArrowRight size={15} />
          </div>
          <button className="profile-button">
            <span className="profile-avatar">MC</span>
            <span className="profile-copy"><strong>Maya Chen</strong><small>Administrator</small></span>
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><GraduationCap size={19} /></span>alumni<span className="brand-dot">.</span></div>
          <div className="breadcrumbs">Workspace <span>/</span> <strong>{activePage}</strong></div>
          <div className="topbar-actions">
            <label className="global-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search graduates..." /><kbd>⌘ K</kbd></label>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><span /></button>
            <span className="topbar-divider" />
            <span className="topbar-date">Friday, November 6</span>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div><div className="eyebrow"><Sparkles size={13} /> YOUR ALUMNI, IN FOCUS</div><h1>{pageHeading[0]}</h1><p>{pageHeading[1]}</p></div>
            <button className="button button-primary" onClick={() => openForm()}><Plus size={17} /> Add graduate</button>
          </section>
          <section className="stats-grid" aria-label="Graduate outcomes summary">
            <article className="stat-card stat-card-primary"><div className="stat-top"><span>Total graduates</span><span className="stat-icon"><UsersRound size={17} /></span></div><div className="stat-value">{graduates.length.toLocaleString()}</div><div className="stat-foot"><span className="trend-up">+12.8%</span><span>vs. last year</span></div><div className="stat-sparkline"><svg viewBox="0 0 170 34" preserveAspectRatio="none" aria-hidden="true"><path d="M0 29 C16 27 15 18 31 21 S48 26 61 17 S83 23 98 12 S117 18 130 10 S150 16 170 3" /></svg></div></article>
            <article className="stat-card"><div className="stat-top"><span>Employed</span><span className="stat-icon icon-mint"><BriefcaseBusiness size={17} /></span></div><div className="stat-value">{employedRate}<small>%</small></div><div className="stat-foot"><span className="trend-up">+4.2%</span><span>placement rate</span></div><div className="progress-track"><span style={{ width: `${employedRate}%` }} /></div></article>
            <article className="stat-card"><div className="stat-top"><span>Further study</span><span className="stat-icon icon-gold"><GraduationCap size={18} /></span></div><div className="stat-value">{graduates.filter((item) => item.status === 'Further study').length}<small className="stat-suffix">graduates</small></div><div className="stat-foot"><span className="neutral-change">Across 3 programs</span></div><div className="mini-bars" aria-hidden="true">{[25, 45, 37, 58, 43, 69, 54, 75, 62, 83, 71, 94].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></article>
            <article className="stat-card"><div className="stat-top"><span>Seeking work</span><span className="stat-icon icon-coral"><Activity size={17} /></span></div><div className="stat-value">{graduates.filter((item) => item.status === 'Seeking work').length}<small className="stat-suffix">graduates</small></div><div className="stat-foot"><span className="trend-down">Needs follow-up</span></div><div className="stat-note"><span className="status-dot" /> Reach out to your graduates</div></article>
          </section>

          <section className="insights-grid">
            <article className="panel outcomes-panel"><div className="panel-heading"><div><h2>Graduate outcomes</h2><p>First destination by graduating class</p></div><button className="select-button">Last 6 years <ChevronDown size={14} /></button></div><div className="chart-legend"><span><i className="legend-dot legend-green" />Employed</span><span><i className="legend-dot legend-yellow" />Further study</span><span><i className="legend-dot legend-gray" />Other</span></div><div className="chart-wrap"><div className="chart-y-labels"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-main"><div className="chart-gridlines"><i /><i /><i /><i /><i /></div><svg className="outcome-chart" viewBox="0 0 600 180" preserveAspectRatio="none" role="img" aria-label="Employment outcome trend improving from 2019 to 2024"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#53aa83" stopOpacity=".22" /><stop offset="100%" stopColor="#53aa83" stopOpacity="0" /></linearGradient></defs><path className="chart-area" d="M0 130 C37 123 48 110 86 115 S134 95 171 99 S224 74 258 82 S308 68 342 62 S390 76 429 52 S482 40 514 43 S561 20 600 14 L600 180 L0 180 Z" /><path className="chart-line" d="M0 130 C37 123 48 110 86 115 S134 95 171 99 S224 74 258 82 S308 68 342 62 S390 76 429 52 S482 40 514 43 S561 20 600 14" /><circle cx="600" cy="14" r="4.5" /></svg><div className="chart-x-labels"><span>2019</span><span>2020</span><span>2021</span><span>2022</span><span>2023</span><span>2024</span></div></div></div></article>
            <article className="panel cohorts-panel"><div className="panel-heading"><div><h2>By graduating class</h2><p>Employment rate over time</p></div><button className="icon-button more-button" aria-label="More cohort options"><MoreHorizontal size={19} /></button></div><div className="cohort-chart" aria-label="Employment rates by graduating cohort">{[42, 51, 47, 64, 59, 73, 68, 81, 76, 88, 84, 96].map((value, index) => <div className="cohort-column" key={index}><span className="cohort-value">{value}%</span><div className="cohort-track"><i style={{ height: `${value}%` }} /></div><span className="cohort-year">{2019 + index % 6}</span></div>)}</div><div className="cohort-summary"><span className="cohort-summary-icon"><Sparkles size={16} /></span><span><strong>Most common destination</strong><small>Technology and digital services</small></span><span className="cohort-arrow"><ArrowRight size={16} /></span></div></article>
          </section>

          <section className="panel directory-panel"><div className="directory-heading"><div><div className="directory-title"><h2>{activePage === 'Outcomes' ? 'Outcome records' : 'Recent graduates'}</h2><span className="record-count">{filtered.length}</span></div><p>Keep track of every graduate&apos;s next step.</p></div><button className="text-button" onClick={() => setActivePage('Graduates')}>View all graduates <ArrowRight size={15} /></button></div>
            <div className="table-toolbar"><div className="table-filters"><label className="filter-search"><Search size={15} /><input aria-label="Search graduate records" placeholder="Search by name, program, employer..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="filter-select"><select aria-label="Filter by graduation year" value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}><option>All years</option>{[2024, 2023, 2022, 2021].map((year) => <option key={year}>{year}</option>)}</select><ChevronDown size={14} /></label><label className="filter-select"><select aria-label="Filter by outcome" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All outcomes</option><option>Employed</option><option>Further study</option><option>Seeking work</option></select><ChevronDown size={14} /></label></div><button className="filter-button" onClick={() => { setYearFilter('All years'); setStatusFilter('All outcomes'); setSearch('') }} aria-label="Clear all filters"><SlidersHorizontal size={16} /><span>Clear</span></button></div>
            <div className="table-scroll"><table><thead><tr><th>GRADUATE</th><th>PROGRAM</th><th>CLASS</th><th>OUTCOME</th><th>ROLE &amp; ORGANIZATION</th><th /></tr></thead><tbody>{filtered.map((graduate) => <tr key={graduate.id}><td><div className="graduate-cell"><span className={`graduate-avatar avatar-${graduate.color}`}>{graduate.name.split(' ').map((part) => part[0]).join('')}</span><span className="graduate-info"><strong>{graduate.name}</strong><small>{graduate.email}</small></span></div></td><td><span className="program-name">{graduate.program}</span></td><td><span className="class-year">{graduate.year}</span></td><td><span className={`outcome-pill ${graduate.status.toLowerCase().replace(' ', '-')}`}><i />{graduate.status}</span></td><td><span className="job-title">{graduate.role}</span><small className="employer-name">{graduate.employer}</small></td><td><button className="row-action" aria-label={`Edit ${graduate.name}`} onClick={() => openForm(graduate)}><MoreHorizontal size={19} /></button></td></tr>)}{filtered.length === 0 && <tr><td className="empty-state" colSpan="6"><Search size={19} /><strong>No graduates found</strong><span>Try adjusting your search or filters.</span></td></tr>}</tbody></table></div>
            <div className="table-footer"><span>Showing <strong>{filtered.length ? 1 : 0}-{filtered.length}</strong> of <strong>{graduates.length}</strong> graduates</span><button className="button button-subtle" onClick={exportCsv}><ArrowDownToLine size={15} /> Export CSV</button></div>
          </section>
          <footer className="page-footer"><span>Northstar University alumni relations</span><span>Built for the next chapter</span></footer>
        </div>
      </main>
      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false) }}><section className="graduate-modal" role="dialog" aria-modal="true" aria-labelledby="graduate-modal-title"><div className="modal-header"><div><span className="modal-icon"><GraduationCap size={19} /></span><h2 id="graduate-modal-title">{editing ? 'Edit graduate' : 'Add a graduate'}</h2><p>Keep their next chapter in view.</p></div><button className="icon-button modal-close" aria-label="Close dialog" onClick={() => setModalOpen(false)}><X size={19} /></button></div><form onSubmit={saveGraduate}><div className="form-grid"><label className="form-field form-full"><span>Full name</span><input name="name" required defaultValue={editing?.name ?? ''} placeholder="e.g. Alex Morgan" /></label><label className="form-field form-full"><span>Email address</span><input name="email" type="email" required defaultValue={editing?.email ?? ''} placeholder="alex@email.edu" /></label><label className="form-field form-full"><span>Program</span><input name="program" required defaultValue={editing?.program ?? ''} placeholder="e.g. Computer Science" /></label><label className="form-field"><span>Graduation year</span><input name="year" type="number" min="1950" max="2100" required defaultValue={editing?.year ?? new Date().getFullYear()} /></label><label className="form-field"><span>Current outcome</span><select name="status" defaultValue={editing?.status ?? 'Employed'}><option>Employed</option><option>Further study</option><option>Seeking work</option><option>Unreported</option></select></label><label className="form-field"><span>Role / course</span><input name="role" defaultValue={editing?.role === '-' ? '' : editing?.role ?? ''} placeholder="e.g. Product Designer" /></label><label className="form-field"><span>Employer / institution</span><input name="employer" defaultValue={editing?.employer === '-' ? '' : editing?.employer ?? ''} placeholder="Organization name" /></label><label className="form-field form-full"><span>Location</span><input name="location" defaultValue={editing?.location === '-' ? '' : editing?.location ?? ''} placeholder="City, State" /></label></div><div className="modal-actions"><button type="button" className="button button-subtle" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="button button-primary">{editing ? 'Save changes' : 'Add graduate'} <ArrowRight size={16} /></button></div></form></section></div>}
      {toast && <div className="toast-message" role="status"><span className="toast-check">✓</span>{toast}</div>}
    </div>
  )
}

export default App
