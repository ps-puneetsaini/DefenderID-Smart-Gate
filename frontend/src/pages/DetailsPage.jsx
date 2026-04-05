import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Hash, Building2, Briefcase, Mail, Camera, AlertCircle, CheckCircle } from 'lucide-react'
import { saveDetails } from '../services/userService'
import toast from 'react-hot-toast'

const branches = [
  'defense security',
  'military operations',
  'army security division',
  'Access Control unit',
  'defense intelligence',
  'security operations'
]
const positions = [
  'solider',
  'Captain',
  'major',
  'general',
  'security officer',
  'Access Control officer',
  'gate officer',
  'surveillance officer',
  'commanding office'
]

export default function DetailsPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', employeeId: '', branch: '', position: '', email: '' })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedCode, setGeneratedCode] = useState(null)

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setError('')
  }

  const handlePhoto = e => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.fullName || !form.employeeId || !form.branch || !form.position || !form.email) {
      setError('All fields are required. Please check and try again.')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      Object.keys(form).forEach(k => fd.append(k, form[k]))
      if (photo) fd.append('photo', photo)

      const res = await saveDetails(fd)
      setGeneratedCode(res.data.verificationCode)
      sessionStorage.setItem('sgs_vcode', res.data.verificationCode)
      toast.success('Details saved! Verification code generated.')
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid details. Please check and try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (generatedCode) {
    return (
      <div className="page-content">
        <div className="form-card text-center space-y-6">
          <div className="w-16 h-16 bg-accent-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-accent-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Verification Code Generated</h2>
            <p className="text-slate-400 text-sm mt-1">Use this code on the Authorization page</p>
          </div>
          <div className="glass-strong rounded-2xl p-6">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Your Verification Code</p>
            <div className="font-mono text-6xl font-bold text-primary-400 tracking-[0.3em] otp-digit">
              {generatedCode}
            </div>
            <p className="text-slate-500 text-xs mt-3">⏱ Valid for 10 minutes</p>
          </div>
          <div className="alert-info text-sm text-left">
            <span>📋</span>
            <p>Copy this code — you'll need it on the next page. It won't be shown again.</p>
          </div>
          <button id="btn-proceed-authorize" onClick={() => navigate('/authorize')} className="btn-primary w-full">
            Proceed to Authorization →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="w-full max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="step-badge">2</div>
            <h1 className="text-2xl font-bold text-white">Identity Verification</h1>
          </div>
          <p className="text-slate-400 text-sm ml-12">Enter your details to generate a verification code</p>
        </div>

        <div className="glass p-8 shadow-glass">
          {error && (
            <div className="alert-error mb-6">
              <AlertCircle size={16} className="shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} id="details-form" className="space-y-5">
            {/* Photo upload */}
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-dark-400 bg-dark-600 flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors overflow-hidden"
                  onClick={() => document.getElementById('photo-input').click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-slate-500">
                      <Camera size={24} className="mx-auto mb-1" />
                      <span className="text-xs">Upload Photo</span>
                    </div>
                  )}
                </div>
                <input id="photo-input" type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </div>
              <div className="flex-1 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="form-label" htmlFor="det-fullName">Full Name *</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input id="det-fullName" name="fullName" type="text" value={form.fullName} onChange={handleChange}
                      placeholder="John Doe" className="input-field pl-11" />
                  </div>
                </div>
                {/* Employee ID */}
                <div>
                  <label className="form-label" htmlFor="det-empId">Employee ID *</label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input id="det-empId" name="employeeId" type="text" value={form.employeeId} onChange={handleChange}
                      placeholder="EMP-001" className="input-field pl-11 uppercase" />
                  </div>
                </div>
              </div>
            </div>

            {/* Branch & Position */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label" htmlFor="det-branch">Branch *</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select id="det-branch" name="branch" value={form.branch} onChange={handleChange} className="input-field pl-11 appearance-none">
                    <option value="">Select branch</option>
                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="det-position">Position *</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select id="det-position" name="position" value={form.position} onChange={handleChange} className="input-field pl-11 appearance-none">
                    <option value="">Select position</option>
                    {positions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="form-label" htmlFor="det-email">Email *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input id="det-email" name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="you@company.com" className="input-field pl-11" />
              </div>
            </div>

            <button id="btn-submit-details" type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying details...
                </span>
              ) : 'Submit Details & Generate Code →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
