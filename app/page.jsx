'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Colour palette for charts ──────────────────────────────────────────────
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CATEGORY_COLOR = {
  Compute: '#3b82f6',
  Storage: '#10b981',
  Network: '#f59e0b',
  Database: '#ef4444',
  GenAI: '#8b5cf6',
  Other: '#6b7280',
};

// ─── Default resource for calculator ────────────────────────────────────────
const defaultResource = {
  id: '1',
  description: 'OCI Compute',
  partNumber: '',
  metric: 'OCPU Per Hour',
  quantity: 1,
  hoursPerMonth: 744,
  isWindows: false,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => (n != null ? Number(n).toFixed(2) : '—');
const fmtPct = (n) => (n != null ? `${Number(n).toFixed(1)}%` : '—');

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, opts);
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const d = await res.json();
      msg = Array.isArray(d.message) ? d.message.join(' ') : (d.message || msg);
    } catch (_) { }
    throw new Error(msg);
  }
  return res.json();
}

// ─── Root page ────────────────────────────────────────────────────────────────
export default function Page() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Shared document state lifted to page level so Dashboard can see it
  const [documentResult, setDocumentResult] = useState(null);
  const [modelingResult, setModelingResult] = useState(null);

  // Calculator state
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [billingCountry, setBillingCountry] = useState('US');
  const [customerName, setCustomerName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [resources, setResources] = useState([{ ...defaultResource }]);
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState(null);
  const [products, setProducts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [quotationsLoading, setQuotationsLoading] = useState(false);
  const [saveQuoteLoading, setSaveQuoteLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]));
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'calculator', label: 'Calculator' },
    { id: 'quotations', label: 'Quotations' },
    { id: 'history', label: 'Upload History' },
    { id: 'billing', label: 'Billing & Lift-and-Shift' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <img src="/nimbus-logo.png" alt="Nimbus" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">OCI Price Calculator</h1>
              <p className="text-xs text-slate-500">Oracle Cloud Infrastructure · FinOps Platform</p>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex gap-1" aria-label="Tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === t.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && (
          <DashboardSection
            documentResult={documentResult}
            modelingResult={modelingResult}
            apiBaseUrl={API_BASE_URL}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'calculator' && (
          <CalculatorSection
            currencyCode={currencyCode}
            setCurrencyCode={setCurrencyCode}
            billingCountry={billingCountry}
            setBillingCountry={setBillingCountry}
            customerName={customerName}
            setCustomerName={setCustomerName}
            projectName={projectName}
            setProjectName={setProjectName}
            resources={resources}
            setResources={setResources}
            result={calcResult}
            setResult={setCalcResult}
            loading={calcLoading}
            setLoading={setCalcLoading}
            error={calcError}
            setError={setCalcError}
            products={products}
            quotations={quotations}
            setQuotations={setQuotations}
            quotationsLoading={quotationsLoading}
            setQuotationsLoading={setQuotationsLoading}
            saveQuoteLoading={saveQuoteLoading}
            setSaveQuoteLoading={setSaveQuoteLoading}
            apiBaseUrl={API_BASE_URL}
            onTabChange={setActiveTab}
          />
        )}
        {activeTab === 'quotations' && (
          <QuotationsSection
            quotations={quotations}
            loading={quotationsLoading}
            apiBaseUrl={API_BASE_URL}
            onRefresh={() => {
              setQuotationsLoading(true);
              fetch(`${API_BASE_URL}/api/quotations?limit=50`)
                .then((r) => (r.ok ? r.json() : []))
                .then((d) => setQuotations(Array.isArray(d) ? d : []))
                .catch(() => setQuotations([]))
                .finally(() => setQuotationsLoading(false));
            }}
            onLoad={(quoteId) => {
              fetch(`${API_BASE_URL}/api/quotations/${quoteId}`)
                .then((r) => (r.ok ? r.json() : null))
                .then((q) => {
                  if (!q) return;
                  setCustomerName(q.customerName || '');
                  setProjectName(q.projectName || '');
                  setCurrencyCode(q.currencyCode || 'USD');
                  setBillingCountry(q.billingCountry || 'US');
                  setCalcResult(q.calculationResult || null);
                  setActiveTab('calculator');
                })
                .catch((err) => alert(err.message || 'Failed to load'));
            }}
          />
        )}
        {activeTab === 'history' && (
          <UploadHistorySection
            apiBaseUrl={API_BASE_URL}
            onSelectUpload={(doc) => {
              setDocumentResult(doc);
              setModelingResult(null);
              setActiveTab('billing');
            }}
          />
        )}
        {activeTab === 'billing' && (
          <BillingAndModelingSection
            apiBaseUrl={API_BASE_URL}
            documentResult={documentResult}
            setDocumentResult={setDocumentResult}
            modelingResult={modelingResult}
            setModelingResult={setModelingResult}
            customerName={customerName}
            projectName={projectName}
          />
        )}
      </main>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardSection({ documentResult, modelingResult, apiBaseUrl, onNavigate }) {
  const [latestUpload, setLatestUpload] = useState(null);
  const [loadingLatest, setLoadingLatest] = useState(false);

  // Load latest upload summary if no documentResult present
  useEffect(() => {
    if (!documentResult) {
      setLoadingLatest(true);
      fetch(`${apiBaseUrl}/api/documents?limit=1`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setLatestUpload(d?.uploads?.[0] ?? null))
        .catch(() => setLatestUpload(null))
        .finally(() => setLoadingLatest(false));
    }
  }, [documentResult, apiBaseUrl]);

  const doc = documentResult;
  const summary = doc?.costSummary;
  const modeling = modelingResult;

  const serviceData = (summary?.totalPerService ?? []).map((s, i) => ({
    name: s.label ?? s.key,
    value: Number(s.cost),
    color: CATEGORY_COLOR[s.label] ?? CHART_COLORS[i % CHART_COLORS.length],
  }));

  const regionData = (summary?.totalPerRegion ?? [])
    .filter((r) => r.key && r.key !== 'Unknown')
    .slice(0, 8)
    .map((r) => ({
      name: r.label ?? r.key,
      cost: Number(r.cost),
    }));

  if (!doc) {
    return (
      <div className="space-y-6">
        <div className="card text-center py-12">
          <p className="text-slate-400 text-lg font-medium mb-2">No billing data loaded yet</p>
          <p className="text-slate-500 text-sm mb-6">
            {loadingLatest
              ? 'Checking for recent uploads…'
              : latestUpload
                ? `Latest upload: ${latestUpload.fileName} (${latestUpload.providerDetected?.toUpperCase()})`
                : 'Upload a billing document to see your dashboard.'}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('billing')}
            className="btn-primary"
          >
            Go to Billing & Lift-and-Shift
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Grand Total"
          value={`${fmt(summary?.grandTotal)} ${summary?.currencyCode ?? ''}`}
          sub={`Subtotal: ${fmt(summary?.subtotal)}`}
          color="primary"
        />
        <KpiCard
          label="Provider Detected"
          value={(doc.cloudProviderDetected ?? '—').toUpperCase()}
          sub={doc.fileName}
          color="blue"
        />
        <KpiCard
          label="Billing Period"
          value={
            doc.billingPeriod?.start
              ? new Date(doc.billingPeriod.start).toLocaleDateString()
              : '—'
          }
          sub={
            doc.billingPeriod?.end
              ? `→ ${new Date(doc.billingPeriod.end).toLocaleDateString()}`
              : ''
          }
          color="green"
        />
        <KpiCard
          label="Line Items"
          value={doc.lineItems?.length ?? 0}
          sub={doc.fileType?.toUpperCase() ?? '—'}
          color="amber"
        />
      </div>

      {/* OCI Modeling summary (if available) */}
      {modeling && (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Current Cloud Cost"
            value={`${fmt(modeling.summary.totalSourceCost)} ${modeling.currencyCode}`}
            sub="Source (this billing period)"
            color="red"
          />
          <KpiCard
            label="OCI Estimated Cost"
            value={`${fmt(modeling.summary.totalOciEstimatedCost)} ${modeling.currencyCode}`}
            sub="After lift-and-shift"
            color="green"
          />
          <KpiCard
            label="Projected Savings"
            value={fmtPct(modeling.summary.totalSavingsPct)}
            sub={`${fmt(modeling.summary.totalSavings)} ${modeling.currencyCode} / month`}
            color="primary"
          />
        </div>
      )}

      {/* Charts row */}
      {serviceData.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Donut chart — by service */}
          <section className="card">
            <h2 className="card-title">Cost by Service Category</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {serviceData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${fmt(v)} ${summary?.currencyCode ?? 'USD'}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </section>

          {/* Bar chart — by region */}
          {regionData.length > 0 ? (
            <section className="card">
              <h2 className="card-title">Cost by Region</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={regionData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${fmt(v)} ${summary?.currencyCode ?? 'USD'}`} />
                  <Bar dataKey="cost" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          ) : (
            <section className="card flex items-center justify-center text-slate-400 text-sm">
              No region data available in this document.
            </section>
          )}
        </div>
      )}

      {/* OCI savings by category */}
      {modeling && Object.keys(modeling.summary.byCategory).length > 0 && (
        <section className="card">
          <h2 className="card-title">OCI Savings by Service Category</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={Object.entries(modeling.summary.byCategory).map(([cat, d]) => ({
                name: cat,
                'Source Cost': +d.sourceCost.toFixed(2),
                'OCI Cost': +d.ociCost.toFixed(2),
              }))}
            >
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${fmt(v)} ${modeling.currencyCode}`} />
              <Legend />
              <Bar dataKey="Source Cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="OCI Cost" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, color }) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-900',
    blue: 'bg-blue-50 text-blue-900',
    green: 'bg-emerald-50 text-emerald-900',
    amber: 'bg-amber-50 text-amber-900',
    red: 'bg-red-50 text-red-900',
  };
  return (
    <div className={`rounded-xl px-5 py-4 ${colorMap[color] ?? 'bg-slate-50 text-slate-900'}`}>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold leading-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs opacity-60 truncate">{sub}</p>}
    </div>
  );
}

// ─── Upload History ───────────────────────────────────────────────────────────
function UploadHistorySection({ apiBaseUrl, onSelectUpload }) {
  const [uploads, setUploads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingDocId, setLoadingDocId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(
    (p = 1) => {
      setLoading(true);
      setError(null);
      fetch(`${apiBaseUrl}/api/documents?page=${p}&limit=20`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
        .then((d) => {
          setUploads(d.uploads ?? []);
          setTotal(d.total ?? 0);
          setPage(d.page ?? p);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    },
    [apiBaseUrl],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const loadDocument = (uploadId) => {
    setLoadingDocId(uploadId);
    fetch(`${apiBaseUrl}/api/documents/${uploadId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then((doc) => onSelectUpload(doc))
      .catch((e) => alert(e.message || 'Failed to load document'))
      .finally(() => setLoadingDocId(null));
  };

  const deleteUpload = (e, uploadId, fileName) => {
    e.stopPropagation();
    if (!confirm(`Delete "${fileName}"?\n\nThis will permanently remove the upload and all its billing data.`)) return;
    setDeletingId(uploadId);
    fetch(`${apiBaseUrl}/api/documents/${uploadId}`, { method: 'DELETE' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then(() => load(page))
      .catch((e) => alert(e.message || 'Failed to delete upload'))
      .finally(() => setDeletingId(null));
  };

  const totalPages = Math.ceil(total / 20);

  const providerBadge = (p) => {
    const colors = { aws: 'bg-orange-100 text-orange-700', azure: 'bg-blue-100 text-blue-700', gcp: 'bg-yellow-100 text-yellow-700', oci: 'bg-red-100 text-red-700', unknown: 'bg-slate-100 text-slate-600' };
    return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${colors[p] ?? colors.unknown}`}>{p}</span>;
  };

  const statusBadge = (s) => {
    const colors = { completed: 'bg-green-100 text-green-700', processing: 'bg-blue-100 text-blue-700', failed: 'bg-red-100 text-red-700' };
    return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colors[s] ?? 'bg-slate-100 text-slate-600'}`}>{s}</span>;
  };

  return (
    <section className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="card-title mb-0">Upload History</h2>
        <button type="button" onClick={() => load(1)} disabled={loading} className="btn-secondary">
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {!loading && uploads.length === 0 && !error && (
        <p className="text-sm text-slate-500">No uploads found. Upload a billing document from the Billing & Lift-and-Shift tab.</p>
      )}
      {uploads.length > 0 && (
        <>
          <div className="table-wrapper">
            <table className="table-base">
              <thead>
                <tr>
                  <th>File name</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Billing period</th>
                  <th className="text-right">Total tax</th>
                  <th>Items</th>
                  <th>Uploaded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((u) => (
                  <tr key={u.uploadId} className="hover:bg-slate-50 cursor-pointer" onClick={() => loadDocument(u.uploadId)}>
                    <td className="font-medium text-slate-800 max-w-xs truncate">{u.fileName}</td>
                    <td>{providerBadge(u.providerDetected)}</td>
                    <td>{statusBadge(u.status)}</td>
                    <td className="text-xs text-slate-500">
                      {u.billingPeriodStart ? new Date(u.billingPeriodStart).toLocaleDateString() : '—'}
                      {u.billingPeriodEnd ? ` – ${new Date(u.billingPeriodEnd).toLocaleDateString()}` : ''}
                    </td>
                    <td className="text-right text-xs font-medium text-slate-700">
                      {u.totalTax != null ? fmt(u.totalTax) : '—'}
                    </td>
                    <td className="text-center">{u.itemCount}</td>
                    <td className="text-xs text-slate-500">{new Date(u.uploadedAt).toLocaleString()}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); loadDocument(u.uploadId); }}
                          disabled={loadingDocId === u.uploadId || deletingId === u.uploadId}
                          className="btn-primary py-1 px-3 text-xs"
                        >
                          {loadingDocId === u.uploadId ? '…' : 'View'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => deleteUpload(e, u.uploadId, u.fileName)}
                          disabled={deletingId === u.uploadId || loadingDocId === u.uploadId}
                          className="py-1 px-3 text-xs rounded-lg border border-red-300 text-red-600 bg-white hover:bg-red-50 disabled:opacity-40 transition-colors"
                        >
                          {deletingId === u.uploadId ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <button type="button" onClick={() => load(page - 1)} disabled={page <= 1 || loading} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Prev</button>
              <span>Page {page} of {totalPages} ({total} total)</span>
              <button type="button" onClick={() => load(page + 1)} disabled={page >= totalPages || loading} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ─── Billing & Lift-and-Shift ─────────────────────────────────────────────────
const ACCEPT_DOCUMENTS = 'application/pdf,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function BillingAndModelingSection({
  apiBaseUrl,
  documentResult,
  setDocumentResult,
  modelingResult,
  setModelingResult,
  customerName,
  projectName,
}) {
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [modelingLoading, setModelingLoading] = useState(false);
  const [modelingError, setModelingError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('upload');

  const uploadDocument = (file) => {
    if (!file) return;
    setDocumentError(null);
    setDocumentLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    fetch(`${apiBaseUrl}/api/documents/upload`, { method: 'POST', body: formData })
      .then(async (r) => {
        if (!r.ok) {
          let msg = r.statusText;
          try { const d = await r.json(); msg = Array.isArray(d.message) ? d.message.join(' ') : (d.message || msg); } catch (_) { }
          throw new Error(msg);
        }
        return r.json();
      })
      .then((data) => {
        setDocumentResult(data);
        setModelingResult(null);
        setActiveSubTab('extracted');
      })
      .catch((err) => setDocumentError(err.message || 'Upload failed'))
      .finally(() => setDocumentLoading(false));
  };

  const runModeling = async () => {
    if (!documentResult?.uploadId) return;
    setModelingLoading(true);
    setModelingError(null);
    try {
      const result = await apiFetch('/api/oci-cost-modeling/model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId: documentResult.uploadId,
          currencyCode: documentResult.costSummary?.currencyCode ?? 'USD',
        }),
      });
      setModelingResult(result);
      setActiveSubTab('modeling');
    } catch (e) {
      setModelingError(e.message || 'Modeling failed');
    } finally {
      setModelingLoading(false);
    }
  };

  const downloadReport = async (type) => {
    if (!modelingResult) return;
    const endpoint = type === 'pdf' ? '/api/proposals/migration-pdf' : '/api/proposals/migration-excel';
    const res = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: customerName || 'Customer',
        projectName: projectName || 'OCI Migration',
        modelingResult,
      }),
    });
    if (!res.ok) { const t = await res.text(); alert(t || 'Failed to generate report'); return; }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'pdf' ? 'oci-migration-proposal.pdf' : 'oci-migration-proposal.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const subTabs = [
    { id: 'upload', label: 'Upload Document' },
    ...(documentResult ? [{ id: 'extracted', label: `Extracted Data (${documentResult.lineItems?.length ?? 0})` }] : []),
    ...(modelingResult ? [{ id: 'modeling', label: 'OCI Modeling' }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tab navigation */}
      <div className="flex gap-1 border-b border-slate-200">
        {subTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveSubTab(t.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${activeSubTab === t.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Upload sub-tab */}
      {activeSubTab === 'upload' && (
        <section className="card">
          <h2 className="card-title">Upload Billing Document</h2>
          <p className="mb-4 text-sm text-slate-500">
            Supports PDF invoices (Gemini AI OCR), CSV billing exports, and XLSX workbooks.
            Providers detected: AWS, Azure, GCP, OCI.
          </p>
          <div
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer?.files?.[0]; if (f) uploadDocument(f); }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`mb-4 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'}`}
          >
            <input
              type="file"
              accept={ACCEPT_DOCUMENTS}
              className="hidden"
              id="doc-upload"
              disabled={documentLoading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDocument(f); e.target.value = ''; }}
            />
            <label htmlFor="doc-upload" className={documentLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}>
              <p className="text-base font-medium text-slate-600">
                {documentLoading ? 'Processing document…' : 'Drop a file here or click to choose'}
              </p>
              <p className="mt-1 text-xs text-slate-400">PDF · CSV · XLSX — up to 50 MB</p>
            </label>
          </div>
          {documentError && <p className="mb-2 text-sm text-red-600 rounded-lg bg-red-50 px-4 py-2">{documentError}</p>}
          {documentResult && (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
              Last upload: <strong>{documentResult.fileName}</strong> — {documentResult.lineItems?.length ?? 0} items extracted ({documentResult.cloudProviderDetected?.toUpperCase()})
              <button
                type="button"
                onClick={() => setActiveSubTab('extracted')}
                className="ml-3 underline text-green-700 hover:text-green-900"
              >
                View extracted data
              </button>
            </div>
          )}
        </section>
      )}

      {/* Extracted data sub-tab */}
      {activeSubTab === 'extracted' && documentResult && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="card-title mb-1">Extracted Billing Data</h2>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  <span><strong>File:</strong> {documentResult.fileName}</span>
                  <span><strong>Provider:</strong> {documentResult.cloudProviderDetected?.toUpperCase()}</span>
                  <span><strong>Period:</strong>{' '}
                    {documentResult.billingPeriod?.start ? new Date(documentResult.billingPeriod.start).toLocaleDateString() : '—'}
                    {' – '}
                    {documentResult.billingPeriod?.end ? new Date(documentResult.billingPeriod.end).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
              {/* TODO: re-enable when OCI modeling is ready */}
              <button
                type="button"
                onClick={runModeling}
                disabled={modelingLoading}
                className="btn-primary"
              >
                {modelingLoading ? 'Running OCI modeling…' : 'Run OCI Lift-and-Shift Modeling'}
              </button>
             
            </div>
            {modelingError && <p className="mt-2 text-sm text-red-600">{modelingError}</p>}
          </div>

          {/* Cost summary */}
          <div className="card">
            <h3 className="mb-3 font-semibold text-slate-800">Cost Summary</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mb-4">
              {documentResult.costSummary?.totalPerService?.map((s) => (
                <div key={s.key} className="rounded-lg bg-slate-50 px-4 py-2">
                  <span className="text-xs text-slate-500 block truncate">{s.label ?? s.key}</span>
                  <span className="font-medium">{fmt(s.cost)} {s.currencyCode}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm">
                <span className="text-slate-600">Subtotal (pre-tax)</span>
                <span className="font-medium">{fmt(documentResult.costSummary?.subtotal)} {documentResult.costSummary?.currencyCode ?? 'USD'}</span>
              </div>
              {(documentResult.totalTax ?? documentResult.costSummary?.totalTax) != null && (
                <div className="flex justify-between rounded-lg bg-amber-50 px-4 py-2 text-sm">
                  <span className="text-amber-700">Total tax</span>
                  <span className="font-medium text-amber-900">{fmt(documentResult.totalTax ?? documentResult.costSummary?.totalTax)} {documentResult.costSummary?.currencyCode ?? 'USD'}</span>
                </div>
              )}
              <div className="flex justify-between rounded-lg bg-primary-50 px-4 py-2 text-sm">
                <span className="text-primary-700 font-medium">Grand total</span>
                <span className="font-bold text-primary-900">{fmt(documentResult.costSummary?.grandTotal)} {documentResult.costSummary?.currencyCode ?? 'USD'}</span>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="card">
            <h3 className="mb-3 font-semibold text-slate-800">Line Items ({documentResult.lineItems?.length ?? 0})</h3>
            <div className="table-wrapper">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Product / Service</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Region</th>
                    <th className="text-right">Cost</th>
                    <th>Currency</th>
                  </tr>
                </thead>
                <tbody>
                  {documentResult.lineItems?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="max-w-xs truncate">{item.productName ?? item.productCode ?? '—'}</td>
                      <td>{item.serviceCategory ?? '—'}</td>
                      <td>{item.usageQuantity ?? '—'}</td>
                      <td>{item.unitOfMeasure ?? '—'}</td>
                      <td>{item.regionName ?? '—'}</td>
                      <td className="text-right font-medium">{item.costBeforeTax != null ? fmt(item.costBeforeTax) : '—'}</td>
                      <td>{item.currencyCode ?? 'USD'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* OCI Modeling sub-tab */}
      {activeSubTab === 'modeling' && modelingResult && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="card">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="card-title mb-1">OCI Lift-and-Shift Analysis</h2>
                <p className="text-sm text-slate-500">Source: {modelingResult.sourceProvider?.toUpperCase()} · Currency: {modelingResult.currencyCode}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => downloadReport('pdf')} className="btn-primary text-sm">Download PDF Report</button>
                <button type="button" onClick={() => downloadReport('excel')} className="btn-secondary text-sm">Download Excel Report</button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 mb-4">
              <div className="rounded-lg bg-red-50 px-4 py-3">
                <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Current Cost</p>
                <p className="text-xl font-bold text-red-900">{fmt(modelingResult.summary.totalSourceCost)} {modelingResult.currencyCode}</p>
                <p className="text-xs text-red-500">this billing period</p>
              </div>
              <div className="rounded-lg bg-emerald-50 px-4 py-3">
                <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">OCI Estimated</p>
                <p className="text-xl font-bold text-emerald-900">{fmt(modelingResult.summary.totalOciEstimatedCost)} {modelingResult.currencyCode}</p>
                <p className="text-xs text-emerald-500">after lift-and-shift</p>
              </div>
              <div className="rounded-lg bg-primary-50 px-4 py-3">
                <p className="text-xs text-primary-600 font-medium uppercase tracking-wide">Projected Savings</p>
                <p className="text-xl font-bold text-primary-900">{fmtPct(modelingResult.summary.totalSavingsPct)}</p>
                <p className="text-xs text-primary-500">{fmt(modelingResult.summary.totalSavings)} {modelingResult.currencyCode} / month</p>
              </div>
            </div>

            {/* By category breakdown */}
            <h3 className="mb-2 font-semibold text-slate-700 text-sm">By Service Category</h3>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-slate-600">Category</th>
                    <th className="text-right px-4 py-2 font-semibold text-slate-600">Source Cost</th>
                    <th className="text-right px-4 py-2 font-semibold text-slate-600">OCI Cost</th>
                    <th className="text-right px-4 py-2 font-semibold text-slate-600">Savings</th>
                    <th className="text-right px-4 py-2 font-semibold text-slate-600">Savings %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(modelingResult.summary.byCategory).map(([cat, d]) => {
                    const pct = d.sourceCost > 0 ? ((d.savings / d.sourceCost) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={cat} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium">{cat}</td>
                        <td className="px-4 py-2 text-right">{fmt(d.sourceCost)}</td>
                        <td className="px-4 py-2 text-right text-emerald-700">{fmt(d.ociCost)}</td>
                        <td className="px-4 py-2 text-right text-primary-700">{fmt(d.savings)}</td>
                        <td className="px-4 py-2 text-right font-semibold text-primary-800">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed rows */}
          <div className="card">
            <h3 className="mb-3 font-semibold text-slate-800">Detailed Comparison ({modelingResult.rows?.length ?? 0} items)</h3>
            <div className="table-wrapper">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Source Service</th>
                    <th>Category</th>
                    <th className="text-right">Source Cost</th>
                    <th>OCI SKU</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-right">OCI Est. Cost</th>
                    <th className="text-right">Savings</th>
                    <th className="text-right">Save %</th>
                  </tr>
                </thead>
                <tbody>
                  {modelingResult.rows?.map((row, idx) => (
                    <tr key={idx} className={row.savingsPct > 0 ? '' : 'opacity-60'}>
                      <td className="max-w-xs truncate">{row.sourceService}</td>
                      <td>{row.serviceCategory}</td>
                      <td className="text-right">{fmt(row.sourceCost)}</td>
                      <td className="text-xs font-mono">{row.ociSkuPartNumber}</td>
                      <td className="text-right text-xs">{row.ociUnitPrice}</td>
                      <td className="text-right text-emerald-700 font-medium">{fmt(row.ociEstimatedCost)}</td>
                      <td className="text-right text-primary-700">{fmt(row.savingsAmount)}</td>
                      <td className={`text-right font-semibold ${row.savingsPct >= 0 ? 'text-primary-800' : 'text-red-600'}`}>
                        {fmtPct(row.savingsPct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Calculator (unchanged logic, cleaned up) ─────────────────────────────────
function CalculatorSection({
  currencyCode, setCurrencyCode, billingCountry, setBillingCountry,
  customerName, setCustomerName, projectName, setProjectName,
  resources, setResources, result, setResult,
  loading, setLoading, error, setError, products,
  quotations, setQuotations, quotationsLoading, setQuotationsLoading,
  saveQuoteLoading, setSaveQuoteLoading, apiBaseUrl, onTabChange,
}) {
  const handleResourceChange = (index, field, value) => {
    const updated = [...resources];
    updated[index] = {
      ...updated[index],
      [field]: field === 'quantity' || field === 'hoursPerMonth' ? Number(value) : value,
    };
    setResources(updated);
  };

  const onSelectProduct = (index, product) => {
    if (!product) return;
    const updated = [...resources];
    updated[index] = {
      ...updated[index],
      partNumber: product.partNumber || '',
      description: product.skuName || product.partNumber || '',
      metric: product.metricName || updated[index].metric,
    };
    setResources(updated);
  };

  const calculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currencyCode, billingCountry, resources }),
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const saveQuotation = async () => {
    if (!result) return;
    setSaveQuoteLoading(true);
    try {
      const saved = await apiFetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: customerName || null, projectName: projectName || null, currencyCode, billingCountry, calculationResult: result }),
      });
      setQuotationsLoading(true);
      fetch(`${apiBaseUrl}/api/quotations?limit=50`)
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => setQuotations(Array.isArray(d) ? d : []))
        .catch(() => { })
        .finally(() => setQuotationsLoading(false));
      onTabChange('quotations');
      alert(`Saved as quotation #${saved.quoteId}`);
    } catch (err) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaveQuoteLoading(false);
    }
  };

  const downloadProposal = async (type) => {
    if (!result) return;
    const endpoint = type === 'pdf' ? '/api/proposals/pdf' : '/api/proposals/excel';
    const res = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: customerName || 'Customer', projectName: projectName || 'OCI Proposal', calculationResult: result }),
    });
    if (!res.ok) { alert(await res.text() || 'Failed'); return; }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = type === 'pdf' ? 'oci-proposal.pdf' : 'oci-proposal.xlsx'; a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <section className="card mb-6">
        <h2 className="card-title">General settings</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Currency</label>
            <select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} className="select-base">
              <option value="USD">USD</option>
              <option value="BRL">BRL</option>
            </select>
          </div>
          <div>
            <label className="label">Billing country</label>
            <select value={billingCountry} onChange={(e) => setBillingCountry(e.target.value)} className="select-base">
              <option value="US">US</option>
              <option value="BR">Brazil</option>
            </select>
          </div>
          <div>
            <label className="label">Customer</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" className="input-base" />
          </div>
          <div>
            <label className="label">Project</label>
            <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name" className="input-base" />
          </div>
        </div>
      </section>

      <section className="card mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="card-title mb-0">Resources</h2>
          <button type="button" onClick={() => setResources([...resources, { id: String(resources.length + 1), description: '', partNumber: '', metric: 'OCPU Per Hour', quantity: 1, hoursPerMonth: 744, isWindows: false }])} className="btn-primary">Add resource</button>
        </div>
        <div className="space-y-4">
          {resources.map((r, index) => (
            <div key={r.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="label">Product (from DB)</label>
                  <select
                    value={r.partNumber}
                    onChange={(e) => {
                      const opt = e.target.options[e.target.selectedIndex];
                      const product = opt?.value ? products.find((p) => p.partNumber === opt.value) : null;
                      if (product) onSelectProduct(index, product);
                      else handleResourceChange(index, 'partNumber', e.target.value);
                    }}
                    className="select-base"
                  >
                    <option value="">— Choose or type part number below —</option>
                    {products.map((p) => (
                      <option key={p.productId} value={p.partNumber || ''}>{p.partNumber} – {p.skuName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Part number</label>
                  <input type="text" value={r.partNumber} onChange={(e) => handleResourceChange(index, 'partNumber', e.target.value)} placeholder="e.g. B88298" className="input-base" />
                </div>
                <div>
                  <label className="label">Description</label>
                  <input type="text" value={r.description} onChange={(e) => handleResourceChange(index, 'description', e.target.value)} className="input-base" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="label">Metric</label>
                  <select value={r.metric} onChange={(e) => handleResourceChange(index, 'metric', e.target.value)} className="select-base">
                    <option value="OCPU Per Hour">OCPU Per Hour</option>
                    <option value="GB Per Month">GB Per Month</option>
                    <option value="GB Per Month Internet Data Transfer">GB/Month Data Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Quantity</label>
                  <input type="number" min="0" value={r.quantity} onChange={(e) => handleResourceChange(index, 'quantity', e.target.value)} className="input-base" />
                </div>
                <div>
                  <label className="label">Hours / month</label>
                  <input type="number" min="0" value={r.hoursPerMonth} onChange={(e) => handleResourceChange(index, 'hoursPerMonth', e.target.value)} className="input-base" />
                </div>
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={r.isWindows} onChange={(e) => handleResourceChange(index, 'isWindows', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm font-medium text-slate-700">Windows</span>
                  </label>
                </div>
                {resources.length > 1 && (
                  <div className="flex items-end">
                    <button type="button" onClick={() => setResources(resources.filter((_, i) => i !== index))} className="btn-danger">Remove</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={calculate} disabled={loading} className="btn-primary py-2.5 px-5">
          {loading ? 'Calculating…' : 'Calculate costs'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {result && (
        <>
          <section className="card mb-6">
            <h2 className="card-title">Totals</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Compute', result.totals.computeTotal],
                ['Storage', result.totals.storageTotal],
                ['Network', result.totals.networkTotal],
                ['License / other', result.totals.licenseTotal],
                ['Total before tax', result.totals.totalBeforeTax],
              ].map(([label, val]) => (
                <div key={label} className="rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-500">{label}</span>
                  <p className="font-semibold text-slate-900">{fmt(val)} {result.currencyCode}</p>
                </div>
              ))}
              {result.totals.totalAfterTax !== result.totals.totalBeforeTax && (
                <div className="rounded-lg bg-primary-50 px-4 py-3">
                  <span className="text-sm text-primary-700">Total after tax</span>
                  <p className="font-semibold text-primary-900">{fmt(result.totals.totalAfterTax)} {result.currencyCode}</p>
                </div>
              )}
            </div>
          </section>

          <section className="card mb-6">
            <h2 className="card-title">Line items</h2>
            <div className="table-wrapper">
              <table className="table-base">
                <thead>
                  <tr><th>Description</th><th>Part</th><th>Metric</th><th>Qty</th><th>Hours</th><th>Unit price</th><th>Category</th><th className="text-right">Cost</th></tr>
                </thead>
                <tbody>
                  {result.lineItems.map((item) => (
                    <tr key={item.id || item.partNumber}>
                      <td>{item.description}</td><td>{item.partNumber}</td><td>{item.metric}</td>
                      <td>{item.quantity}</td><td>{item.hoursPerMonth}</td><td>{item.unitPrice}</td>
                      <td>{item.costCategory}</td>
                      <td className="text-right font-medium">{fmt(item.baseCost)} {result.currencyCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Proposals</h2>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => downloadProposal('pdf')} className="btn-primary">Download PDF</button>
              <button type="button" onClick={() => downloadProposal('excel')} className="btn-secondary">Download Excel</button>
              <button type="button" onClick={saveQuotation} disabled={saveQuoteLoading} className="btn-secondary">{saveQuoteLoading ? 'Saving…' : 'Save quotation'}</button>
            </div>
          </section>
        </>
      )}
    </>
  );
}

// ─── Quotations ───────────────────────────────────────────────────────────────
function QuotationsSection({ quotations, loading, onRefresh, onLoad }) {
  return (
    <section className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="card-title mb-0">Saved Quotations</h2>
        <button type="button" onClick={onRefresh} disabled={loading} className="btn-secondary">{loading ? 'Loading…' : 'Refresh'}</button>
      </div>
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && quotations.length === 0 && (
        <p className="text-sm text-slate-500">No saved quotations. Calculate and use &quot;Save quotation&quot; on the Calculator tab.</p>
      )}
      {!loading && quotations.length > 0 && (
        <div className="table-wrapper">
          <table className="table-base">
            <thead>
              <tr><th>ID</th><th>Customer</th><th>Project</th><th>Currency</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q.quoteId}>
                  <td className="font-medium">{q.quoteId}</td>
                  <td>{q.customerName || '—'}</td>
                  <td>{q.projectName || '—'}</td>
                  <td>{q.currencyCode}</td>
                  <td>{q.createdAt ? new Date(q.createdAt).toLocaleString() : '—'}</td>
                  <td><button type="button" onClick={() => onLoad(q.quoteId)} className="btn-primary py-1.5 px-3 text-xs">Load</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
