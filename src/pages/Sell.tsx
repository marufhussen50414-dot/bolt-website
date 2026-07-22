import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, LogIn } from 'lucide-react'
import { supabase, type Category, type GameListingInsert } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import TagInput from '../components/TagInput'

const CURRENCIES = ['USD', 'BDT', 'INR', 'PKR', 'PHP', 'BRL', 'EUR', 'GBP']

export default function Sell() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCats, setLoadingCats] = useState(true)

  const [categoryId, setCategoryId] = useState('')
  const [gameName, setGameName] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [accountLevel, setAccountLevel] = useState('')
  const [rankTier, setRankTier] = useState('')
  const [serverRegion, setServerRegion] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let active = true
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (!error && data) {
          const cats = data as Category[]
          setCategories(cats)
          if (cats.length > 0) setCategoryId(cats[0].id)
        }
        setLoadingCats(false)
      })
    return () => {
      active = false
    }
  }, [])

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const isOther = selectedCategory?.slug === 'others'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const resolvedGame = (isOther ? gameName.trim() : selectedCategory?.name || gameName.trim()).trim()
    if (!resolvedGame) {
      setErrorMsg('Please select or enter a game.')
      setStatus('error')
      return
    }
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Title and description are required.')
      setStatus('error')
      return
    }
    const parsedPrice = parseFloat(price)
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMsg('Enter a valid price.')
      setStatus('error')
      return
    }

    setStatus('submitting')
    const payload: GameListingInsert = {
      category_id: categoryId || null,
      game_name: resolvedGame,
      title: title.trim(),
      description: description.trim(),
      price: parsedPrice,
      account_level: accountLevel ? parseInt(accountLevel, 10) : null,
      rank_tier: rankTier.trim() || null,
      server_region: serverRegion.trim() || null,
      images: imageUrl.trim() ? [imageUrl.trim()] : null,
      tags: tags.length > 0 ? tags : null,
    }

    const { data, error } = await supabase
      .from('game_listings')
      .insert(payload)
      .select('id')
      .single()

    if (error || !data) {
      setStatus('error')
      setErrorMsg(error?.message || 'Could not create listing. Please try again.')
      return
    }

    setStatus('success')
    navigate(`/listing/${data.id}`)
  }

  // Auth gate: RLS requires an authenticated seller to insert.
  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <LogIn size={24} />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink-900">Sign in to sell</h1>
        <p className="mt-2 text-sm text-ink-500">
          You need an account to list a game ID for sale.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/signin" state={{ from: '/sell' }} className="btn-primary">
            Sign in
          </Link>
          <Link to="/signup" state={{ from: '/sell' }} className="btn-ghost">
            Create account
          </Link>
        </div>
      </div>
    )
  }

  if (authLoading || loadingCats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Sell an ID</h1>
      <p className="mt-1.5 text-sm text-ink-500">
        List your game account for sale. Tags help buyers find what matters to them.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {/* Game selection — applies to ALL games via categories, not just Free Fire */}
        <div>
          <label className="label" htmlFor="game">Game</label>
          <select
            id="game"
            value={categoryId}
            onChange={() => setGameName('')}
            className="input"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {(isOther || !selectedCategory) && (
          <div className="animate-fade-in">
            <label className="label" htmlFor="gameName">Game name</label>
            <input
              id="gameName"
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Enter the game name"
              className="input"
            />
          </div>
        )}

        <div>
          <label className="label" htmlFor="title">Listing title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Level 75 account with rare skins"
            className="input"
            maxLength={80}
          />
        </div>

        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the account: items, progress, region, etc."
            className="input min-h-[100px] resize-y"
            maxLength={1000}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="price">Price ({currency})</label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="currency">Currency</label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="input"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="level">Account level (optional)</label>
            <input
              id="level"
              type="number"
              min="0"
              value={accountLevel}
              onChange={(e) => setAccountLevel(e.target.value)}
              placeholder="e.g. 75"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="rank">Rank / Tier (optional)</label>
            <input
              id="rank"
              type="text"
              value={rankTier}
              onChange={(e) => setRankTier(e.target.value)}
              placeholder="e.g. Heroic"
              className="input"
              maxLength={40}
            />
          </div>
          <div>
            <label className="label" htmlFor="region">Server region (optional)</label>
            <input
              id="region"
              type="text"
              value={serverRegion}
              onChange={(e) => setServerRegion(e.target.value)}
              placeholder="e.g. Asia"
              className="input"
              maxLength={40}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="imageUrl">Cover image URL (optional)</label>
          <input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="input"
          />
        </div>

        {/* Dynamic tag creation — real input only, no sample/example tags */}
        <TagInput
          tags={tags}
          onChange={setTags}
          label="Tags"
          hint="Add keywords that describe this account (e.g. rare, full access, region). Shown on your listing."
        />

        {status === 'error' && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>Listing created! Redirecting...</span>
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="btn-primary w-full sm:w-auto"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Publishing...
            </>
          ) : (
            'Publish listing'
          )}
        </button>
      </form>
    </div>
  )
}
