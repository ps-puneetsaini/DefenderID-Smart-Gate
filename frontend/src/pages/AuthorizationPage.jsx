import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, AlertCircle, CheckCircle } from 'lucide-react'
import { verifyCode } from '../services/userService'
import toast from 'react-hot-toast'

export default function AuthorizationPage() {
  const navigate = useNavigate()
  const [digits, setDigits] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleDigit = (val, idx) => {
    const d = [...digits]
    d[idx] = val.replace(/\D/g, '').slice(-1)
    setDigits(d)
    setError('')
    // Auto-focus next
    if (val && idx < 3) {
      document.getElementById(`dig-${idx + 1}`)?.focus()
    }
  }

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      document.getElementById(`dig-${idx - 1}`)?.focus()
    }
  }

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (paste.length === 4) {
      setDigits(paste.split(''))
      e.preventDefault()
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const code = digits.join('')
    if (code.length < 4) {
      setError('Please enter the complete 4-digit code.')
      return
    }
    setLoading(true)
    try {
      await verifyCode(code)
      setSuccess(true)
      toast.success('Authorization successful!')
      setTimeout(() => navigate('/biometric'), 1200)
    } catch (err) {
      const msg = err.response?.data?.message || 'Authorization failed. Incorrect code.'
      setError(msg)
      toast.error(msg)
      setDigits(['', '', '', ''])
      document.getElementById('dig-0')?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-content">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="step-badge">3</div>
          <div>
            <h1 className="text-2xl font-bold text-white">Authorization</h1>
            <p className="text-slate-400 text-sm">Enter the verification code from the previous step</p>
          </div>
        </div>

        <div className="form-card space-y-6">
          <div className="flex justify-center">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              success ? 'bg-accent-500/20 shadow-glow-green' : 'bg-primary-600/20 shadow-glow-primary'
            }`}>
              {success
                ? <CheckCircle size={40} className="text-accent-400" />
                : <KeyRound size={40} className="text-primary-400" />
              }
            </div>
          </div>

          {error && (
            <div className="alert-error">
              <AlertCircle size={16} className="shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="alert-success justify-center text-center">
              <CheckCircle size={16} />
              <p className="text-sm font-medium">Code verified! Redirecting to biometric...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} id="auth-form">
            {/* 4-digit input */}
            <div className="flex justify-center gap-4 mb-8" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  id={`dig-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigit(e.target.value, i)}
                  onKeyDown={e => handleKeyDown(e, i)}
                  className={`w-16 h-16 text-center text-2xl font-bold rounded-xl font-mono
                    bg-dark-600 border-2 transition-all duration-200
                    focus:outline-none focus:scale-110
                    ${d ? 'border-primary-500 text-white shadow-glow-primary' : 'border-dark-400 text-slate-400'}
                    ${success ? 'border-accent-500 text-accent-400' : ''}
                    ${error ? 'border-danger-500' : ''}
                  `}
                />
              ))}
            </div>

            <button id="btn-verify-code" type="submit" disabled={loading || success} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : 'Verify Code →'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs">
            Didn't get a code? <a href="/details" className="text-primary-400 hover:text-primary-300">Go back to details</a>
          </p>
        </div>
      </div>
    </div>
  )
}
