'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'

type Job = {
  id: string
  scheduled_at: string
  service_type: string
  status: string
}

type Photo = {
  id: string
  job_id: string
  photo_type: 'before' | 'after'
  image_url: string
  created_at: string
}

export default function PhotosPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [jobs, setJobs] = useState<Job[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState('')
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push('/')
        return
      }
      await Promise.all([fetchJobs(), fetchPhotos()])
      setLoading(false)
    })
  }, [router])

  async function fetchJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, scheduled_at, service_type, status')
      .order('scheduled_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      setJobs(data)
    }
  }

  async function fetchPhotos() {
    const { data, error } = await supabase
      .from('job_photos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setPhotos(data)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedJob) return

    setUploading(true)
    const ext = file.name.split('.').pop() || 'jpg'
    const filePath = `${selectedJob}/${Date.now()}-${photoType}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('job-photos')
      .upload(filePath, file)

    if (uploadError) {
      alert(t('uploadError'))
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('job-photos')
      .getPublicUrl(filePath)

    const { error: insertError } = await supabase.from('job_photos').insert({
      job_id: selectedJob,
      photo_type: photoType,
      image_url: urlData?.publicUrl || '',
    })

    if (insertError) {
      alert(t('uploadError'))
      setUploading(false)
      return
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    await fetchPhotos()
  }

  function jobLabel(id: string) {
    const job = jobs.find((j) => j.id === id)
    if (!job) return t('withoutClient')
    return `${new Date(job.scheduled_at).toLocaleDateString(t('locale'))} · ${
      t('service' + job.service_type) || job.service_type
    }`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <p className="text-[#0A1F44] font-semibold">{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      <header className="bg-[#0A1F44] text-white p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t('appName')}</h1>
          <p className="text-sm text-[#00B4D8]">{t('photos')}</p>
        </div>
        <button
          onClick={() => router.push('/more')}
          className="bg-[#00B4D8] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#0096b8]"
        >
          {t('back')}
        </button>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        {/* Formulário de upload */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4 space-y-3">
          <p className="text-sm font-semibold text-[#0A1F44]">
            📸 {t('uploadPhoto')}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('job')} *
            </label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
            >
              <option value="">{t('selectJob')}</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {jobLabel(j.id)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('photoType')}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPhotoType('before')}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition border ${
                  photoType === 'before'
                    ? 'bg-[#0A1F44] text-white border-[#0A1F44]'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                🔴 {t('before')}
              </button>
              <button
                type="button"
                onClick={() => setPhotoType('after')}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition border ${
                  photoType === 'after'
                    ? 'bg-[#00B4D8] text-white border-[#00B4D8]'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                🟢 {t('after')}
              </button>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedJob || uploading}
            className="w-full bg-[#00B4D8] text-white font-semibold py-2.5 rounded-xl hover:bg-[#0096b8] transition disabled:opacity-50"
          >
            {uploading ? t('uploading') : `⬆️ ${t('choosePhoto')}`}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        {/* Galeria de fotos */}
        <h3 className="text-sm font-semibold text-[#0A1F44] mb-2">
          {t('gallery')} ({photos.length})
        </h3>

        {photos.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">{t('noPhotos')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('noPhotosHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((p) => (
              <div key={p.id} className="bg-white rounded-xl shadow overflow-hidden">
                <img
                  src={p.image_url}
                  alt={p.photo_type}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.photo_type === 'before'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-600'
                    }`}
                  >
                    {p.photo_type === 'before' ? t('before') : t('after')}
                  </span>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {jobLabel(p.job_id)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}