import React, { useState } from 'react';
import { X, Github, Copy, Check, Terminal, DownloadCloud, AlertTriangle, Globe, Rocket, HelpCircle } from 'lucide-react';
import { downloadProjectZip } from '../utils/projectZip';

interface GitHubGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const GitHubGuideModal: React.FC<GitHubGuideModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'errors' | 'pages'>('steps');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      onShowToast('Perintah disalin ke clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      onShowToast('Gagal menyalin perintah');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-2 border-[#275d1d] text-gray-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#275d1d] px-6 py-4 border-b border-[#275d1d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Github className="w-6 h-6 text-white" />
            <div>
              <h3 className="font-extrabold text-base sm:text-lg font-['Montserrat'] tracking-tight text-white">
                Panduan Lengkap Deploy ke GitHub & Online
              </h3>
              <p className="text-xs text-white/80">Solusi anti gagal untuk upload repository dan deploy website</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-black/20 p-1.5 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-100 px-6 pt-3 flex gap-2 border-b border-gray-300 shrink-0">
          <button
            onClick={() => setActiveTab('steps')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'steps'
                ? 'bg-white text-[#275d1d] border-t-2 border-x-2 border-[#275d1d] -mb-[1px]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Langkah Push Git
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pages'
                ? 'bg-white text-[#275d1d] border-t-2 border-x-2 border-[#275d1d] -mb-[1px]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Deploy Website (Live)
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'errors'
                ? 'bg-white text-[#275d1d] border-t-2 border-x-2 border-[#275d1d] -mb-[1px]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Solusi Error Push
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-sm overflow-y-auto">
          {/* Quick ZIP Download Banner */}
          <div className="bg-[#275d1d]/10 border border-[#275d1d]/30 rounded-lg p-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h4 className="font-bold text-[#275d1d] flex items-center gap-1.5 text-xs sm:text-sm">
                <DownloadCloud className="w-4 h-4 text-[#275d1d]" />
                Download Source Code Lengkap (.ZIP)
              </h4>
              <p className="text-[11px] sm:text-xs text-gray-700 mt-0.5">
                Sudah termasuk konfigurasi GitHub Actions, ikon PWA, Tailwind CSS, dan script build siap deploy.
              </p>
            </div>
            <button
              onClick={() => {
                downloadProjectZip();
                onShowToast('Mulai mengunduh file ZIP proyek...');
              }}
              className="px-3.5 py-1.5 bg-[#275d1d] hover:bg-[#1f4a17] text-white font-bold text-xs rounded transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Download ZIP</span>
            </button>
          </div>

          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 text-xs text-amber-900 rounded-r">
                <strong>⚠️ PENTING SAAT MEMBUAT REPO GITHUB:</strong>
                <p className="mt-1">
                  Saat membuat repository di <a href="https://github.com/new" target="_blank" rel="noreferrer" className="underline font-bold">github.com/new</a>, <strong>JANGAN centang</strong> opsi <em>"Add a README file"</em>, <em>".gitignore"</em>, atau <em>"license"</em>. Biarkan repository benar-benar kosong agar tidak terjadi konflik git push.
                </p>
              </div>

              {/* Step 1 */}
              <div className="bg-[#f7f7f7] border border-gray-300 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-[#275d1d]">Langkah 1: Ekstrak file & Buka Terminal di folder tersebut</span>
                  <button
                    onClick={() => handleCopy('git init\ngit add .\ngit commit -m "feat: initial commit cito adventure trip archive"', 'step1')}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
                  >
                    {copiedId === 'step1' ? <Check className="w-3.5 h-3.5 text-[#275d1d]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'step1' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
                <pre className="font-mono text-xs bg-white p-2.5 rounded border border-gray-200 whitespace-pre-wrap leading-relaxed text-gray-800">
{`git init
git add .
git commit -m "feat: initial commit cito adventure trip archive"`}
                </pre>
              </div>

              {/* Step 2 */}
              <div className="bg-[#f7f7f7] border border-gray-300 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-[#275d1d]">Langkah 2: Hubungkan & Push ke GitHub</span>
                  <button
                    onClick={() => handleCopy('git branch -M main\ngit remote add origin https://github.com/USERNAME/NAMA-REPO.git\ngit push -u origin main', 'step2')}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
                  >
                    {copiedId === 'step2' ? <Check className="w-3.5 h-3.5 text-[#275d1d]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'step2' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-600 mb-1.5">
                  *Ganti <strong>USERNAME</strong> dan <strong>NAMA-REPO</strong> dengan username dan nama repository Anda di GitHub:
                </p>
                <pre className="font-mono text-xs bg-white p-2.5 rounded border border-gray-200 whitespace-pre-wrap leading-relaxed text-gray-800">
{`git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main`}
                </pre>
              </div>

              {/* Step 3 token tip */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-700" />
                  GitHub Meminta Password saat Push?
                </p>
                <p className="text-gray-700">
                  GitHub tidak lagi menerima password akun biasa di terminal. Anda harus memasukkan <strong>Personal Access Token (PAT)</strong> sebagai password:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-gray-700 mt-1 pl-1">
                  <li>Buka GitHub → Klik foto profil (kanan atas) → <strong>Settings</strong></li>
                  <li>Scroll paling bawah kiri → <strong>Developer Settings</strong> → <strong>Personal access tokens</strong> → <strong>Tokens (classic)</strong></li>
                  <li>Klik <strong>Generate new token (classic)</strong> → Centang opsi <strong>repo</strong> → Klik Generate</li>
                  <li>Salin token tersebut dan paste sebagai password di terminal saat diminta.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'pages' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3.5 text-xs text-emerald-950 space-y-2">
                <h4 className="font-bold text-sm flex items-center gap-2 text-emerald-800">
                  <Rocket className="w-4 h-4 text-emerald-700" />
                  Cara 1: Deploy Otomatis via GitHub Pages (Gratis)
                </h4>
                <p>
                  Proyek ini sudah dilengkapi file otomatisasi <code>.github/workflows/deploy.yml</code>. Begitu kode berhasil di-push ke GitHub, Anda cukup mengaktifkannya dalam 1 menit:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-gray-800">
                  <li>Buka halaman repository Anda di GitHub.</li>
                  <li>Klik tab <strong>Settings</strong> (ikon gerigi di atas).</li>
                  <li>Di menu sebelah kiri, klik <strong>Pages</strong>.</li>
                  <li>
                    Di bagian <strong>Build and deployment &gt; Source</strong>, ubah dari <em>"Deploy from a branch"</em> menjadi <strong>"GitHub Actions"</strong>.
                  </li>
                  <li>
                    Selesai! Buka tab <strong>Actions</strong> di repo Anda. Dalam waktu 1-2 menit, GitHub akan otomatis meng-compile dan website Anda langsung aktif dengan link <code>https://USERNAME.github.io/NAMA-REPO/</code>.
                  </li>
                </ol>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-3.5 text-xs text-gray-900 space-y-2">
                <h4 className="font-bold text-sm flex items-center gap-2 text-[#275d1d]">
                  <Globe className="w-4 h-4 text-[#275d1d]" />
                  Cara 2: Deploy via Vercel (Paling Mudah, Anti Gagal & Instan)
                </h4>
                <p className="text-gray-700">
                  Jika GitHub Pages terasa rumit atau sering kendala, deploy ke Vercel hanya butuh 3 klik dan langsung aktif dengan SSL gratis:
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-gray-800">
                  <li>Buka <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-[#275d1d] font-bold underline">vercel.com</a> dan login dengan akun GitHub Anda.</li>
                  <li>Klik <strong>Add New...</strong> → <strong>Project</strong>.</li>
                  <li>Pilih repository Cito Adventure yang sudah Anda push ke GitHub.</li>
                  <li>Klik tombol <strong>Deploy</strong>. Website akan live dalam 30 detik!</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-700 font-medium">
                Pilih pesan error yang muncul di terminal Anda untuk melihat solusinya:
              </p>

              {/* Error 1 */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-red-800">1. Error: "Updates were rejected because the remote contains work..."</span>
                  <button
                    onClick={() => handleCopy('git pull origin main --rebase\ngit push -u origin main', 'err1')}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-100 hover:bg-red-200 text-red-900"
                  >
                    {copiedId === 'err1' ? <Check className="w-3 h-3 text-red-800" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'err1' ? 'Tersalin' : 'Salin Perbaikan'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-700 mb-1.5">
                  Penyebab: Anda mencentang "Add README" saat buat repo baru di GitHub. Solusi jalankan perintah ini di terminal:
                </p>
                <pre className="font-mono text-xs bg-white p-2 rounded border border-red-200 text-gray-800">
{`git pull origin main --rebase
git push -u origin main`}
                </pre>
                <p className="text-[11px] text-gray-600 mt-1">
                  Atau jika ingin menimpa langsung: <code>git push -u origin main --force</code>
                </p>
              </div>

              {/* Error 2 */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-red-800">2. Error: "remote origin already exists"</span>
                  <button
                    onClick={() => handleCopy('git remote set-url origin https://github.com/USERNAME/NAMA-REPO.git', 'err2')}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-100 hover:bg-red-200 text-red-900"
                  >
                    {copiedId === 'err2' ? <Check className="w-3 h-3 text-red-800" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'err2' ? 'Tersalin' : 'Salin Perbaikan'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-700 mb-1.5">
                  Penyebab: URL remote sudah pernah disetel sebelumnya. Jalankan ini untuk mengganti URL-nya:
                </p>
                <pre className="font-mono text-xs bg-white p-2 rounded border border-red-200 text-gray-800">
{`git remote set-url origin https://github.com/USERNAME/NAMA-REPO.git`}
                </pre>
              </div>

              {/* Error 3 */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-red-800">3. Error: "src refspec main does not match any"</span>
                  <button
                    onClick={() => handleCopy('git add .\ngit commit -m "initial commit"\ngit branch -M main\ngit push -u origin main', 'err3')}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-100 hover:bg-red-200 text-red-900"
                  >
                    {copiedId === 'err3' ? <Check className="w-3 h-3 text-red-800" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'err3' ? 'Tersalin' : 'Salin Perbaikan'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-700 mb-1.5">
                  Penyebab: Anda belum membuat commit pertama sebelum melakukan git push. Jalankan:
                </p>
                <pre className="font-mono text-xs bg-white p-2 rounded border border-red-200 text-gray-800">
{`git add .
git commit -m "initial commit"
git branch -M main
git push -u origin main`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#f5f5f5] px-6 py-3 border-t border-gray-200 flex justify-between items-center shrink-0">
          <span className="text-xs text-gray-500">
            Base path sudah disetel <code>./</code> sehingga aset tidak akan 404 di GitHub Pages.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-xs font-bold bg-[#275d1d] hover:bg-[#1f4a17] text-white transition-colors cursor-pointer shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

